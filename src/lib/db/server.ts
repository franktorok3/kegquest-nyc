import "server-only";
import { canonicalJson } from "./canonical";
import { sign } from "node:crypto";
export function dbConfigured() {
  return !!(process.env.TAPBOUND_DATA_URL && process.env.TAPBOUND_PRIVATE_KEY);
}
export async function dataRequest(body: unknown) {
  if (!dbConfigured()) throw Error("DATABASE_NOT_CONFIGURED");
  const text = canonicalJson(body),
    timestamp = String(Date.now());
  const signature = sign(
    "RSA-SHA256",
    Buffer.from(timestamp + "\n" + text),
    process.env.TAPBOUND_PRIVATE_KEY!.replaceAll("\\n", "\n"),
  ).toString("base64");
  const res = await fetch(process.env.TAPBOUND_DATA_URL + "/api/trails", {
    method: "POST",
    body: text,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-tapbound-time": timestamp,
      "x-tapbound-signature": signature,
    },
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (res.status === 429) throw Error("RATE_LIMITED");
  if (!res.ok) {
    console.error(
      JSON.stringify({ event: "data_service_failed", status: res.status }),
    );
    throw Error("DATABASE_REQUEST_FAILED");
  }
  return await res.json();
}
