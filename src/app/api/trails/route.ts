import { randomBytes, createHmac } from "node:crypto";
import { saveTrailSchema } from "../../../lib/validation/trail";
import { buildTrail } from "../../../lib/planner";
import { locations } from "../../../lib/catalog";
import { dataRequest } from "../../../lib/db/server";
export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    if (origin && origin !== new URL(req.url).origin)
      return Response.json({ error: "Invalid origin" }, { status: 403 });
    if (Number(req.headers.get("content-length") || 0) > 16000)
      return Response.json({ error: "Request too large" }, { status: 413 });
    const text = await req.text();
    if (text.length > 16000)
      return Response.json({ error: "Request too large" }, { status: 413 });
    const parsed = saveTrailSchema.safeParse(JSON.parse(text));
    if (!parsed.success)
      return Response.json(
        { error: "Check the trail inputs." },
        { status: 400 },
      );
    const input = parsed.data;
    if (
      input.locationIds.some(
        (id) =>
          !locations.some(
            (l) => l.id === id && l.cityId === input.preferences.cityId,
          ),
      )
    )
      return Response.json(
        { error: "Unknown location for this market." },
        { status: 400 },
      );
    const trail = buildTrail(
        input.locationIds,
        input.preferences,
        locations,
        input.name,
      ),
      token = randomBytes(24).toString("hex");
    if(input.format === "stops") trail.format="stops";
    const ip =
      req.headers.get("x-vercel-forwarded-for") ||
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      "local";
    if (!process.env.RATE_LIMIT_SALT) throw Error("DATABASE_NOT_CONFIGURED");
    const key = createHmac("sha256", process.env.RATE_LIMIT_SALT)
      .update(ip)
      .digest("hex");
    await dataRequest({ action: "save", token, rateKey: key, payload: trail });
    console.info(
      JSON.stringify({ event: "trail_saved", stops: trail.stops.length }),
    );
    return Response.json({ token, url: "/trails/" + token }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message === "RATE_LIMITED")
      return Response.json(
        { error: "Too many saves. Please try again in an hour." },
        { status: 429 },
      );
    if (e instanceof SyntaxError)
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    return Response.json(
      {
        error:
          "Trail saving is temporarily unavailable. Your draft is still saved on this device.",
      },
      { status: 503 },
    );
  }
}
