import type { Metadata } from "next";
import Link from "next/link";
import {ArrowUpRight} from "lucide-react";
import SiteNav from "../components/navigation/site-nav";
import "./globals.css";
import "./interface.css";
export const metadata: Metadata = {
  title: {
    default: "Tapbound — Find the pour. Plan the crawl.",
    template: "%s · Tapbound",
  },
  description:
    "Discover real brewery tap lists, explore New York neighborhoods, and build a brewery trail worth sharing.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="nav">
          <Link href="/" className="brand">
            tapbound<ArrowUpRight className="brand-dot" size={28} aria-hidden="true"/>
          </Link>
          <SiteNav/>
          <span className="market-badge">NEW YORK CITY</span>
        </header>
        {children}
        <footer>
          <div>
            <Link className="brand" href="/">
              tapbound<ArrowUpRight size={24} aria-hidden="true"/>
            </Link>
            <p>Find the pour. Plan the crawl.</p>
          </div>
          <p>
            Good beer. Good company. Go explore.
            <br />
            21+ · Enjoy responsibly ·{" "}
            <Link href="/about">About Tapbound</Link>
          </p>
        </footer>
        <SiteNav mobile/>

      </body>
    </html>
  );
}
