import { db } from "hatchable";
import { verify } from "lib/verify.js";
export const access = "public";
export const methods = ["POST"];
export default async function handler(req, res) {
  if (!(await verify(req)))
    return res.status(401).json({ error: "Unauthorized" });
  const { action, token, payload, rateKey } = req.body || {};
  if (!/^[a-f0-9]{48}$/.test(token || ""))
    return res.status(400).json({ error: "Invalid token" });
  if (action === "read") {
    const { rows } = await db.query(
      "SELECT payload FROM trails WHERE share_token=$1 LIMIT 1",
      [token],
    );
    return res.json({ trail: rows[0]?.payload || null });
  }
  if (
    action !== "save" ||
    !payload ||
    typeof payload.name !== "string" ||
    payload.name.length > 80 ||
    !Array.isArray(payload.stops) ||
    payload.stops.length < 1 ||
    payload.stops.length > 8 ||
    !/^[a-f0-9]{64}$/.test(rateKey || "")
  )
    return res.status(400).json({ error: "Invalid trail" });
  const tid = crypto.randomUUID();
  const stops = payload.stops;
  if (new Set(stops.map((s) => s.locationId)).size !== stops.length)
    return res.status(400).json({ error: "Duplicate stop" });
  const statements = [
    {
      sql: "INSERT INTO rate_limits(key,count) VALUES($1,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.window_start < now()-interval '1 hour' THEN 1 ELSE rate_limits.count+1 END, window_start=CASE WHEN rate_limits.window_start < now()-interval '1 hour' THEN now() ELSE rate_limits.window_start END",
      params: [rateKey],
    },
    {
      sql: "SELECT CASE WHEN count>20 THEN 1/(count-count) ELSE 1 END FROM rate_limits WHERE key=$1",
      params: [rateKey],
    },
    {
      sql: "INSERT INTO trails(id,name,city_id,travel_mode,start_time,planned_date,estimated_duration,share_token,payload) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)",
      params: [
        tid,
        payload.name,
        payload.cityId,
        payload.mode,
        payload.startTime,
        payload.date,
        payload.totalMinutes,
        token,
        JSON.stringify(payload),
      ],
    },
    ...stops.map((s) => ({
      sql: "INSERT INTO trail_stops(trail_id,location_id,position,estimated_arrival,estimated_departure,visit_minutes,travel_estimate,notes) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8)",
      params: [
        tid,
        s.locationId,
        s.position,
        s.arrival,
        s.departure,
        s.visitMinutes,
        JSON.stringify(s.travel),
        s.warning,
      ],
    })),
  ];
  try {
    await db.transaction(statements);
    return res.status(201).json({ token });
  } catch (e) {
    if (String(e).includes("division by zero"))
      return res.status(429).json({ error: "RATE_LIMITED" });
    console.error("trail_save_failed");
    return res.status(500).json({ error: "Save failed" });
  }
}
