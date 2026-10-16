import type { Location } from "./catalog";
import { distanceKm, type Coordinates } from "./geography";

export type SuggestStopsOptions = {
  origin?: Coordinates;
  neighborhood?: string;
  selectedIds?: string[];
  query?: string;
  limit?: number;
  maxDistanceKm?: number;
};

export type SuggestedStop = {
  location: Location;
  /** Straight-line distance from the supplied origin or the chosen taproom anchor. */
  distanceKm: number | null;
};

function normalized(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function coordinates(value: { lat: number | null; lng: number | null } | undefined): Coordinates | null {
  if (
    !value || typeof value.lat !== "number" || typeof value.lng !== "number" ||
    !Number.isFinite(value.lat) || !Number.isFinite(value.lng) ||
    Math.abs(value.lat) > 90 || Math.abs(value.lng) > 180
  ) return null;
  return { lat: value.lat, lng: value.lng };
}

function byName(a: Location, b: Location) {
  return a.name.localeCompare(b.name, "en") || a.id.localeCompare(b.id, "en");
}

/** Suggestions describe geography only; opening hours and beer availability stay source-backed in the UI. */
export function suggestStops(all: Location[], options: SuggestStopsOptions = {}): SuggestedStop[] {
  const places = all.filter((location) => location.visitable && location.cityId === "nyc");
  const selectedIds = options.selectedIds ?? [];
  const selected = new Set(selectedIds);
  const origin = coordinates(options.origin);
  const neighborhood = origin ? "" : normalized(options.neighborhood ?? "");
  const neighborhoodPlaces = neighborhood
    ? places.filter((location) => normalized(location.neighborhood) === neighborhood).sort(byName)
    : [];
  const anchor = origin ?? (neighborhood
    ? coordinates(neighborhoodPlaces.find((location) => coordinates(location)))
    : coordinates(places.find((location) => location.id === selectedIds.at(-1))));
  const query = normalized(options.query ?? "");
  const terms = query.split(" ").filter(Boolean);
  const maxDistance = Number.isFinite(options.maxDistanceKm) && (options.maxDistanceKm ?? 0) > 0
    ? options.maxDistanceKm! : 3;
  const limit = Number.isFinite(options.limit) ? Math.max(0, Math.floor(options.limit!)) : 6;

  return places
    .filter((location) => !selected.has(location.id))
    .filter((location) => {
      const text = normalized(`${location.name} ${location.neighborhood} ${location.borough}`);
      return terms.every((term) => text.includes(term));
    })
    .map((location) => {
      const point = coordinates(location);
      return { location, distanceKm: anchor && point ? distanceKm(anchor, point) : null };
    })
    .filter((suggestion) => {
      // An explicit lookup searches the city, even beyond the current route's cluster.
      if (query) return true;
      const inNeighborhood = neighborhood && normalized(suggestion.location.neighborhood) === neighborhood;
      if (anchor) return suggestion.distanceKm === null
        ? Boolean(inNeighborhood)
        : suggestion.distanceKm <= maxDistance;
      // Unknown neighborhoods should not silently turn into unrelated city-wide suggestions.
      return neighborhood ? Boolean(inNeighborhood) : true;
    })
    .sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm !== null) return 1;
      if (a.distanceKm !== null && b.distanceKm === null) return -1;
      const neighborhoodOrder = Number(normalized(b.location.neighborhood) === neighborhood) -
        Number(normalized(a.location.neighborhood) === neighborhood);
      return neighborhoodOrder || (a.distanceKm ?? 0) - (b.distanceKm ?? 0) || byName(a.location, b.location);
    })
    .slice(0, limit);
}
