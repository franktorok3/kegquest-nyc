"use client";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Search, LocateFixed, MapPin, ArrowUpRight } from "lucide-react";
import { locations, currentMenu, directions } from "../../lib/catalog";
import { styleFamilies, matchesStyle } from "../../lib/matching/styles";
import { openingStatus } from "../../lib/hours";
import { Coordinates, distanceKm } from "../../lib/geography";
import DiscoveryNav from "../../components/navigation/discovery-nav";
import Photo from "../../components/brewery/photo";
import AddToTrail from "../../components/planner/add-to-trail";
const Map = dynamic(() => import("../../components/map/brewery-map"), {
  ssr: false,
  loading: () => <div className="map-skeleton">Loading map…</div>,
});
export default function Explore({nearby=false}:{nearby?:boolean}) {
  const params = useSearchParams();
  const basePath=nearby?"/nearby":"/explore";
  const [locating,setLocating]=useState(false), [radius,setRadius]=useState("5");
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
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    window.history.pushState(null,"",basePath+"?"+next.toString());
  }
  function locate() {
    if (!navigator.geolocation) {
      setGeoNote("Location is unavailable. Explore the selected city instead.");
      return;
    }
    setLocating(true);
    setGeoNote("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGeoNote(`Nearest first · straight-line distances, not walking routes.${p.coords.accuracy>1000?" Your location is approximate; results may be less precise.":""}`);
      },
      (error) => {
        setLocating(false);
        setGeoNote(error.code===1?"Location access is blocked. Allow location for this site in your browser settings, or browse by borough below.":error.code===3?"Finding your location took too long. Try again or browse by borough.":"Your location could not be found. Try again or browse by borough.");
      },
      { timeout: 10000, maximumAge: 0 },
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
              !radius ||
              (b.lat !== null &&
                b.lng !== null &&
                distanceKm(coords, { lat: b.lat, lng: b.lng }) <=
                  Number(radius)*1.609344)),
        )
        .sort((a, b) => {
          if(!coords)return 0;
          const distance=(x:typeof a)=>x.lat!==null&&x.lng!==null?distanceKm(coords,{lat:x.lat,lng:x.lng}):Infinity;
          return distance(a)-distance(b);
        }),
    [params, q, borough, neighborhood, style, city, coords, radius],
  );

  return (
    <main className={"page explore-page"+(nearby?" nearby-page":"")}>
      <div className="page-heading"><div><span className="eyebrow muted">YOUR NYC BEER GUIDE</span><h1>{nearby?"Good beer, near you.":"Find your next stop."}</h1><p>Neighborhood taprooms. Fresh pours. A day worth planning.</p></div></div>
      <DiscoveryNav active={nearby?"nearby":"taprooms"}/>
      <div className="location-toolbar">
        <button className={"button "+(coords?"secondary":"")} onClick={locate} disabled={locating}><LocateFixed size={17}/>{locating?"Finding you…":coords?"Update location":nearby?"Use my location":"Near me"}</button>
        {coords?<><label className="nearby-radius"><span className="sr-only">Show taprooms</span><select aria-label="Nearby radius" value={radius} onChange={e=>setRadius(e.target.value)}><option value="">All NYC taprooms</option>{[1,3,5,10,25].map(n=><option key={n} value={n}>Within {n} miles</option>)}</select></label><button className="text-link" onClick={()=>{setCoords(null);setGeoNote("");}}>Stop using my location</button></>:<span className="fine">{nearby?"See what’s close. Location stays on your device.":"Find taprooms around you."}</span>}
      </div>
      {geoNote&&<p className="fine nearby-status" role="status">{geoNote} {!coords&&<Link href="/explore" className="text-link">Browse by borough instead</Link>}</p>}
        <form className="search discovery-search" action={basePath} onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);update("q",String(data.get("q")||""));}}>
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
      <details className="explore-filters"><summary>Filters · borough, style & hours</summary><div className="filter-panel">
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
          <Link href={basePath} className="text-link">
            Reset
          </Link>
        </div>
      </div>
      </details>
      <>
      <div className="results-bar">
        <p>
          {nearby&&!coords?"Explore NYC · ":""}{results.length} taproom{results.length === 1 ? "" : "s"}{coords?radius?` within ${radius} miles · nearest first`:" · nearest first":""}
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
                  {coords && b.lat !== null && b.lng !== null && (
                    <span className="badge">
                      {(distanceKm(coords, { lat: b.lat, lng: b.lng })/1.609344).toFixed(
                        1,
                      )}{" "}
                      mi away
                    </span>
                  )}
                </div>
                <div className="card-actions">
                  <Link href={"/breweries/" + b.id} className="text-link">
                    View details
                  </Link>
                  <a href={directions(b)} target="_blank" rel="noreferrer" className="text-link">Directions ↗︎</a>
                  {b.visitable && <AddToTrail id={b.id} />}
                </div>
              </div>
            </article>
          ))}
          {!results.length && (
            <div className="empty">
              <h3>No verified matches for these filters.</h3>
              <p>
                {coords?"Widen the distance or remove a filter. Tapbound currently covers NYC only.":"Try another neighborhood or remove a filter."}
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
      </>
    </main>
  );
}
