import { Location, currentMenu } from "./catalog";
import { matchesStyle } from "./matching/styles";
import { openingStatus } from "./hours";
import { localDateTime, distanceKm } from "./geography";
import { fallbackRouter, TravelEstimate } from "./routing";
import { Preferences } from "./validation/trail";
export const scoringWeights = {
  style: 8,
  matchingBeer: 1,
  fresh: 3,
  open: 5,
  closed: -40,
  distance: -8,
};
export type Stop = {
  locationId: string;
  position: number;
  arrival: string;
  departure: string;
  visitMinutes: number;
  travel: TravelEstimate | null;
  warning: string | null;
  reason?: string;
};
export type Trail = {
  name: string;
  cityId: string;
  mode: Preferences["mode"];
  date: string;
  startTime: string;
  totalMinutes: number;
  preferences: Preferences;
  stops: Stop[];
};
export function buildTrail(
  ids: string[],
  p: Preferences,
  all: Location[],
  name = "My brewery trail",
): Trail {
  const places = ids
    .map((id) => all.find((b) => b.id === id))
    .filter((b): b is Location => !!b);
  const tz = places[0]?.timeZone || "America/New_York";
  let time = localDateTime(p.date, p.startTime, tz).getTime();
  const start = time;
  let previous: Location | undefined;
  const stops = places.map((b, position) => {
    const travel =
      previous?.lat && previous.lng && b.lat && b.lng
        ? fallbackRouter.estimate(
            { lat: previous.lat, lng: previous.lng },
            { lat: b.lat, lng: b.lng },
            p.mode,
          )
        : null;
    time += (travel?.minutes || 0) * 60000;
    const arrival = new Date(time),
      departure = new Date(time + p.visitMinutes * 60000);
    const status = openingStatus(b, arrival),
      end = openingStatus(b, new Date(departure.getTime() - 60000));
    let warning =
      status === "Closed"
        ? "Closed or not open for regular visits at your estimated arrival."
        : status === "Unknown"
          ? "Opening hours are unverified. Confirm directly before visiting."
          : end === "Closed"
            ? "May close before the end of your planned visit."
            : null;
    if (previous && !travel)
      warning =
        (warning ? warning + " " : "") +
        "Travel allowance unavailable; coordinates are missing.";
    time = departure.getTime();
    previous = b;
    return {
      locationId: b.id,
      position,
      arrival: arrival.toISOString(),
      departure: departure.toISOString(),
      visitMinutes: p.visitMinutes,
      travel,
      warning,
    };
  });
  return {
    name,
    cityId: p.cityId,
    mode: p.mode,
    date: p.date,
    startTime: p.startTime,
    totalMinutes: Math.round((time - start) / 60000),
    preferences: p,
    stops,
  };
}
export function recommend(p: Preferences, all: Location[]) {
  let candidates = all.filter(
    (b) =>
      b.visitable &&
      b.cityId === p.cityId &&
      b.lat &&
      b.lng &&
      (!p.food || b.amenities.food === true) &&
      (!p.outdoor || b.amenities.outdoor === true) &&
      (!p.excludedStyles.length ||
        !currentMenu(b) ||
        !b.beers.some((beer) =>
          p.excludedStyles.some((s) => matchesStyle(beer.style, s)),
        )),
  );
  const chosen: Location[] = [];
  const reasons: Record<string, string> = {};
  while (chosen.length < p.maximumStops && candidates.length) {
    const previous = chosen.at(-1),
      anchor =
        previous ||
        candidates.find((b) => b.neighborhood === p.neighborhood) ||
        candidates[0];
    const scored = candidates
      .filter(
        (b) =>
          chosen.length > 0 ||
          !p.neighborhood ||
          b.neighborhood === p.neighborhood,
      )
      .map((b) => {
        const matching = currentMenu(b)
          ? b.beers.filter((beer) =>
              p.preferredStyles.some((s) => matchesStyle(beer.style, s)),
            ).length
          : 0;
        const dist =
          anchor.lat && anchor.lng && b.lat && b.lng
            ? distanceKm(
                { lat: anchor.lat, lng: anchor.lng },
                { lat: b.lat, lng: b.lng },
              )
            : 0;
        const proposed = buildTrail([...chosen.map((x) => x.id), b.id], p, all);
        const arrival = openingStatus(
          b,
          new Date(proposed.stops.at(-1)!.arrival),
        );
        const score =
          (matching ? scoringWeights.style : 0) +
          matching * scoringWeights.matchingBeer +
          (currentMenu(b) ? scoringWeights.fresh : 0) +
          (arrival === "Open"
            ? scoringWeights.open
            : arrival === "Closed"
              ? scoringWeights.closed
              : 0) +
          dist * scoringWeights.distance;
        return { b, score, matching, dist, proposed, arrival };
      })
      .filter(
        (x) =>
          x.proposed.totalMinutes <= p.availableMinutes &&
          x.arrival !== "Closed",
      )
      .sort((a, b) => b.score - a.score || a.b.id.localeCompare(b.b.id));
    const best = scored[0];
    if (!best) break;
    chosen.push(best.b);
    reasons[best.b.id] =
      `${best.matching ? `${best.matching} matching draft listing${best.matching > 1 ? "s" : ""} on a current menu. ` : ""}${previous ? `${best.dist.toFixed(1)} km straight-line from the previous stop. ` : ""}${best.arrival === "Open" ? "Regular hours cover the planned arrival." : "Hours need confirmation."}`;
    candidates = candidates.filter((b) => b.id !== best.b.id);
  }
  return { ids: chosen.map((b) => b.id), reasons };
}
