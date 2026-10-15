import type { Metadata } from "next";
import AppShell from "../components/app-shell";
import "./globals.css";
export const metadata: Metadata={title:{default:"Tapbound — Find the pour. Plan the crawl.",template:"%s · Tapbound"},description:"Find your next beer, discover New York taprooms, and build a trail worth sharing."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><AppShell>{children}</AppShell></body></html>}
