import { canonicalJson } from "../src/lib/db/canonical";
import { sign } from "node:crypto";
import { databasePayload } from "./database-payload";
const url = process.env.TAPBOUND_DATA_URL,
  key = process.env.TAPBOUND_PRIVATE_KEY;
if (!url || !key) throw Error("Missing Tapbound data service configuration");
const tables = databasePayload();
const text = canonicalJson({ tables }),
  time = String(Date.now());
const signature = sign(
  "RSA-SHA256",
  Buffer.from(time + "\n" + text),
  key.replaceAll("\\n", "\n"),
).toString("base64");
const r = await fetch(url + "/api/sync", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-tapbound-time": time,
    "x-tapbound-signature": signature,
  },
  body: text,
  redirect: "error",
  signal: AbortSignal.timeout(60000),
});
if (!r.ok) throw Error("Database sync failed: " + r.status);
console.log(await r.json());
