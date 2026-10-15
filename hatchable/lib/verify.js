// Stable JSON makes signatures independent of JSON object key ordering across gateways.
function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return "[" + value.map(canonicalJson).join(",") + "]";
  return (
    "{" +
    Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => JSON.stringify(k) + ":" + canonicalJson(v))
      .join(",") +
    "}"
  );
}

import { createVerify } from "node:crypto";
const publicKey =
  "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwonTCyUDk4x84NKRijVo\n9W7vCEdersmBjXrJk4eoVmWJao1d15MIjxd3D6VSEnR3kVas/EowmLbM5qqOHP7/\ngkm/LlvxL8C4SyfJohKGv3HtjmbS2bfriyC94XHq6/lfhZdT9gsxU2AJfXG2ZWpK\nSkxEAHM49j8pOpMmVNVwOK8jEww8i901uSvCHEIdASrG/ql23OwFdNK/0dxpG3ni\n3sTBvGt4Si/117H2//vwobTFFpmL1pDz8aGKVk1C3DUGCCMb1V98qWUxaxz5kAzO\ndNF4f4er2I3bsCtBMxrRV7cAf9oPHrvg9fri3R1qd4h7jQQIoXSMSyySR5H3En9z\nuwIDAQAB\n-----END PUBLIC KEY-----\n";
export async function verify(req) {
  try {
    const timestamp = req.headers["x-tapbound-time"],
      signature = req.headers["x-tapbound-signature"];
    if (
      !timestamp ||
      !signature ||
      Math.abs(Date.now() - Number(timestamp)) > 60000
    )
      return false;
    const verifier = createVerify("RSA-SHA256");
    verifier.update(timestamp + "\n" + canonicalJson(req.body || {}));
    verifier.end();
    return verifier.verify(publicKey, signature, "base64");
  } catch (e) {
    console.error("signature_verification_failed", String(e));
    return false;
  }
}
