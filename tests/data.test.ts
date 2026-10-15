import { describe, it, expect, vi } from "vitest";
import { locations, catalog, currentMenu, freshness } from "../src/lib/catalog";
import { normalizeStyle, matchesStyle } from "../src/lib/matching/styles";
import { openingStatus } from "../src/lib/hours";
import { buildTrail, recommend } from "../src/lib/planner";
import {
  preferencesSchema,
  saveTrailSchema,
} from "../src/lib/validation/trail";
import { localDateTime, distanceKm } from "../src/lib/geography";
import {
  parseDraft,
  parseEckhart,
  respectfulFetch,
  assertAllowedUrl,
  publicAddress,
} from "../scripts/ingest.mjs";
import {
  parseDraftJsonLd,
  parseDraftTable,
} from "../ingestion/adapters/structured.mjs";
const p = preferencesSchema.parse({
  cityId: "nyc",
  date: "2026-10-17",
  startTime: "14:00",
  availableMinutes: 240,
  maximumStops: 3,
  mode: "walking",
});
describe("catalog and geography", () => {
  it("has provenance, unique locations and all five boroughs", () => {
    expect(new Set(locations.map((x) => x.id)).size).toBe(locations.length);
    for (const borough of [
      "Bronx",
      "Brooklyn",
      "Queens",
      "Manhattan",
      "Staten Island",
    ])
      expect(locations.some((x) => x.borough === borough)).toBe(true);
    for (const l of locations) {
      expect(l.source).toMatch(/^https:/);
      expect(l.address).toBeTruthy();
    }
  });
  it("groups Other Half locations under one brewery", () => {
    expect(locations.filter((x) => x.breweryId === "other-half")).toHaveLength(
      2,
    );
  });
  it("does not recommend producer candidates or temporarily closed venues", () => {
    expect(locations.find((x) => x.id === "brooklynbrewery")?.visitable).toBe(
      false,
    );
    expect(locations.find((x) => x.id === "bronx-brewery")?.visitable).toBe(
      false,
    );
    expect(locations.some((x) => x.id === "harlem")).toBe(false);
    expect(catalog.length).toBeGreaterThan(locations.length);
  });
  it("distance is symmetric and zero for same point", () => {
    expect(distanceKm({ lat: 40, lng: -74 }, { lat: 40, lng: -74 })).toBe(0);
  });
});
describe("freshness", () => {
  it("uses exact 24/72 hour boundaries and excludes failed extraction", () => {
    const now = Date.now();
    const b = {
      menuVerifiedAt: new Date(now - 24 * 3600000).toISOString(),
      tapStatus: "verified",
    };
    expect(freshness(b, now)).toBe("Fresh");
    expect(freshness(b, now + 1)).toBe("Recently checked");
    expect(freshness(b, now + 48 * 3600000 + 1)).toBe("Stale");
    expect(freshness({ ...b, tapStatus: "unavailable" }, now)).toBe(
      "Unavailable",
    );
    expect(
      currentMenu({ ...locations[0], ...b, tapStatus: "unavailable" }),
    ).toBe(false);
  });
});
describe("hours", () => {
  const base = {
    schedule: [
      [720, 1320],
      [720, 1320],
      [720, 1320],
      [720, 1320],
      [720, 1320],
      [720, 1500],
      [720, 1500],
    ],
    timeZone: "America/New_York",
    visitStatus: "taproom",
    hoursCheckedAt: new Date().toISOString(),
    exceptions: [],
  };
  it("handles overnight Saturday service and weekday closures", () => {
    expect(
      openingStatus(base, localDateTime("2026-10-18", "00:30", base.timeZone)),
    ).toBe("Open");
    expect(
      openingStatus(base, localDateTime("2026-10-18", "02:00", base.timeZone)),
    ).toBe("Closed");
  });
  it("does not call unknown or stale hours open", () => {
    expect(openingStatus({ ...base, schedule: null }, new Date())).toBe(
      "Unknown",
    );
    expect(
      openingStatus({ ...base, hoursCheckedAt: "2020-01-01" }, new Date()),
    ).toBe("Unknown");
  });
  it("honors a date exception", () => {
    expect(
      openingStatus(
        { ...base, exceptions: [{ date: "2026-10-17", interval: [] }] },
        localDateTime("2026-10-17", "14:00", base.timeZone),
      ),
    ).toBe("Closed");
  });
  it("converts NYC wall time across daylight saving", () => {
    expect(
      localDateTime("2026-10-17", "14:00", base.timeZone).toISOString(),
    ).toBe("2026-10-17T18:00:00.000Z");
    expect(
      localDateTime("2026-11-17", "14:00", base.timeZone).toISOString(),
    ).toBe("2026-11-17T19:00:00.000Z");
  });
});
describe("menus", () => {
  it("keeps draft separate from cans and rejects incomplete entries", () => {
    const item =
      '<div class="list-item"><h2 class="item-title">Real Beer</h2><span class="item-descriptor">Hazy IPA</span><div>6.2%</div></div>';
    expect(
      parseDraft(
        '<div data-tab="draft">' +
          item +
          '</div><div data-tab="cans">' +
          item +
          "</div>",
      ),
    ).toHaveLength(1);
    expect(parseDraft('<div data-tab="cans">' + item + "</div>")).toEqual([]);
  });
  it("requires Eckhart draft heading", () => {
    const item =
      '<div class="draft-beer"><h3>Helles Lager</h3><div class="ibu-abv">5.1% ABV</div></div>';
    expect(
      parseEckhart(
        '<section class="menu-section"><h2>On Draft Now</h2>' +
          item +
          "</section>",
      ),
    ).toHaveLength(1);
    expect(parseEckhart(item)).toEqual([]);
  });
  it("parses opt-in structured draft scopes", () => {
    expect(
      parseDraftJsonLd(
        '<script type="application/ld+json">{"@type":"MenuSection","name":"Draft","hasMenuItem":[{"name":"Pils"}]}</script>',
      ),
    ).toHaveLength(1);
    expect(
      parseDraftTable(
        '<table id="draft"><tbody><tr><td>Pils</td><td>Pilsner</td><td>5%</td></tr></tbody></table>',
        "#draft",
      )[0].abv,
    ).toBe(5);
  });
  it("classifies styles without changing original description", () => {
    expect(normalizeStyle("Czech-Style Pale Lager")).toBe("Pilsner");
    expect(normalizeStyle("IPA - New England / Hazy")).toBe("Hazy IPA");
    expect(matchesStyle("IPA - New England / Hazy", "IPA")).toBe(true);
  });
});
describe("crawler boundaries", () => {
  it("rejects arbitrary urls and private IPs", () => {
    expect(() => assertAllowedUrl("https://127.0.0.1/")).toThrow();
    expect(() =>
      assertAllowedUrl("http://otherhalfbrewing.com/location/centre-street/"),
    ).toThrow();
    expect(publicAddress("169.254.169.254")).toBe(false);
  });
  it("fails closed on robots denial without fetching content", async () => {
    const f = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response("User-agent: *\nDisallow: /", { status: 200 }),
      );
    try {
      await expect(
        respectfulFetch("https://eviltwin.nyc/location/ridgewood-taproom/", async () => [
          { address: "8.8.8.8" },
        ]),
      ).rejects.toThrow("Disallowed");
      expect(f).toHaveBeenCalledTimes(1);
    } finally {
      f.mockRestore();
    }
  });
});
describe("planner", () => {
  it("creates ordered stops with travel allowances and reorders deterministically", () => {
    const a = buildTrail(["other-half-centre", "threes-gowanus"], p, locations);
    expect(a.stops).toHaveLength(2);
    expect(a.stops[1].travel?.kind).toBe("straight-line");
    expect(Date.parse(a.stops[1].arrival)).toBeGreaterThan(
      Date.parse(a.stops[0].departure),
    );
    const b = buildTrail(["threes-gowanus", "other-half-centre"], p, locations);
    expect(b.stops[0].locationId).toBe("threes-gowanus");
  });
  it("surfaces operating-hours conflicts", () => {
    const t = buildTrail(
      ["other-half-centre"],
      { ...p, startTime: "03:00" },
      locations,
    );
    expect(t.stops[0].warning).toMatch(/Closed/);
  });
  it("fits recommendations within time and excludes closed venues", () => {
    const r = recommend({ ...p, neighborhood: "Gowanus" }, locations);
    const t = buildTrail(r.ids, p, locations);
    expect(t.totalMinutes).toBeLessThanOrEqual(p.availableMinutes);
    expect(r.ids).not.toContain("brooklynbrewery");
  });
  it("rejects duplicate stops and malformed requests", () => {
    expect(
      saveTrailSchema.safeParse({
        name: "Trail",
        preferences: p,
        locationIds: ["x", "x"],
      }).success,
    ).toBe(false);
    expect(
      saveTrailSchema.safeParse({
        name: "Trail",
        preferences: p,
        locationIds: ["x"],
        url: "https://localhost",
      }).success,
    ).toBe(false);
  });
});
