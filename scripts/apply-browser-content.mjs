import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseBrowserMenu } from "../ingestion/adapters/browser-menus.mjs";
import { load } from "cheerio";
const read = async (p) => JSON.parse(await fs.readFile(p, "utf8"));
const reviews = await read("src/data/browser-review.json"),
  rows = await read("src/data/breweries.json"),
  seeds = await read("src/data/seeds.json"),
  meta = await read("src/data/location-meta.json");
const norm = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();
async function evidence(id) {
  const e = await read("work/browser-evidence/" + id + ".json");
  if (Date.now() - Date.parse(e.checkedAt) > 6 * 3600000)
    throw Error("Browser evidence too old");
  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "America/New_York",
  }).format(new Date(e.checkedAt));
  return { ...e, text: e.text.replace(/\bToday\b/g, day) };
}
for (const r of rows) {
  r.menuSource ||= r.source;
  r.description ||= null;
}
let updated = 0;
for (const review of reviews) {
  let r = rows.find((x) => x.id === review.id);
  const m = meta[review.id] || {
    cityId: "nyc",
    timeZone: "America/New_York",
    schedule: null,
    exceptions: [],
    amenities: {
      food: null,
      outdoor: null,
      indoor: null,
      pets: null,
      accessibility: null,
    },
  };
  m.breweryId = review.breweryId;
  m.amenities = {
    food: null,
    outdoor: null,
    indoor: null,
    pets: null,
    accessibility: null,
  };
  try {
    const e = await evidence(review.evidenceId);
    if (e.source !== review.source) throw Error("Source mismatch");
    if (!norm(e.text).includes(norm(review.addressEvidence)))
      throw Error("Address evidence changed");
    const seed = {
      id: review.id,
      name: review.name,
      borough: review.borough,
      neighborhood: review.neighborhood,
      source: review.source,
      addressEvidence: review.addressEvidence,
      displayAddress: review.address,
      ...(review.hoursEvidence ? { hoursEvidence: review.hoursEvidence } : {}),
    };
    const index = seeds.findIndex((s) => s.id === review.id);
    if (index < 0) seeds.push(seed);
    else seeds[index] = { ...seeds[index], ...seed };
    if (!r) {
      r = {
        ...seed,
        beers: [],
        menuSource: review.menuSource || review.source,
        menuVerifiedAt: null,
        tapStatus: "unavailable",
        note: "No supported, verified draft list found.",
        image: null,
      };
      rows.push(r);
    }
    Object.assign(r, seed, {
      status: "verified",
      address: review.address,
      checkedAt: e.checkedAt,
      verifiedAt: e.checkedAt,
      description: review.description || r.description || null,
      browserVerifiedAt: e.checkedAt,
      detailEvidence: review.source,
      menuSource: review.menuSource || r.menuSource || review.source,
    });
    if (review.exceptions) m.exceptions = review.exceptions;
    m.visitable = review.visitable;
    m.visitStatus = review.visitStatus;
    if (
      review.hoursEvidence &&
      norm(e.text).includes(norm(review.hoursEvidence))
    ) {
      r.hours = review.hoursEvidence;
      m.hoursEvidence = review.hoursEvidence;
      m.schedule = review.schedule;
    } else {
      r.hours = null;
      m.schedule = null;
    }
    for (const [k, v] of Object.entries(review.amenityEvidence || {}))
      if (norm(e.text).includes(norm(v))) m.amenities[k] = true;
    if (review.foodSourceEvidence) {
      const food = await evidence(review.foodSourceEvidence.id);
      if (norm(food.text).includes(norm(review.foodSourceEvidence.text)))
        m.amenities.food = true;
    }
    m.amenitiesCheckedAt = e.checkedAt;
    m.amenitiesSource = review.source;
    const $ = load(
      await fs.readFile(
        "work/browser-evidence/" + review.evidenceId + ".html",
        "utf8",
      ),
    );
    const image = $('meta[property="og:image"]').attr("content");
    if (image && image.startsWith("https://")) r.image = image;
    if (!r.image) {
      const candidate = e.images.find(
        (x) =>
          /taproom|brewery|interior/i.test(x.alt) &&
          x.url.startsWith("https://"),
      );
      if (candidate) r.image = candidate.url;
    }
    if (review.menuEvidenceId) {
      try {
        const menu = await evidence(review.menuEvidenceId);
        const beers = parseBrowserMenu(
          review.adapter,
          await fs.readFile(
            "work/browser-evidence/" + review.menuEvidenceId + ".html",
            "utf8",
          ),
        );
        if (!beers.length) throw Error("No verified draft entries");
        r.beers = beers;
        r.tapStatus = "verified";
        r.menuVerifiedAt = menu.checkedAt;
        r.menuSource = menu.source;
        r.note =
          "Verified from the rendered, location-specific draft menu with Playwright. Packaged drinks are excluded.";
      } catch (err) {
        r.tapStatus = "unavailable";
        r.note = "Browser menu verification failed: " + err.message;
      }
    }
    r.parserVersion = "tapbound-browser-3";
    r.contentChecksum = createHash("sha256")
      .update(JSON.stringify(r.beers))
      .digest("hex");
    updated++;
  } catch (err) {
    if (r && review.menuEvidenceId) {
      r.tapStatus = "unavailable";
      r.note = "Browser source verification failed: " + err.message;
    }
    console.log(review.id, err.message);
  }
  meta[review.id] = m;
}
// Independently reviewed facilities at existing locations.
for (const [id, props] of Object.entries({
  "threes-gowanus": { food: "Kitchen", outdoor: "sidewalk seating" },
  "kills-boro": { food: "Knead is a full restaurant" },
})) {
  try {
    const e = await evidence(id);
    for (const [k, v] of Object.entries(props))
      if (norm(e.text).includes(norm(v))) meta[id].amenities[k] = true;
    meta[id].amenitiesCheckedAt = e.checkedAt;
    meta[id].amenitiesSource = e.source;
  } catch {}
}
for (const [file, data] of [
  ["src/data/breweries.json", rows],
  ["src/data/seeds.json", seeds],
  ["src/data/location-meta.json", meta],
])
  await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n");
console.log(
  "Browser-reviewed locations applied:",
  updated,
  "current draft listings:",
  rows
    .filter((x) => x.tapStatus === "verified")
    .reduce((n, x) => n + x.beers.length, 0),
);
