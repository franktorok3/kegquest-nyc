// Stable JSON makes signatures independent of JSON object key ordering across gateways.
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return "[" + value.map(canonicalJson).join(",") + "]";
  return (
    "{" +
    Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => JSON.stringify(k) + ":" + canonicalJson(v))
      .join(",") +
    "}"
  );
}
