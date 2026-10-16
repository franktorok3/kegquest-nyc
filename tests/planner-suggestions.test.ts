import { describe, expect, it } from "vitest";
import { visitableLocations, type Location } from "../src/lib/catalog";
import { suggestStops } from "../src/lib/planner-suggestions";

function venue(id: string, patch: Partial<Location> = {}): Location {
  return {
    ...visitableLocations[0], id, name: id, cityId: "nyc", visitable: true,
    neighborhood: "Gowanus", borough: "Brooklyn", lat: 40.675, lng: -73.99,
    ...patch,
  };
}

describe("simple planner suggestions", () => {
  it("sorts nearby taprooms by distance and omits distant or unvisitable locations", () => {
    const all = [venue("Far", { lat: 40.8 }), venue("Near", { lat: 40.676 }),
      venue("Closest"), venue("Closed permanently", { visitable: false }),
      venue("Another market", { cityId: "boston" })];
    const result = suggestStops(all, { origin: { lat: 40.675, lng: -73.99 } });
    expect(result.map((item) => item.location.id)).toEqual(["Closest", "Near"]);
    expect(result[0].distanceKm).toBe(0);
    expect(result[1].distanceKm).toBeGreaterThan(0);
  });

  it("accepts zero-valued coordinates and does not coerce missing coordinates to zero", () => {
    const all = [venue("Missing", { lat: null, lng: null }), venue("Origin", { lat: 0, lng: 0 }),
      venue("Nearby", { lat: 0.01, lng: 0 })];
    expect(suggestStops(all, { origin: { lat: 0, lng: 0 } }).map((item) => item.location.id))
      .toEqual(["Origin", "Nearby"]);
  });

  it("anchors at the last selected stop and excludes all selected stops", () => {
    const first = venue("First", { lat: 40.8 });
    const last = venue("Last");
    const all = [first, last, venue("Neighbor", { lat: 40.676 })];
    const result = suggestStops(all, { selectedIds: [first.id, last.id] });
    expect(result.map((item) => item.location.id)).toEqual(["Neighbor"]);
    expect(result[0].distanceKm).toBeLessThan(0.2);
  });

  it("uses explicit location ahead of a neighborhood or selected route", () => {
    const all = [venue("Origin", { lat: 40.8, neighborhood: "Uptown" }), venue("Selected")];
    expect(suggestStops(all, { origin: { lat: 40.8, lng: -73.99 }, neighborhood: "Gowanus",
      selectedIds: ["Selected"] }).map((item) => item.location.id)).toEqual(["Origin"]);
  });

  it("keeps the chosen neighborhood first, then nearby neighbors, with unknown distances last", () => {
    const all = [venue("Z same neighborhood", { lat: 40.69 }), venue("A anchor"),
      venue("B neighboring area", { lat: 40.676, neighborhood: "Carroll Gardens" }),
      venue("Missing", { lat: null, lng: null }), venue("Too far", { lat: 40.8 })];
    expect(suggestStops(all, { neighborhood: "  GOWANUS  " }).map((item) => item.location.id))
      .toEqual(["A anchor", "Z same neighborhood", "B neighboring area", "Missing"]);
  });

  it("searches names, neighborhoods, and boroughs across NYC, including beyond the nearby radius", () => {
    const all = [venue("Bronx Beer", { lat: 40.85, neighborhood: "Mott Haven", borough: "Bronx" }),
      venue("Missing Beer", { neighborhood: "Mott Haven", borough: "Bronx", lat: null, lng: null }),
      venue("Brooklyn Beer")];
    const result = suggestStops(all, { origin: { lat: 40.675, lng: -73.99 }, query: "bronx beer" });
    expect(result.map((item) => item.location.id)).toEqual(["Bronx Beer", "Missing Beer"]);
    expect(result[0].distanceKm).toBeGreaterThan(3);
    expect(result[1].distanceKm).toBeNull();
    expect(suggestStops(all, { query: "mott haven" })).toHaveLength(2);
  });

  it("does not invent an anchor when the neighborhood is unknown or has no coordinates", () => {
    const all = [venue("Known"), venue("No coordinates", { neighborhood: "Imaginary", lat: null, lng: null })];
    expect(suggestStops(all, { neighborhood: "Not found" })).toEqual([]);
    expect(suggestStops(all, { neighborhood: "Imaginary" })).toEqual([{ location: all[1], distanceKm: null }]);
    expect(suggestStops(all, { neighborhood: "Not found", query: "known" })).toHaveLength(1);
  });

  it("treats an empty neighborhood as absent and resolves ties consistently without changing input", () => {
    const all = [venue("Zulu"), venue("Alpha")];
    expect(suggestStops(all, { neighborhood: " " }).map((item) => item.location.id)).toEqual(["Alpha", "Zulu"]);
    expect(all.map((item) => item.id)).toEqual(["Zulu", "Alpha"]);
    expect(suggestStops(all, { limit: 1 }).map((item) => item.location.id)).toEqual(["Alpha"]);
    expect(suggestStops(all, { limit: 0 })).toEqual([]);
  });

  it("keeps suggestions factual without filtering by unknown hours or unverified menus", () => {
    const place = venue("Details incomplete", { schedule: null, menuVerifiedAt: null, tapStatus: "unavailable" });
    expect(suggestStops([place], { origin: { lat: 40.675, lng: -73.99 } })).toEqual([{ location: place, distanceKm: 0 }]);
  });
});
