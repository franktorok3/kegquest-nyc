"use client";
import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Search, LocateFixed, MapPin, ArrowUpRight } from "lucide-react";
import { locations, currentMenu } from "../../lib/catalog";
import { styleFamilies, matchesStyle } from "../../lib/matching/styles";
import { openingStatus } from "../../lib/hours";
import { Coordinates, distanceKm } from "../../lib/geography";
import Photo from "../../components/brewery/photo";
import AddToTrail from "../../components/planner/add-to-trail";
const Map = dynamic(() => import("../../components/map/brewery-map"), {
  ssr: false,
  loading: () => <div className="map-skeleton">Loading map…</div>,
});
export default function Explore() {
  const params = useSearchParams(),
    router = useRouter();
  const [selected, setSelected] = useState(""),
    [view, setView] = useState("list"),
    [coords, setCoords] = useState<Coordinates | null>(null),
    [geoNote, setGeoNote] = useState("");
  const q = params.get("q") || "",
    borough = params.get("borough") || "",
    neighborhood = params.get("neighborhood") || "",
    style = params.get("style") || "",
    city = params.get("city") || "nyc";
  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push("/explore?" + next.toString(), { scroll: false });
  }
  function locate() {
    if (!navigator.geolocation) {
      setGeoNote("Location is unavailable. Explore the selected city instead.");
      return;
    }
    setGeoNote("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGeoNote("Sorted by straight-line distance from your location.");
      },
      () =>
        setGeoNote(
          "Location permission is unavailable. You can still explore New York by neighborhood.",
        ),
      { timeout: 10000, maximumAge: 60000 },
    );
  }
  const results = useMemo(
    () =>
      locations
        .filter(
          (b) =>
            b.visitable && b.cityId === city &&
            (!borough || b.borough === borough) &&
            (!neighborhood || b.neighborhood === neighborhood) &&
            (!params.get("open") || openingStatus(b, new Date()) === "Open") &&
            (!params.get("fresh") || currentMenu(b)) &&
            (!params.get("food") || b.amenities.food === true) &&
            (!params.get("outdoor") || b.amenities.outdoor === true) &&
            (!style ||
              (currentMenu(b) &&
                b.beers.some((beer) => matchesStyle(beer.style, style)))) &&
            (!q ||
              `${b.name} ${b.neighborhood} ${b.borough} ${b.beers.map((b) => b.name).join(" ")}`
                .toLowerCase()
                .includes(q.toLowerCase())) &&
            (!coords ||
              !params.get("distance") ||
              (b.lat !== null &&
                b.lng !== null &&
                distanceKm(coords, { lat: b.lat, lng: b.lng }) <=
                  Number(params.get("distance")))),
        )
        .sort((a, b) =>
          coords && a.lat && a.lng && b.lat && b.lng
            ? distanceKm(coords, { lat: a.lat, lng: a.lng }) -
              distanceKm(coords, { lat: b.lat, lng: b.lng })
            : Number(b.visitable) - Number(a.visitable),
        ),
    [params, q, borough, neighborhood, style, city, coords],
  );
  return (
    <main className="page explore-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow muted">EXPLORE / NEW YORK CITY</span>
          <h1>Find your next stop.</h1>
          <p>Find your corner of the city. We’ll bring the beer.</p>
        </div>
        <button className="button secondary" onClick={locate}>
          <LocateFixed size={17} /> Near me
        </button>
      </div>
      <div className="filter-panel">
        <form className="search" action="/explore">
          {Array.from(params.entries())
            .filter(([k]) => k !== "q")
            .map(([k, v]) => (
              <input type="hidden" name={k} value={v} key={k} />
            ))}
          <Search size={19} />
          <input
            key={q}
            name="q"
            defaultValue={q}
            placeholder="Brewery, neighborhood, or beer"
            aria-label="Search breweries"
          />
          <button className="button small" type="submit">
            Search
          </button>
        </form>
        <div className="filter-row">
          <label>
            Borough
            <select
              aria-label="Borough"
              value={borough}
              onChange={(e) => update("borough", e.target.value)}
            >
              <option value="">All boroughs</option>
              {[
                "Brooklyn",
                "Queens",
                "Manhattan",
                "Bronx",
                "Staten Island",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Neighborhood
            <select
              aria-label="Neighborhood"
              value={neighborhood}
              onChange={(e) => update("neighborhood", e.target.value)}
            >
              <option value="">All neighborhoods</option>
              {[
                ...new Set(
                  locations
                    .filter((b) => !borough || b.borough === borough)
                    .map((b) => b.neighborhood),
                ),
              ]
                .sort()
                .map((x) => (
                  <option key={x}>{x}</option>
                ))}
            </select>
          </label>
          <label>
            Beer style
            <select
              aria-label="Beer style"
              value={style}
              onChange={(e) => update("style", e.target.value)}
            >
              <option value="">All styles</option>
              {styleFamilies.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          {coords && (
            <label>
              Distance
              <select
                value={params.get("distance") || ""}
                onChange={(e) => update("distance", e.target.value)}
              >
                <option value="">Any distance</option>
                {[1, 3, 5, 10, 25].map((n) => (
                  <option value={n} key={n}>
                    Within {n} km
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="check-row">
          {[
            ["open", "Open now"],
            ["fresh", "Tap list available"],
            ["food", "Food"],
            ["outdoor", "Outdoor seating"],
          ].map(([k, label]) => (
            <label key={k}>
              <input
                type="checkbox"
                checked={!!params.get(k)}
                onChange={(e) => update(k, e.target.checked ? "1" : "")}
              />
              {label}
            </label>
          ))}
          <Link href="/explore" className="text-link">
            Reset
          </Link>
        </div>
        {geoNote && (
          <p className="fine" role="status">
            {geoNote}
          </p>
        )}
      </div>
      <div className="results-bar">
        <p>
          {results.length} taproom{results.length === 1 ? "" : "s"}
        </p>
        <div className="segmented">
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            List
          </button>
          <button
            className={view === "map" ? "active" : ""}
            onClick={() => setView("map")}
          >
            Map
          </button>
        </div>
      </div>
      <div className={"explore-grid view-" + view}>
        <section className="location-list">
          {results.map((b) => (
            <article
              id={"location-" + b.id}
              className={
                "location-card " + (selected === b.id ? "selected" : "")
              }
              key={b.id}
              onMouseEnter={() => setSelected(b.id)}
            >
              <Link href={"/breweries/" + b.id}>
                <Photo src={b.image} name={b.name} />
              </Link>
              <div className="location-content">
                <span className="eyebrow muted">
                  {b.neighborhood} / {b.borough}
                </span>
                <h3>
                  <Link href={"/breweries/" + b.id}>
                    {b.name} <ArrowUpRight size={17} />
                  </Link>
                </h3>
                <p className="address">
                  <MapPin size={13} />
                  {b.address}
                </p>
                <div className="badges">
                  <span className={"badge " + (currentMenu(b) ? "green" : "")}>
                    {currentMenu(b) ? `${b.beers.length} beers on tap` : "Menu unavailable"}
                  </span>
                  <span className="badge">
                    {b.visitable
                      ? openingStatus(b, new Date())
                      : b.visitStatus.replaceAll("_", " ")}
                  </span>
                  {coords && b.lat && b.lng && (
                    <span className="badge">
                      {distanceKm(coords, { lat: b.lat, lng: b.lng }).toFixed(
                        1,
                      )}{" "}
                      km away
                    </span>
                  )}
                </div>
                <div className="card-actions">
                  <Link href={"/breweries/" + b.id} className="text-link">
                    View details
                  </Link>
                  {b.visitable && <AddToTrail id={b.id} />}
                </div>
              </div>
            </article>
          ))}
          {!results.length && (
            <div className="empty">
              <h3>No verified matches for these filters.</h3>
              <p>
                Try another neighborhood or remove a filter.
              </p>
              <Link className="button" href="/explore">
                Reset filters
              </Link>
            </div>
          )}
        </section>
        <aside className="map-side">
          <Map
            locations={results}
            selected={selected}
            onSelect={(id) => {
              setSelected(id);
              setView("list");
              document
                .getElementById("location-" + id)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          />
        </aside>
      </div>
    </main>
  );
}
