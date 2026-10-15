import { distanceKm, Coordinates } from "../geography";
export type Mode = "walking" | "cycling" | "driving" | "transit";
export type TravelEstimate = {
  distanceKm: number;
  minutes: number;
  kind: "straight-line";
  label: string;
};
export interface RoutingProvider {
  estimate(from: Coordinates, to: Coordinates, mode: Mode): TravelEstimate;
}
export const fallbackRouter: RoutingProvider = {
  estimate(from, to, mode) {
    const d = distanceKm(from, to),
      speed = { walking: 4, cycling: 12, driving: 22, transit: 15 }[mode];
    const minutes = Math.ceil(
      ((d * 1.35) / speed) * 60 +
        (mode === "transit" ? 15 : mode === "driving" ? 10 : 0),
    );
    return {
      distanceKm: Math.round(d * 100) / 100,
      minutes,
      kind: "straight-line",
      label:
        "Planning allowance from straight-line distance; not a routed travel time.",
    };
  },
};
