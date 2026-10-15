export const access = "public";
export const methods = ["GET"];
export default async function handler(req, res) {
  res.json({ service: "Tapbound data", status: "ok" });
}
