import { db } from "hatchable";
import { verify } from "lib/verify.js";
export const access = "public";
export const methods = ["POST"];
const columns = {
  states: ["id", "name", "abbreviation", "country"],
  cities: [
    "id",
    "name",
    "state_id",
    "time_zone",
    "center_lat",
    "center_lng",
    "active",
  ],
  neighborhoods: ["id", "city_id", "name", "borough", "boundary"],
  breweries: [
    "id",
    "name",
    "slug",
    "website",
    "logo_url",
    "description",
    "classification",
    "verification_status",
    "source_url",
    "verified_at",
  ],
  brewery_locations: [
    "id",
    "brewery_id",
    "name",
    "slug",
    "address",
    "city_id",
    "state_id",
    "postal_code",
    "neighborhood_id",
    "borough",
    "lat",
    "lng",
    "phone",
    "website",
    "opening_hours",
    "time_zone",
    "amenities",
    "image_url",
    "visit_status",
    "visitable",
    "verified_at",
    "source_url",
    "record",
  ],
  sources: ["id", "location_id", "url", "reliability", "adapter"],
  beers: [
    "id",
    "name",
    "producer_id",
    "original_style",
    "style_family",
    "abv",
    "ibu",
    "description",
    "source_url",
  ],
  tap_snapshots: [
    "id",
    "location_id",
    "source_id",
    "collected_at",
    "last_successful_verification",
    "parser_version",
    "checksum",
    "status",
    "entry_count",
    "error",
  ],
  tap_entries: [
    "id",
    "location_id",
    "beer_id",
    "serving_format",
    "pour_size",
    "price",
    "availability",
    "source_url",
    "observed_at",
    "snapshot_id",
  ],
  ingestion_runs: [
    "id",
    "started_at",
    "finished_at",
    "status",
    "attempted",
    "successful",
    "failed",
    "details",
  ],
};
export default async function handler(req, res) {
  if (!(await verify(req)))
    return res.status(401).json({ error: "Unauthorized" });
  const tables = req.body?.tables;
  if (!tables || typeof tables !== "object")
    return res.status(400).json({ error: "Invalid snapshot" });
  const statements = [];
  let count = 0;
  for (const [table, cols] of Object.entries(columns)) {
    const rows = tables[table];
    if (!Array.isArray(rows) || rows.length > 5000)
      return res.status(400).json({ error: "Invalid table rows" });
    if (!rows.length) continue;
    count += rows.length;
    const list = cols.join(",");
    const updates = cols
      .filter((c) => c !== "id")
      .map((c) => c + "=EXCLUDED." + c)
      .join(",");
    statements.push({
      sql:
        "INSERT INTO " +
        table +
        "(" +
        list +
        ") SELECT " +
        list +
        " FROM jsonb_populate_recordset(NULL::" +
        table +
        ",$1::jsonb) ON CONFLICT(id) DO UPDATE SET " +
        updates,
      params: [JSON.stringify(rows)],
    });
  }
  try {
    await db.transaction(statements);
    return res.json({ synced: count, tables: statements.length });
  } catch (e) {
    console.error("sync_failed", String(e).slice(0, 300));
    return res.status(500).json({ error: "Database sync failed" });
  }
}
