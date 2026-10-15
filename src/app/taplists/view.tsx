"use client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { locations, currentMenu, freshness } from "../../lib/catalog";
import { styleFamilies, matchesStyle } from "../../lib/matching/styles";
import AddToTrail from "../../components/planner/add-to-trail";
export default function OnTap() {
  const p = useSearchParams(),
    router = useRouter(),
    q = p.get("q") || "",
    style = p.get("style") || "";
  const beers = locations
    .filter((b) => b.visitable && currentMenu(b))
    .flatMap((b) => b.beers.map((beer) => ({ b, beer })))
    .filter(
      ({ beer }) =>
        (!q ||
          q
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean)
            .every((term) =>
              `${beer.name} ${beer.style} ${beer.family}`
                .toLowerCase()
                .includes(term),
            )) &&
        matchesStyle(beer.style, style),
    );
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow muted">ON TAP / SOURCED, NOT GUESSED</span>
          <h1>Find your kind of pour.</h1>
          <p>
            Draft listings observed on official brewery menus within the past 72
            hours.
          </p>
        </div>
      </div>
      <form className="filter-panel beer-search" action="/taplists">
        <label>
          Beer or style
          <input
            name="q"
            defaultValue={q}
            placeholder="Try Czech pilsner, hazy IPA…"
            aria-label="Search beer names and styles"
          />
        </label>
        <label>
          Style
          <select
            name="style"
            value={style}
            aria-label="Beer family"
            onChange={(e) => {
              const n = new URLSearchParams(p);
              if (e.target.value) n.set("style", e.target.value);
              else n.delete("style");
              router.push("/taplists?" + n);
            }}
          >
            <option value="">All styles</option>
            {styleFamilies.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <button className="button">Find My Beer</button>
      </form>
      <p className="results-bar">
        {beers.length} draft listings · source availability can change before
        you arrive
      </p>
      <div className="beer-grid">
        {beers.map(({ b, beer }) => (
          <article className="beer-card" key={b.id + beer.name}>
            <span className="eyebrow muted">{beer.family} · DRAFT</span>
            <h3>{beer.name}</h3>
            <p>{beer.style}</p>
            <div className="beer-attributes">
              {beer.abv !== undefined && (
                <strong>
                  {beer.abv}% <small>ABV</small>
                </strong>
              )}
              {beer.price && <strong>{beer.price}</strong>}
              <span className="badge green">{freshness(b)}</span>
            </div>
            <div className="beer-location">
              <Link href={"/breweries/" + b.id}>{b.name} ↗</Link>
              <p>
                {b.neighborhood}, {b.borough}
              </p>
              <p className="fine">
                Menu verified{" "}
                {b.menuVerifiedAt &&
                  new Date(b.menuVerifiedAt).toLocaleString("en-US", {
                    timeZone: b.timeZone,
                  })}{" "}
                ET ·{" "}
                <a href={b.menuSource} target="_blank" rel="noreferrer">
                  Source ↗
                </a>
              </p>
            </div>
            <AddToTrail id={b.id} />
          </article>
        ))}
      </div>
      {!beers.length && (
        <div className="empty">
          <h3>No current sourced matches.</h3>
          <p>
            Try a broader style. We won’t fill the gap with historical or
            invented beers.
          </p>
          <Link href="/taplists" className="button">
            See all current listings
          </Link>
        </div>
      )}
    </main>
  );
}
