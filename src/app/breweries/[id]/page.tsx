import { notFound } from "next/navigation";
import Link from "next/link";
import {
  locations,
  currentMenu,
  directions,
} from "../../../lib/catalog";
import { openingStatus } from "../../../lib/hours";
import Photo from "../../../components/brewery/photo";
import SaveBeer from "../../../components/brewery/save-beer";
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
              {currentMenu(b) ? `${b.beers.length} on tap` : "Menu unavailable"}
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
              {currentMenu(b) ? b.beers.length : 0} beers
            </span>
          </div>
          <details className="menu-disclosure"><summary>Menu updated & source</summary><p className="fine">
            Updated:{" "}
            {b.menuVerifiedAt
              ? new Date(b.menuVerifiedAt).toLocaleString("en-US", {
                  timeZone: b.timeZone,
                }) + " ET"
              : "Unavailable"}{" "}
            ·{" "}
            <a href={b.menuSource} target="_blank" rel="noreferrer">
              Menu source ↗
            </a>
          </p></details>
          {currentMenu(b) && b.beers.length ? (
            Object.entries(groups).map(([family, beers]) => (
              <div className="beer-group" key={family}>
                <h3>{family}</h3>
                {beers?.map((beer) => (
                  <article className="tap" key={beer.name}>
                    <div>
                      <h4>{beer.name}</h4>
                      <p>{beer.style} · Draft{beer.price ? ` · ${beer.price}` : ""}</p>
                      <SaveBeer locationId={b.id} {...beer}/>
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
                The taproom’s current menu isn’t available here yet. See what’s pouring on its website.
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
          <details className="menu-disclosure"><summary>More about this listing</summary>
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
          </a></details>
        </aside>
      </div>
    </main>
  );
}
