"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { locations, directions } from "../../lib/catalog";
import { styleFamilies } from "../../lib/matching/styles";
import { tastes } from "../../lib/discovery";
import {searchBeers} from "../../lib/beer-search";
import DiscoveryNav from "../../components/navigation/discovery-nav";
import SaveBeer from "../../components/brewery/save-beer";
import AddToTrail from "../../components/planner/add-to-trail";
export default function OnTap() {
  const p = useSearchParams(),
    q = p.get("q") || "",
    style = p.get("style") || "",
    taste = p.get("taste") || "";
  const borough=p.get("borough")||"", maxAbv=p.get("maxAbv")||"", open=p.get("open")==="1";
  const beers=searchBeers(locations,{q,style,taste,borough,maxAbv,open});
  function filter(key:string,value:string){const n=new URLSearchParams(window.location.search);if(value)n.set(key,value);else n.delete(key);window.history.pushState(null,"","/taplists?"+n);}
  function tasteHref(value:string){const n=new URLSearchParams(p);n.delete("style");if(value)n.set("taste",value);else n.delete("taste");return "/taplists?"+n;}
  return (
    <main className="page beer-board">
      <div className="page-heading">
        <div>
          <span className="eyebrow muted">THE BEER BOARD</span>
          <h1>{tastes.find(t=>t.id===taste)?.name || "Find your kind of pour."}</h1>
          <p>
            Find a beer you’ll love. Then find your way to the taproom.
          </p>
        </div>

      </div>
      <DiscoveryNav active="beers"/>
      <div className="taste-tabs">{tastes.map(t=><Link key={t.id} className={taste===t.id?"active":""} href={tasteHref(t.id)}>{t.name}</Link>)}<Link href={tasteHref("")}>All tastes</Link></div>
      <form className="search discovery-search beer-search" action="/taplists">
        {style&&<input type="hidden" name="style" value={style}/> }
        {taste && <input type="hidden" name="taste" value={taste}/>}
        {borough && <input type="hidden" name="borough" value={borough}/>}
        {maxAbv && <input type="hidden" name="maxAbv" value={maxAbv}/>}
        {open && <input type="hidden" name="open" value="1"/>}
        <label>
          <span className="sr-only">Beer or style</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Try Czech pilsner, hazy IPA…"
            aria-label="Search beer names and styles"
            key={q}
          />
        </label>
        <button className="button">Search</button>
      </form>
      <details className="explore-filters"><summary>Filters · borough, style & strength</summary><div className="filter-panel beer-refinements">        <label>
          Style
          <select
            name="style"
            value={style}
            aria-label="Beer family"
            onChange={(e) => filter("style",e.target.value)}
          >
            <option value="">All styles</option>
            {styleFamilies.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
<label>Borough<select aria-label="Beer borough" value={borough} onChange={e=>filter("borough",e.target.value)}><option value="">All five boroughs</option>{["Brooklyn","Queens","Manhattan","Bronx","Staten Island"].map(b=><option key={b}>{b}</option>)}</select></label><label>Strength<select aria-label="Maximum ABV" value={maxAbv} onChange={e=>filter("maxAbv",e.target.value)}><option value="">Any ABV</option><option value="5">5% ABV or less</option><option value="6">6% ABV or less</option><option value="8">8% ABV or less</option></select></label><label className="open-filter"><input type="checkbox" checked={open} onChange={e=>filter("open",e.target.checked?"1":"")}/> Taproom open now</label><Link href="/taplists" className="text-link">Reset filters</Link></div></details>
      <p className="results-bar" aria-live="polite">
        <span>{beers.length} beers to discover</span><Link href="/saved-beers" className="text-link">My want-to-try list ↗︎</Link>
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
              <Link href={"/breweries/" + b.id}>{b.name} ↗︎</Link>
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
                  Source ↗︎
                </a>
              </p></details>
            </div>
            <div className="beer-actions"><SaveBeer locationId={b.id} {...beer}/><AddToTrail id={b.id} /><a href={directions(b)} target="_blank" rel="noreferrer" className="text-link">Directions ↗︎</a></div>
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
