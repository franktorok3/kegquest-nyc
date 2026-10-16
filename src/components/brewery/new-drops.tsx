import Link from "next/link";

import { ArrowUpRight, Sparkles } from "lucide-react";
import { visitableLocations } from "../../lib/catalog";
import history from "../../data/beer-drops.json";
import { latestDrops } from "../../lib/drops/feed";
import { beerKey, type DropHistory } from "../../lib/drops/history";

export default function NewDrops() {
  const all = latestDrops(visitableLocations, history as DropHistory);
  const feed = all.filter((d, i) => all.findIndex(x => x.location.breweryId === d.location.breweryId && beerKey(x.beer.name) === beerKey(d.beer.name)) === i);
  // Give different taprooms space in the first row before repeating a venue.
  const first = feed.filter((d, i) => feed.findIndex(x => x.location.id === d.location.id) === i);
  const cards = [...first, ...feed.filter(d => !first.includes(d))].slice(0, 6);
  return <section className="new-drops" aria-labelledby="new-drops-title">
    <div className="drops-heading">
      <div><span className="eyebrow"><Sparkles size={13} aria-hidden="true" /> FRESH FINDS</span><h2 id="new-drops-title">New beer drops.</h2></div>
      <Link className="text-link" href="/taplists">Explore all beers ↗︎</Link>
    </div>
    <p className="drops-explainer">Meet your next favorite. Recently discovered, currently on the menu.</p>
    {cards.length ? <div className="drops-rail" tabIndex={0} role="region" aria-label="Latest beer discoveries, scroll for more">
      {cards.map(({location, beer, firstSeen, kind}) => <article className="drop-card" key={location.id + beer.name}>
        <div className="drop-meta"><span className={kind === "addition" ? "drop-tag added" : "drop-tag"}>{kind === "addition" ? "New on menu" : "New to guide"}</span><time dateTime={firstSeen}>Spotted {new Intl.DateTimeFormat("en-US", {month:"short", day:"numeric", timeZone:"America/New_York"}).format(new Date(firstSeen))}</time></div>
        <h3><Link href={"/breweries/" + location.id}>{beer.name}</Link></h3>
        <p className="drop-style">{beer.style}{beer.abv !== undefined ? ` · ${beer.abv}% ABV` : ""}</p>
        <Link className="drop-location" href={"/breweries/" + location.id}>{location.name}<ArrowUpRight size={14} aria-hidden="true" /></Link>
        <div className="drop-footer"><span>{location.neighborhood}</span><a href={location.menuSource} target="_blank" rel="noreferrer">Menu source ↗︎</a></div>
      </article>)}
    </div> : <p className="drops-empty">No new beers spotted in the last 14 days on a currently verified menu. Check back after the next crawl, or explore the full tap lists.</p>}
    {cards.some(c => c.kind === "baseline") && <details className="menu-disclosure"><summary>About these discoveries</summary><p>Dates show when we first spotted a beer, not its release date. “New on menu” means added since an earlier menu; “New to guide” means our first observation.</p></details>}
  </section>;
}
