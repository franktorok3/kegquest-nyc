"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {Compass,Route,GlassWater,Bookmark} from "lucide-react";
const links=[["/explore","Explore",Compass],["/taplists","On Tap",GlassWater],["/planner","Plan",Route],["/trails","My Trails",Bookmark]] as const;
export default function SiteNav({mobile=false}:{mobile?:boolean}){const path=usePathname();return <nav className={mobile?"bottom-nav":"desktop-nav"} aria-label={mobile?"Mobile navigation":"Main navigation"}>{links.map(([href,label,Icon])=>{const active=href==="/explore"?["/","/explore","/nearby"].includes(path)||path.startsWith("/breweries/"):href==="/trails"?path.startsWith("/trails")||path==="/saved-beers":path.startsWith(href);return <Link key={href} href={href} aria-current={active?"page":undefined}>{mobile&&<Icon size={21}/>}<span>{label}</span></Link>})}</nav>}
