import Link from "next/link";
import { ArrowUpRight, ArrowRight, Search, Route } from "lucide-react";
import { visitableLocations, currentMenu } from "../lib/catalog";
import { tastes, fieldNotes } from "../lib/discovery";
import { openingStatus } from "../lib/hours";
import Photo from "../components/brewery/photo";
import NewDrops from "../components/brewery/new-drops";
export const dynamic = "force-dynamic";
export default function Home() {
  const pouring=visitableLocations.filter(b=>currentMenu(b));
  return <main className="discovery-home">
    <section className="discovery-intro">
      <div><span className="eyebrow">NEW YORK, ONE GOOD BEER AT A TIME</span><h1>Find the pour.<br/><em>Make a day of it.</em></h1><p>The next great taproom. A beer you haven’t tried. Your kind of New York.</p></div>
      <div className="discovery-search"><form action="/explore"><label htmlFor="home-search">Where do you want to go?</label><div><Search size={20}/><input id="home-search" name="q" placeholder="Brewery or neighborhood"/><button className="button" aria-label="Find breweries"><ArrowRight size={20}/></button></div></form><div className="quick-links"><Link href="/explore?open=1">Open now ↗</Link><Link href="/explore?outdoor=1">Outdoor seats ↗</Link><Link href="/explore?food=1">Beer + food ↗</Link></div></div>
    </section>
    <nav className="borough-strip" aria-label="Browse boroughs">{["Brooklyn","Queens","Manhattan","Bronx","Staten Island"].map(b=><Link key={b} href={"/explore?borough="+encodeURIComponent(b)}>{b}<ArrowUpRight size={14}/></Link>)}</nav>
    <NewDrops />
    <section className="taste-section"><div className="section-top"><div><span className="eyebrow">NO WRONG ANSWERS</span><h2>What are you in the mood for?</h2></div><Link href="/taplists" className="text-link">Know your style? Browse all ↗</Link></div><div className="taste-grid">{tastes.map((t,i)=><Link key={t.id} href={"/taplists?taste="+t.id} style={{"--taste":t.color} as React.CSSProperties}><span className="taste-symbol" aria-hidden="true">{["◒","✳","◉","◕","✶"][i]}</span><h3>{t.name}</h3><p>{t.hint}</p><span className="taste-count">{pouring.reduce((n,b)=>n+b.beers.filter(beer=>t.pattern.test(beer.style)).length,0)} on tap <ArrowRight size={14}/></span></Link>)}</div></section>
    <section className="home-venues"><div className="section-top"><div><span className="eyebrow">PICK YOUR NEXT STOP</span><h2>Good beer. Great places.</h2></div><Link href="/explore" className="text-link">All taprooms ↗</Link></div><div className="venue-grid">{pouring.slice(0,3).map(b=><article className="venue-card" key={b.id}><Link href={"/breweries/"+b.id}><Photo src={b.image} name={b.name}/></Link><div className="venue-body"><span className="eyebrow muted">{b.neighborhood} · {b.borough}</span><h3><Link href={"/breweries/"+b.id}>{b.name} ↗</Link></h3><div className="venue-status"><span>{b.beers.length} beers on tap</span><span>{openingStatus(b,new Date())}</span></div><p className="venue-preview">{b.beers.slice(0,2).map(beer=>beer.name).join(" · ")}</p><Link className="text-link" href={"/breweries/"+b.id}>See the tap list <ArrowRight size={14}/></Link></div></article>)}</div></section>
    <section className="geek-section"><div className="section-top"><div><span className="eyebrow">GO FOR THE BEER. STAY FOR THE PLACE.</span><h2>A few good reasons to go.</h2></div></div><div className="geek-grid">{fieldNotes.map(n=><article key={n.id}><span className="eyebrow">{n.tag}</span><h3>{n.title}</h3><p>{n.text}</p><div><Link className="text-link" href={"/breweries/"+n.id}>Explore the taproom ↗</Link><a className="fine" href={n.source}>Brewery story ↗</a></div></article>)}</div></section>
    <section className="crawl-banner"><Route size={35}/><div><span className="eyebrow">ONE STOP IS JUST THE START</span><h2>Turn a good find into a great afternoon.</h2><p>Pick a few taprooms. Put them in order. Share the plan.</p></div><Link href="/planner" className="button">Build my trail <ArrowRight size={17}/></Link></section>
  </main>;
}
