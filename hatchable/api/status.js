import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET"];
export default async function handler(req, res) {
  const { rows } = await db.query(
    "SELECT (SELECT count(*) FROM breweries) AS breweries,(SELECT count(*) FROM brewery_locations WHERE visitable) AS active_locations,(SELECT count(*) FROM trails) AS saved_trails,(SELECT count(*) FROM tap_snapshots WHERE status='verified' AND last_successful_verification>now()-interval '72 hours') AS recent_snapshots",
  );
  res.json(rows[0]);
}
