import * as cheerio from "cheerio";
import robotsParser from "robots-parser";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const agent = "TapboundBot";
import { lookup } from "node:dns/promises";
import { createHash } from "node:crypto";
const seedRegistry = JSON.parse(
  await fs.readFile(new URL("../src/data/seeds.json", import.meta.url), "utf8"),
);
const allowed = new Set([
  ...seedRegistry.map((s) => s.source),
  "https://www.nycbrewed.com/breweries",
]);
export function assertAllowedUrl(url) {
  const u = new URL(url);
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    u.port ||
    !allowed.has(url)
  )
    throw Error("Source URL is not allowlisted");
  return u;
}
export function publicAddress(address) {
  return !/^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.|224\.|::1$|fc|fd|fe80|::ffff:)/i.test(
    address,
  );
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const policies = new Map();
const last = new Map();
async function fetchWithRetry(url, options) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(20000),
      });
      if (response.status < 500 || attempt === 2) return response;
      await response.body?.cancel();
    } catch (error) {
      if (attempt === 2) throw error;
    }
    await pause(2000 * 2 ** attempt);
  }
}

/** @param {string} url @param {(hostname: string, options: {all: true}) => Promise<Array<{address: string}>>} resolve */
export async function respectfulFetch(url, resolve = lookup) {
  const u = assertAllowedUrl(url);
  const addresses = await resolve(u.hostname, { all: true });
  if (!addresses.length || addresses.some((x) => !publicAddress(x.address)))
    throw Error("Private destination blocked");
  if (u.protocol !== "https:") throw Error("HTTPS required");
  if (!policies.has(u.origin)) {
    const r = await fetchWithRetry(u.origin + "/robots.txt", {
      headers: {
        "User-Agent": agent + "/2.0 (+https://kegquest-nyc.vercel.app/about)",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
    if (r.status !== 404 && !r.ok)
      throw Error("Robots unavailable: " + r.status);
    policies.set(
      u.origin,
      robotsParser(
        u.origin + "/robots.txt",
        r.status === 404 ? "" : await r.text(),
      ),
    );
  }
  const p = policies.get(u.origin);
  if (p.isAllowed(url, agent) === false)
    throw Error("Disallowed by robots.txt");
  const delay = Math.max(1500, (p.getCrawlDelay(agent) || 0) * 1000);
  if (delay > 30000) throw Error("Crawl delay exceeds budget");
  await pause(Math.max(0, delay - (Date.now() - (last.get(u.origin) || 0))));
  last.set(u.origin, Date.now());
  const cachePath = path.join(
    root,
    "work",
    "fetch-cache",
    createHash("sha256").update(url).digest("hex") + ".json",
  );
  let cached = null;
  try {
    cached = JSON.parse(await fs.readFile(cachePath, "utf8"));
  } catch {}
  const conditional = {};
  if (cached?.etag) conditional["If-None-Match"] = cached.etag;
  if (cached?.modified) conditional["If-Modified-Since"] = cached.modified;
  const r = await fetchWithRetry(url, {
    headers: {
      "User-Agent": agent + "/2.0 (+https://kegquest-nyc.vercel.app/about)",
      ...conditional,
    },
    signal: AbortSignal.timeout(20000),
    redirect: "manual",
  });
  if (r.status === 304 && cached?.html) return cached.html;
  if (r.status >= 300 && r.status < 400)
    throw Error("Redirect requires reviewed source URL");
  if (!r.ok) throw Error("HTTP " + r.status);
  if (!r.headers.get("content-type")?.includes("text/html"))
    throw Error("Not HTML");
  const html = await r.text();
  if (html.length > 4000000) throw Error("Page too large");
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(
    cachePath,
    JSON.stringify({
      html,
      etag: r.headers.get("etag"),
      modified: r.headers.get("last-modified"),
    }),
  );
  return html;
}
export function parseDraft(html) {
  const $ = cheerio.load(html);
  const beers = [];
  // Explicit Untappd/Craftpeak draft panels only. Never scan product catalogues.
  $('[data-tab="draft"]').each((_, panel) => {
    $(panel)
      .find(".list-item")
      .each((_, el) => {
        const name = $(el).find(".item-title").first().text().trim();
        const style = $(el).find(".item-descriptor").first().text().trim();
        const abv = $(el)
          .text()
          .match(/(\d+(?:\.\d+)?)\s*%/);
        if (name && style && abv && !beers.some((b) => b.name === name))
          beers.push({ name, style, abv: Number(abv[1]) });
      });
  });
  return beers;
}
export function parseEckhart(html) {
  const $ = cheerio.load(html),
    beers = [];
  $("section.menu-section")
    .filter((_, el) => $(el).find("h2").text().trim() === "On Draft Now")
    .find(".draft-beer")
    .each((_, el) => {
      const name = $(el).find("h3").text().trim(),
        abv = $(el)
          .find(".ibu-abv")
          .text()
          .match(/(\d+(?:\.\d+)?)\s*%/);
      if (name && abv) beers.push({ name, style: name, abv: Number(abv[1]) });
    });
  return beers;
}
async function run() {
  const seeds = JSON.parse(
    await fs.readFile(path.join(root, "src/data/seeds.json"), "utf8"),
  );
  const previous = JSON.parse(
    await fs.readFile(path.join(root, "src/data/breweries.json"), "utf8"),
  );
  const result = [];
  for (const seed of seeds) {
    const checkedAt = new Date().toISOString();
    const old = previous.find((x) => x.id === seed.id);
    let record = {
      ...seed,
      checkedAt,
      verifiedAt: old?.verifiedAt || null,
      menuVerifiedAt:
        old?.menuVerifiedAt ||
        (old?.tapStatus === "verified" ? old.verifiedAt : null),
      status: "unavailable",
      image: old?.image || null,
      beers: old?.beers || [],
      tapStatus: "unavailable",
      hours: old?.hours || null,
      address: old?.address || null,
    };
    try {
      const html = await respectfulFetch(seed.source);
      const $ = cheerio.load(html);
      $("script,style,noscript").remove();
      const text = $("body").text().replace(/\s+/g, " ").trim();
      record.status = "verified";
      record.address = null;
      record.hours = null;
      record.verifiedAt = checkedAt;
      const image = $('meta[property="og:image"]').attr("content");
      if (image) {
        const resolved = new URL(image, seed.source);
        if (resolved.protocol === "https:") record.image = resolved.href;
      }
      // Reviewed literal evidence must still appear on each refresh.
      if (
        seed.addressEvidence &&
        text.toLowerCase().includes(seed.addressEvidence.toLowerCase())
      )
        record.address = seed.displayAddress;
      if (
        seed.hoursEvidence &&
        text.toLowerCase().includes(seed.hoursEvidence.toLowerCase())
      )
        record.hours = seed.hoursEvidence;
      const extracted =
        new URL(seed.source).hostname === "eckhartbeer.com"
          ? parseEckhart(html)
          : new URL(seed.source).hostname === "otherhalfbrewing.com"
            ? parseDraft(html)
            : [];
      record.beers = extracted.length ? extracted : old?.beers || [];
      record.tapStatus = extracted.length ? "verified" : "unavailable";
      if (extracted.length) record.menuVerifiedAt = checkedAt;
      record.note =
        record.tapStatus === "verified"
          ? "Extracted from an explicitly labeled draft section."
          : "No supported, verifiable draft list found on this page.";
      await fs.mkdir(path.join(root, "work/evidence"), { recursive: true });
      await fs.writeFile(
        path.join(root, "work/evidence", seed.id + ".txt"),
        text,
      );
    } catch (e) {
      record.note = e.message;
    }
    record.parserVersion = "tapbound-2";
    record.contentChecksum = createHash("sha256")
      .update(JSON.stringify(record.beers))
      .digest("hex");
    result.push(record);
    console.log(
      JSON.stringify({
        source: seed.id,
        status: record.status,
        tapStatus: record.tapStatus,
        entries: record.beers.length,
        note: record.note,
        checkedAt,
      }),
    );
  }
  await fs.writeFile(
    path.join(root, "src/data/breweries.json"),
    JSON.stringify(result, null, 2) + "\n",
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await run();
