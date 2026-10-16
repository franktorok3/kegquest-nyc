import Link from "next/link";
import {MapPin,LocateFixed,GlassWater} from "lucide-react";
export default function DiscoveryNav({active}:{active:"taprooms"|"nearby"|"beers"}){return <nav className="discovery-nav" aria-label="Discover NYC">{([["taprooms","/explore","Taprooms",MapPin],["nearby","/nearby","Near me",LocateFixed],["beers","/taplists","Beers",GlassWater]] as const).map(([id,href,label,Icon])=><Link key={id as string} href={href as string} aria-current={id===active?"page":undefined}><Icon size={16}/>{label as string}</Link>)}</nav>}
