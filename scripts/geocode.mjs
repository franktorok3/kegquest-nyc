import fs from "node:fs/promises";
const rows = JSON.parse(await fs.readFile("src/data/breweries.json"));
const meta = JSON.parse(await fs.readFile("src/data/location-meta.json"));
for (const r of rows) r.address ||= meta[r.id]?.address;
let cache = {};
try {
  cache = JSON.parse(await fs.readFile("src/data/geocodes.json"));
} catch {}
for (const r of rows.filter((r) => r.address)) {
  if (cache[r.id]?.address === r.address) continue;
  const url =
    "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?" +
    new URLSearchParams({
      address: r.address,
      benchmark: "Public_AR_Current",
      format: "json",
    });
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw Error("HTTP " + response.status);
    const data = await response.json();
    const match = data.result?.addressMatches?.[0];
    if (match) {
      cache[r.id] = {
        address: r.address,
        lat: match.coordinates.y,
        lng: match.coordinates.x,
        matchedAddress: match.matchedAddress,
        source: url,
        checkedAt: new Date().toISOString(),
        precision: "street-address interpolation",
      };
      console.log(r.id, match.matchedAddress);
    } else console.log(r.id, "No match");
  } catch (e) {
    console.log(r.id, e.message);
  }
  await new Promise((r) => setTimeout(r, 1100));
}
await fs.writeFile(
  "src/data/geocodes.json",
  JSON.stringify(cache, null, 2) + "\n",
);
