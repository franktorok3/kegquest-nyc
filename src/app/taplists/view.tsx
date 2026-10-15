"use client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { locations, currentMenu } from "../../lib/catalog";
import { styleFamilies, matchesStyle } from "../../lib/matching/styles";
import { tastes, matchesTaste } from "../../lib/discovery";
import AddToTrail from "../../components/planner/add-to-trail";
export default function OnTap() {
  const p = useSearchParams(),
    router = useRouter(),
    q = p.get("q") || "",
    style = p.get("style") || "",
    taste = p.get("taste") || "";
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
        matchesStyle(beer.style, style) && matchesTaste(beer.style, taste),
    );
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow muted">THE BEER BOARD</span>
          <h1>{tastes.find(t=>t.id===taste)?.name || "Find your kind of pour."}</h1>
          <p>
            Find a beer you’ll love. Then find your way to the taproom.
          </p>
        </div>
      </div>
      <div className="taste-tabs">{tastes.map(t=><Link key={t.id} className={taste===t.id?"active":""} href={"/taplists?taste="+t.id}>{t.name}</Link>)}<Link href="/taplists">All beers</Link></div>
      <form className="filter-panel beer-search" action="/taplists">
        {taste && <input type="hidden" name="taste" value={taste}/>}
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
        {beers.length} beers to discover
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
              <span className="badge green">On tap</span>
            </div>
            <div className="beer-location">
              <Link href={"/breweries/" + b.id}>{b.name} ↗</Link>
              <p>
                {b.neighborhood}, {b.borough}
              </p>
              <details className="menu-disclosure"><summary>Menu details</summary><p className="fine">
                Updated{" "}
                {b.menuVerifiedAt &&
                  new Date(b.menuVerifiedAt).toLocaleString("en-US", {
                    timeZone: b.timeZone,
                  })}{" "}
                ET ·{" "}
                <a href={b.menuSource} target="_blank" rel="noreferrer">
                  Source ↗
                </a>
              </p></details>
            </div>
            <AddToTrail id={b.id} />
          </article>
        ))}
      </div>
      {!beers.length && (
        <div className="empty">
          <h3>No beers match just yet.</h3>
          <p>
            Try another style or browse the full beer board.
          </p>
          <Link href="/taplists" className="button">
            See all current listings
          </Link>
        </div>
      )}
    </main>
  );
}
