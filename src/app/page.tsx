import Link from "next/link";
import NewDrops from "../components/brewery/new-drops";
import { ArrowUpRight, ArrowRight, MapPin } from "lucide-react";
import { visitableLocations, currentMenu } from "../lib/catalog";
import Photo from "../components/brewery/photo";
export const dynamic = "force-dynamic";
const hero =
  "https://craftpeak-cooler-images.imgix.net/other-half-brewing/Other-Half-Brewery-Apollo-Fields-158.jpg?auto=compress%2Cformat&fit=crop&h=820&ixlib=php-3.3.1&w=1920&wpsize=banner_wide&s=56ef5b38d22bf68deeb58c6be3fd7d0b";
export default function Home() {
  const fresh = visitableLocations.filter((b) => currentMenu(b));
  return (
    <main>
      <NewDrops />
      <section className="home-hero">
        <Photo
          src={hero}
          name="Other Half / Apollo Fields"
          className="hero-photo"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="eyebrow">
            GOOD PLACES. GREAT POURS. YOUR NEXT ADVENTURE.
          </span>
          <h1>
            Find the pour.
            <br />
            <em>Plan the crawl.</em>
          </h1>
          <p>
            Your next favorite beer is out there.
            <br />
            Discover what’s pouring, then make a day of it.
          </p>
          <form action="/explore" className="hero-search">
            <MapPin size={19} />
            <input
              name="q"
              placeholder="Where are we drinking?"
              aria-label="Where are we drinking?"
            />
            <button aria-label="Find breweries">
              <ArrowRight size={22} />
            </button>
          </form>
          <div className="hero-actions">
            <Link href="/taplists">
              Find My Beer <ArrowUpRight size={16} />
            </Link>
            <Link href="/planner">
              Plan a Crawl <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <a
          className="photo-credit"
          href="https://otherhalfbrewing.com/location/centre-street/"
        >
          Other Half · Photo: Apollo Fields ↗
        </a>
      </section>
      <section className="page home-section">
        <div className="section-top">
          <div>
            <span className="eyebrow muted">YOUR CITY, RECONSIDERED</span>
            <h2>Five boroughs. Make one yours.</h2>
          </div>
          <Link href="/explore" className="text-link">
            Explore NYC ↗
          </Link>
        </div>
        <div className="borough-grid">
          {["Brooklyn", "Queens", "Manhattan", "Bronx", "Staten Island"].map(
            (b, i) => (
              <Link href={"/explore?borough=" + encodeURIComponent(b)} key={b}>
                <span>0{i + 1}</span>
                <h3>{b}</h3>
                <ArrowUpRight size={22} />
              </Link>
            ),
          )}
        </div>
        <div className="section-top spaced">
          <div>
            <span className="eyebrow muted">
              THE MENU IS THE STARTING POINT
            </span>
            <h2>Follow your taste.</h2>
          </div>
          <Link href="/taplists" className="text-link">
            All beers ↗
          </Link>
        </div>
        <div className="style-chips">
          {["Pilsner", "Hazy IPA", "Lager", "Stout", "Sour", "Kölsch"].map(
            (s) => (
              <Link href={"/taplists?style=" + encodeURIComponent(s)} key={s}>
                {s} <ArrowUpRight size={15} />
              </Link>
            ),
          )}
        </div>
        <div className="section-top spaced">
          <div>
            <span className="eyebrow muted">CHECKED AT THE SOURCE</span>
            <h2>Fresh field notes.</h2>
          </div>
          <p className="fine">
            {fresh.length} locations with current sourced menus
          </p>
        </div>
        <div className="cards">
          {fresh.map((b) => (
            <Link
              className="feature-card"
              href={"/breweries/" + b.id}
              key={b.id}
            >
              <Photo src={b.image} name={b.name} />
              <div>
                <span className="eyebrow muted">
                  {b.neighborhood} · {b.borough}
                </span>
                <h3>
                  {b.name} <ArrowUpRight size={19} />
                </h3>
                <p>
                  {b.beers.length} observed draft listings · view source and
                  timestamp
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="trail-promo">
          <span className="eyebrow">
            A LITTLE PLANNING. A BETTER AFTERNOON.
          </span>
          <h2>
            Connect the places.
            <br />
            Make the day.
          </h2>
          <p>
            Build a trail around your taste, time, and neighborhood.
            <br />
            Save it. Share it. Take the scenic route.
          </p>
          <Link href="/planner" className="button light">
            Build a brewery trail <ArrowRight size={18} />
          </Link>
        </div>
        <div className="section-top spaced">
          <h2>Start with a neighborhood.</h2>
        </div>
        <div className="neighborhoods">
          {["Gowanus", "Long Island City", "Ridgewood", "Carroll Gardens"].map(
            (n) => (
              <Link
                key={n}
                href={"/explore?neighborhood=" + encodeURIComponent(n)}
              >
                {n}
                <ArrowUpRight size={18} />
              </Link>
            ),
          )}
        </div>
      </section>
    </main>
  );
}
