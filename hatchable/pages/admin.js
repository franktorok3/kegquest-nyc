import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET"];
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export default async function handler(req, res) {
  const { rows } = await db.query(
    "SELECT finished_at,attempted,successful,failed,details FROM ingestion_runs ORDER BY finished_at DESC LIMIT 1",
  );
  const r = rows[0];
  const { rows: counts } = await db.query(
    "SELECT count(*) AS verified_locations, count(*) FILTER(WHERE visitable) AS active_locations, count(*) FILTER(WHERE record->>'tapStatus'='verified' AND (record->>'menuVerifiedAt')::timestamptz>now()-interval '72 hours') AS current_menus FROM brewery_locations",
  );
  res.setHeader("Content-Type", "text/html");
  res.send(
    '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tapbound operations</title><style>body{font:15px system-ui;background:#f6f4ee;color:#252823;margin:40px auto;padding:0 22px;max-width:1000px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{padding:12px;border-bottom:1px solid #ddd;text-align:left}pre{white-space:pre-wrap}</style></head><body><h1>Tapbound operations</h1><p>Admin-only source diagnostics</p><pre>' +
      esc(JSON.stringify(counts[0], null, 2)) +
      "</pre><p>Last refresh: " +
      esc(r?.finished_at || "Not yet synchronized") +
      " · Attempted " +
      esc(r?.attempted) +
      " · Source fetches succeeded " +
      esc(r?.successful) +
      " · Failed " +
      esc(r?.failed) +
      "</p><table><tr><th>Source</th><th>Menu status</th><th>Entries</th><th>Last successful menu</th><th>Notes</th></tr>" +
      (r?.details || [])
        .map(
          (s) =>
            "<tr><td>" +
            esc(s.id) +
            "</td><td>" +
            esc(s.status) +
            "</td><td>" +
            esc(s.entries) +
            "</td><td>" +
            esc(s.menuVerifiedAt) +
            "</td><td>" +
            esc(s.note) +
            "</td></tr>",
        )
        .join("") +
      "</table></body></html>",
  );
}
