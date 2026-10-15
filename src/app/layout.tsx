import type {Metadata} from 'next';
import Link from 'next/link';
import {Beer,ArrowUpRight} from 'lucide-react';
import './globals.css';
export const metadata:Metadata={title:'KegQuest NYC — Find your next great pint',description:'An independent field guide to NYC breweries. Explore five boroughs, source-checked tap lists, and your next great pint.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><header className="nav"><Link href="/" className="brand"><span className="brand-icon"><Beer size={22}/></span>KEGQUEST<span className="nyc">NYC</span></Link><nav><Link href="/#explore">The breweries</Link><Link href="/about">Our field notes <ArrowUpRight size={14}/></Link></nav></header>{children}<footer><Link href="/" className="brand">KEGQUEST <span className="nyc">NYC</span></Link><p>Five boroughs. Endless discoveries.</p><div>Independent guide · 21+ · Take the train, enjoy the journey.<br/><Link href="/about">Sources, freshness & coverage ↗</Link></div></footer></body></html>}
