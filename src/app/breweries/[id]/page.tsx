import { notFound } from "next/navigation";
import Link from "next/link";
import {
  locations,
  freshness,
  currentMenu,
  directions,
} from "../../../lib/catalog";
import { openingStatus } from "../../../lib/hours";
import Photo from "../../../components/brewery/photo";
import AddToTrail from "../../../components/planner/add-to-trail";
export const dynamic = "force-dynamic";
export default async function Brewery({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    b = locations.find((b) => b.id === id);
  if (!b) notFound();
  const groups = Object.groupBy(b.beers, (beer) => beer.family);
  return (
    <main className="page detail">
      <Link href="/explore" className="back">
        ← Explore breweries
      </Link>
      <div className="detail-heading">
        <div>
          <span className="eyebrow muted">
            {b.neighborhood} / {b.borough}
          </span>
          <h1>{b.name}</h1>
          <p>{b.address}</p>
          <div className="badges">
            <span className="badge">
              {b.visitable
                ? openingStatus(b, new Date())
                : b.visitStatus.replaceAll("_", " ")}
            </span>
            <span className={"badge " + (currentMenu(b) ? "green" : "")}>
              {freshness(b)} menu
            </span>
          </div>
          <div className="actions">
            {b.visitable && <AddToTrail id={b.id} />}
            <a
              className="button"
              href={directions(b)}
              target="_blank"
              rel="noreferrer"
            >
              Get Directions ↗
            </a>
            <a
              className="text-link"
              href={b.source}
              target="_blank"
              rel="noreferrer"
            >
              Visit Website ↗
            </a>
          </div>
        </div>
        <Photo src={b.image} name={b.name} />
      </div>
      {b.description && <p className="notice">{b.description}</p>}
      <div className="detail-grid">
        <section>
          <div className="section-top">
            <h2>What’s on tap.</h2>
            <span className="badge">
              {b.beers.length} observed draft listings
            </span>
          </div>
          {!currentMenu(b) && b.beers.length > 0 && (
            <p className="notice">
              Historical menu. The latest verification is stale or unsuccessful.
              These beers are not represented as currently available.
            </p>
          )}
          <p className="fine">
            Last successful menu extraction:{" "}
            {b.menuVerifiedAt
              ? new Date(b.menuVerifiedAt).toLocaleString("en-US", {
                  timeZone: b.timeZone,
                }) + " ET"
              : "Unavailable"}{" "}
            ·{" "}
            <a href={b.menuSource} target="_blank" rel="noreferrer">
              Menu source ↗
            </a>
          </p>
          {b.beers.length ? (
            Object.entries(groups).map(([family, beers]) => (
              <div className="beer-group" key={family}>
                <h3>{family}</h3>
                {beers?.map((beer) => (
                  <article className="tap" key={beer.name}>
                    <div>
                      <h4>{beer.name}</h4>
                      <p>{beer.style} · Draft</p>
                    </div>
                    {beer.abv !== undefined && (
                      <strong>
                        {beer.abv}%<small>ABV</small>
                      </strong>
                    )}
                  </article>
                ))}
              </div>
            ))
          ) : (
            <div className="empty">
              <h3>Tap list unavailable.</h3>
              <p>
                We couldn’t verify a supported draft menu. Check the brewery’s
                own source for the latest.
              </p>
              <a
                className="button secondary"
                href={b.menuSource}
                target="_blank"
                rel="noreferrer"
              >
                Check official menu ↗
              </a>
            </div>
          )}
        </section>
        <aside className="visit">
          <h3>Before you go</h3>
          <h4>Hours & visit notices</h4>
          <p>
            {b.hours || "Hours are unverified. Please confirm before visiting."}
          </p>
          <p className="fine">
            Regular hours do not guarantee holiday or special-event access.
          </p>
          <h4>Amenities</h4>
          <p>
            {b.amenities.food === true
              ? "Food available"
              : b.amenities.food === false
                ? "No food service"
                : "Food: unverified"}
            <br />
            {b.amenities.outdoor === true
              ? "Outdoor seating"
              : b.amenities.outdoor === false
                ? "No outdoor seating"
                : "Outdoor seating: unverified"}
            <br />
            {b.amenities.pets === null
              ? "Pet policy: unverified"
              : b.amenities.pets
                ? "Pets permitted"
                : "No pets"}
            <br />
            {b.amenities.accessibility || "Accessibility: unverified"}
          </p>
          <h4>Source notes</h4>
          <p className="fine">
            Last attempted:{" "}
            {new Date(b.checkedAt).toLocaleString("en-US", {
              timeZone: b.timeZone,
            })}{" "}
            ET
            <br />
            {b.note}
            <br />
            Coordinates:{" "}
            {b.lat ? "US Census address interpolation" : "Unavailable"}.
          </p>
          <a
            className="text-link"
            href={b.source}
            target="_blank"
            rel="noreferrer"
          >
            View exact source ↗
          </a>
        </aside>
      </div>
    </main>
  );
}
