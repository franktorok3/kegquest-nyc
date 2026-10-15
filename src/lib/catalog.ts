import raw from "../data/breweries.json";
import metaJson from "../data/location-meta.json";
import geoJson from "../data/geocodes.json";
import marketsJson from "../data/markets.json";
import { normalizeStyle } from "./matching/styles";
import type { Schedule } from "./hours";
export type Beer = {
  name: string;
  style: string;
  abv?: number;
  family: string;
  price?: string;
  serving: "draft";
  producer?: string;
};
export type Location = {
  status: string;
  id: string;
  breweryId: string;
  name: string;
  cityId: string;
  borough: string;
  neighborhood: string;
  source: string;
  menuSource: string;
  description: string | null;
  checkedAt: string;
  verifiedAt: string | null;
  menuVerifiedAt: string | null;
  tapStatus: string;
  note: string;
  beers: Beer[];
  image: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  coordinateSource: string | null;
  hours: string | null;
  hoursCheckedAt: string | null;
  schedule: Schedule | null;
  timeZone: string;
  visitStatus: string;
  visitable: boolean;
  exceptions: { date: string; interval: number[] | null }[];
  amenities: {
    food: boolean | null;
    outdoor: boolean | null;
    indoor: boolean | null;
    pets: boolean | null;
    accessibility: string | null;
  };
};
type Meta = {
  breweryId?: string;
  cityId: string;
  timeZone: string;
  visitable: boolean;
  visitStatus: string;
  schedule: Schedule | null;
  hoursEvidence?: string | null;
  exceptions: Location["exceptions"];
  amenities: Location["amenities"];
  address?: string;
  addressSource?: string;
  addressVerifiedAt?: string;
};
const meta = metaJson as Record<string, Meta>,
  geo = geoJson as Record<string, { lat: number; lng: number; source: string }>;
export const markets = marketsJson;
export const catalog: Location[] = raw.map((r) => {
  const m = meta[r.id],
    g = geo[r.id];
  const address = r.address || m?.address || null;
  const matchedHours =
    r.status === "verified" && !!r.hours && r.hours === m?.hoursEvidence;
  return {
    ...r,
    breweryId:
      m?.breweryId || (r.id.startsWith("other-half") ? "other-half" : r.id),
    menuSource: r.menuSource || r.source,
    description: r.description || null,
    cityId: m?.cityId || "nyc",
    timeZone: m?.timeZone || "America/New_York",
    menuVerifiedAt: r.menuVerifiedAt as string | null,
    address,
    lat: g?.lat || null,
    lng: g?.lng || null,
    coordinateSource: g?.source || null,
    visitable: !!(m?.visitable && address && r.status === "verified"),
    visitStatus: m?.visitStatus || "unverified_candidate",
    schedule: matchedHours ? m?.schedule || null : null,
    hoursCheckedAt: matchedHours ? r.verifiedAt : null,
    exceptions: m?.exceptions || [],
    amenities: m?.amenities || {
      food: null,
      outdoor: null,
      indoor: null,
      pets: null,
      accessibility: null,
    },
    beers: r.beers.map((b) => ({
      ...b,
      family: normalizeStyle(b.style),
      serving: "draft" as const,
    })),
  };
});
export const locations = catalog.filter(
  (r) => r.address && r.visitStatus !== "retail_shop",
);
export const visitableLocations = locations.filter((r) => r.visitable);
export function freshness(
  b: Pick<Location, "menuVerifiedAt" | "tapStatus">,
  now = Date.now(),
) {
  if (!b.menuVerifiedAt || b.tapStatus !== "verified") return "Unavailable";
  const age = now - Date.parse(b.menuVerifiedAt);
  return age <= 24 * 3600000
    ? "Fresh"
    : age <= 72 * 3600000
      ? "Recently checked"
      : "Stale";
}
export function currentMenu(b: Location, now = Date.now()) {
  return ["Fresh", "Recently checked"].includes(freshness(b, now));
}
export function directions(b: Location) {
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(b.address || b.name)
  );
}
