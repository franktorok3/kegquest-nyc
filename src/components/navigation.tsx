"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Route, GlassWater, Bookmark } from "lucide-react";
const links = [["/explore","Explore",Compass],["/taplists","On Tap",GlassWater],["/planner","Plan",Route],["/trails","My Trails",Bookmark]] as const;
export default function Navigation({mobile=false}:{mobile?:boolean}) {
 const path=usePathname();
 return <nav className={mobile?"bottom-nav":"desktop-nav"} aria-label={mobile?"Mobile navigation":"Main navigation"}>{links.map(([href,label,Icon])=><Link href={href} key={href} aria-current={path.startsWith(href)?"page":undefined}>{mobile&&<Icon size={20}/>} {label}</Link>)}</nav>;
}
