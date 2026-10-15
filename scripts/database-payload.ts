import { createHash } from "node:crypto";
import { locations, markets, catalog } from "../src/lib/catalog";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export function databasePayload() {
  const tables: Record<string, Record<string, unknown>[]> = Object.fromEntries(
    [
      "states",
      "cities",
      "neighborhoods",
      "breweries",
      "brewery_locations",
      "sources",
      "beers",
      "tap_snapshots",
      "tap_entries",
      "ingestion_runs",
    ].map((t) => [t, []]),
  );
  const states: Record<string, string> = {
    NY: "New York",
    PA: "Pennsylvania",
    IL: "Illinois",
    CO: "Colorado",
    MA: "Massachusetts",
    OR: "Oregon",
    CA: "California",
  };
  tables.states = Object.entries(states).map(([id, name]) => ({
    id,
    name,
    abbreviation: id,
    country: "US",
  }));
  tables.cities = markets.map((m) => ({
    id: m.id,
    name: m.name,
    state_id: m.state,
    time_zone: m.timeZone,
    center_lat: "lat" in m ? m.lat : null,
    center_lng: "lng" in m ? m.lng : null,
    active: m.active,
  }));
  const breweries = new Set<string>(),
    neighborhoods = new Set<string>();
  for (const l of locations) {
    const n =
      l.cityId + "-" + l.neighborhood.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!neighborhoods.has(n)) {
      tables.neighborhoods.push({
        id: n,
        city_id: l.cityId,
        name: l.neighborhood,
        borough: l.borough,
        boundary: null,
      });
      neighborhoods.add(n);
    }
    if (!breweries.has(l.breweryId)) {
      tables.breweries.push({
        id: l.breweryId,
        name: l.breweryId === "other-half" ? "Other Half Brewing" : l.name,
        slug: l.breweryId,
        website: new URL(l.source).origin,
        logo_url: null,
        description: null,
        classification: "brewery",
        verification_status: "official_location_verified",
        source_url: l.source,
        verified_at: l.verifiedAt,
      });
      breweries.add(l.breweryId);
    }
    tables.brewery_locations.push({
      id: l.id,
      brewery_id: l.breweryId,
      name: l.name,
      slug: l.id,
      address: l.address,
      city_id: l.cityId,
      state_id: "NY",
      postal_code: l.address?.match(/\b\d{5}\b/)?.[0] || null,
      neighborhood_id: n,
      borough: l.borough,
      lat: l.lat,
      lng: l.lng,
      phone: null,
      website: l.source,
      opening_hours: {
        weekly: l.schedule,
        exceptions: l.exceptions,
        checkedAt: l.hoursCheckedAt,
        original: l.hours,
      },
      time_zone: l.timeZone,
      amenities: l.amenities,
      image_url: l.image,
      visit_status: l.visitStatus,
      visitable: l.visitable,
      verified_at: l.verifiedAt,
      source_url: l.source,
      record: l,
    });
    const sourceId = l.id + "-official";
    tables.sources.push({
      id: sourceId,
      location_id: l.id,
      url: l.source,
      reliability: "official_brewery_menu",
      adapter: l.id.startsWith("other-half")
        ? "other-half-v2"
        : l.id === "eckhartbeer"
          ? "eckhart-v1"
          : "unsupported",
    });
    const snapshotId = hash(sourceId + l.checkedAt);
    tables.tap_snapshots.push({
      id: snapshotId,
      location_id: l.id,
      source_id: sourceId,
      collected_at: l.checkedAt,
      last_successful_verification: l.menuVerifiedAt,
      parser_version: "tapbound-2",
      checksum: hash(JSON.stringify(l.beers)),
      status: l.tapStatus,
      entry_count: l.beers.length,
      error: l.tapStatus === "verified" ? null : l.note,
    });
    for (const b of l.beers) {
      const id = hash(l.id + b.name + b.style);
      tables.beers.push({
        id,
        name: b.name,
        producer_id: null,
        original_style: b.style,
        style_family: b.family,
        abv: b.abv ?? null,
        ibu: null,
        description: null,
        source_url: l.source,
      });
      tables.tap_entries.push({
        id: hash(snapshotId + id),
        location_id: l.id,
        beer_id: id,
        serving_format: "draft",
        pour_size: null,
        price: b.price || null,
        availability: l.tapStatus === "verified" ? "listed" : "historical",
        source_url: l.source,
        observed_at: l.menuVerifiedAt || l.checkedAt,
        snapshot_id: snapshotId,
      });
    }
  }
  const finish = catalog
    .map((x) => x.checkedAt)
    .sort()
    .at(-1)!;
  tables.ingestion_runs.push({
    id: hash(finish),
    started_at: catalog.map((x) => x.checkedAt).sort()[0],
    finished_at: finish,
    status: "completed_with_coverage_gaps",
    attempted: catalog.length,
    successful: catalog.filter((x) => x.status === "verified").length,
    failed: catalog.filter((x) => x.status !== "verified").length,
    details: catalog.map((x) => ({
      id: x.id,
      source: x.source,
      status: x.tapStatus,
      note: x.note,
      checkedAt: x.checkedAt,
      menuVerifiedAt: x.menuVerifiedAt,
      entries: x.beers.length,
    })),
  });
  return tables;
}
if (process.argv.includes("--print"))
  process.stdout.write(JSON.stringify(databasePayload()));
