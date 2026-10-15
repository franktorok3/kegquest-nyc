# Architecture

Browser → Next.js on Vercel → signed HTTPS API → Hatchable PostgreSQL.

The browse catalog is a tested, versioned JSON snapshot committed with the app. This keeps discovery available if the database is temporarily unavailable. The ingestion sync preserves the same data in normalized tables and append-only timestamped snapshots. Shared trails are stored/read live from the database and never depend on another browser's localStorage.

The national schema separates `states`, `cities`, `neighborhoods`, `breweries` (brands), `brewery_locations`, `sources`, `beers`, `tap_snapshots`, `tap_entries`, `trails`, `trail_stops`, `ingestion_runs` and `rate_limits`. Cities carry time zones; borough is nullable neighborhood/location metadata, not the national geography key. Other Half locations share one brand. Unknown producer attribution remains null because guest taps may be present. Unsupported markets stay inactive.

The applied migration is `hatchable/migrations/001_national_schema.sql`. The dedicated Hatchable application schema provides isolation. Table RLS is enabled; its owner SDK performs privileged queries inside signed handlers. There is no browser database credential or anonymous raw-table API. The signed backend is the trust boundary, not a client-provided owner claim.

The server validates inputs with Zod, rejects duplicate and unknown stops, recomputes times, and creates a 192-bit random share token. Requests sign timestamp plus canonical serialized body with RSA-SHA256. The backend accepts signatures within 60 seconds and validates the operation. Trail writes and a per-IP-HMAC hourly limit are atomic in one transaction. Share tokens are bearer read links; anyone with the link can view it. No login, personal profiles or precise user-location storage is implemented. Read-only links cannot modify or delete a trail.

Style matching normalizes families without overwriting original source text. Recommendations score style coverage, menu freshness, opening status and distance, then fit a greedy geographic sequence within the time budget. They are deterministic; no language model invents beers or geography. Travel uses straight-line distance with mode multipliers and buffers, visibly labeled as planning allowances. Dashed map lines are not routed paths.

Regular hours support cross-midnight intervals and explicit dated exceptions. Hours older than seven days become unknown. Holiday exceptions require evidence. Arrival/departure checks warn about closing conflicts. A recommendation cannot guarantee service or tap availability.
