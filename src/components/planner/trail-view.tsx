"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import Photo from "../brewery/photo";
import { Trail } from "../../lib/planner";
import { locations, directions } from "../../lib/catalog";
const Map = dynamic(() => import("../map/brewery-map"), {
  ssr: false,
  loading: () => <div className="map-skeleton">Loading map…</div>,
});
export default function TrailView({ trail }: { trail: Trail }) {
  const places = trail.stops
    .map((s) => locations.find((l) => l.id === s.locationId))
    .filter((l) => !!l);
  if(trail.format==="stops")return <><div className="page-heading"><div><span className="eyebrow">A FEW GOOD STOPS</span><h1>{trail.name}</h1><p>{places.length} taproom{places.length===1?"":"s"}, in your chosen order.</p></div><Link href="/planner" className="button">Plan your own</Link></div><div className="simple-shared-stops">{places.map((b,i)=><article className="stop simple-stop" key={b.id}><span className="stop-number">{i+1}</span><Photo src={b.image} name={b.name} className="stop-photo"/><div className="stop-main"><h3><Link href={"/breweries/"+b.id}>{b.name}</Link></h3><p>{b.address}</p><a className="text-link" href={directions(b)} target="_blank" rel="noreferrer">Directions ↗︎</a></div></article>)}</div><p className="fine">Check each taproom’s hours before heading out.</p><details className="shared-map"><summary>Show route map</summary><Map locations={places} route/></details></>;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{trail.name}</h1>
          <p>
            {trail.date} · {trail.startTime} · {trail.mode} · about{" "}
            {trail.totalMinutes} minutes including visits
          </p>
        </div>
        <Link href="/planner" className="button">
          Plan your own
        </Link>
      </div>
      <p className="notice">
        Travel allowances use straight-line distance, not road or transit
        routing. Check directions before traveling. Menus, hours, holidays, and
        availability can change before your visit.
      </p>
      <div className="planner-grid">
        <div>
          {trail.stops.map((s, i) => {
            const b = locations.find((l) => l.id === s.locationId);
            if (!b) return null;
            return (
              <article className="stop" key={s.locationId}>
                <span className="stop-number">{i + 1}</span>
                <div>
                  <span className="eyebrow">
                    {new Date(s.arrival).toLocaleTimeString("en-US", {
                      timeZone: b.timeZone,
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {new Date(s.departure).toLocaleTimeString("en-US", {
                      timeZone: b.timeZone,
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <h3>
                    <Link href={"/breweries/" + b.id}>{b.name}</Link>
                  </h3>
                  <p>{b.address}</p>
                  {s.travel && (
                    <p className="fine">
                      {s.travel.distanceKm} km straight-line · ~
                      {s.travel.minutes} min planning allowance
                    </p>
                  )}
                  {s.warning && <p className="warning">{s.warning}</p>}
                  <a
                    href={directions(b)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-link"
                  >
                    Directions ↗︎
                  </a>
                </div>
              </article>
            );
          })}
        </div>
        <Map locations={places} route />
      </div>
    </>
  );
}
