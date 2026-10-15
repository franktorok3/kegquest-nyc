import Link from "next/link";
import {ArrowUpRight,ArrowRight,Route} from "lucide-react";
import {visitableLocations,currentMenu} from "../lib/catalog";
import {tastes,fieldNotes} from "../lib/discovery";
import {openingStatus} from "../lib/hours";
import Photo from "../components/brewery/photo";
import NewDrops from "../components/brewery/new-drops";
import DiscoveryTabs from "../components/discovery-tabs";
import {Button} from "../components/ui/button";
import {Card,CardContent} from "../components/ui/card";
export const dynamic="force-dynamic";
export default function Home(){const pouring=visitableLocations.filter(b=>currentMenu(b));return <main className="compact-discovery">
  <div className="compact-title"><div><h1>Find the pour.</h1><p>Your next favorite beer is somewhere in New York.</p></div><Button asChild><Link href="/planner"><Route size={16}/>Build a trail</Link></Button></div>
  <div className="compact-tastes"><span>In the mood for</span>{tastes.map(t=><Link key={t.id} href={"/taplists?taste="+t.id}><i style={{background:t.color}}/>{t.name}<ArrowUpRight size={13}/></Link>)}</div>
  <DiscoveryTabs drops={<NewDrops/>} taprooms={<section className="home-venues"><div className="compact-section-heading"><h2>Pick your next stop.</h2><Link className="text-link" href="/explore">All {visitableLocations.length} taprooms ↗</Link></div><div className="venue-grid">{pouring.slice(0,6).map(b=><Card className="venue-card gap-0 py-0" key={b.id}><Link href={"/breweries/"+b.id}><Photo src={b.image} name={b.name}/></Link><CardContent className="venue-body"><span className="eyebrow muted">{b.neighborhood} · {b.borough}</span><h3><Link href={"/breweries/"+b.id}>{b.name} ↗</Link></h3><div className="venue-status"><span>{b.beers.length} on tap</span><span>{openingStatus(b,new Date())}</span></div><Link className="text-link" href={"/breweries/"+b.id}>Tap list <ArrowRight size={14}/></Link></CardContent></Card>)}</div></section>} picks={<section className="compact-picks"><div className="compact-section-heading"><h2>Worth the detour.</h2><Link href="/explore" className="text-link">Explore the city ↗</Link></div><div className="geek-grid">{fieldNotes.map(n=><Card className="local-pick" key={n.id}><CardContent><span className="eyebrow">{n.tag}</span><h3>{n.title}</h3><p>{n.text}</p><div><Button asChild size="sm"><Link href={"/breweries/"+n.id}>See the taproom <ArrowUpRight size={14}/></Link></Button><a className="fine" href={n.source}>Brewery story ↗</a></div></CardContent></Card>)}</div></section>}/>
 </main>}
