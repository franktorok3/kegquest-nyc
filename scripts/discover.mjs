import { respectfulFetch } from "./ingest.mjs";
import { load } from "cheerio";
import fs from "node:fs/promises";
const source = "https://www.nycbrewed.com/breweries";
const html = await respectfulFetch(source),
  $ = load(html);
const existing = JSON.parse(await fs.readFile("src/data/seeds.json", "utf8"));
const known = new Set(
  existing.map((x) => new URL(x.source).hostname.replace(/^www\./, "")),
);
const candidates = [];
$("a[href]").each((_, el) => {
  try {
    const u = new URL($(el).attr("href"), source),
      name = $(el).text().trim();
    if (
      u.protocol === "https:" &&
      !u.hostname.endsWith("nycbrewed.com") &&
      !known.has(u.hostname.replace(/^www\./, "")) &&
      name &&
      !candidates.some((c) => c.url === u.href)
    )
      candidates.push({ name, url: u.href });
  } catch {}
});
await fs.writeFile(
  "src/data/discovery.json",
  JSON.stringify(
    {
      source,
      checkedAt: new Date().toISOString(),
      status: "review_required",
      note: "Untrusted outbound directory links; review brewery identity, location and official source before promotion. Nothing is automatically added to the crawler or public catalog.",
      candidates,
    },
    null,
    2,
  ) + "\n",
);
console.log(candidates.length + " links queued for editorial review");
