import { db } from "hatchable";
import { verify } from "lib/verify.js";
export const access = "public";
export const methods = ["POST"];
export default async function handler(req, res) {
  if (!(await verify(req)))
    return res.status(401).json({ error: "Unauthorized" });
  const { rows } = await db.query(
    "SELECT id,finished_at,attempted,successful,failed,details FROM ingestion_runs ORDER BY finished_at DESC LIMIT 5",
  );
  res.json({ runs: rows });
}
