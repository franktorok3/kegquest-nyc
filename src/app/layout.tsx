import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Route, GlassWater, Bookmark } from "lucide-react";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Tapbound — Find the pour. Plan the crawl.",
    template: "%s · Tapbound",
  },
  description:
    "Discover real brewery tap lists, explore New York neighborhoods, and build a brewery trail worth sharing.",
};
const links = [
  ["/explore", "Explore", Compass],
  ["/taplists", "On Tap", GlassWater],
  ["/planner", "Plan", Route],
  ["/trails", "My Trails", Bookmark],
] as const;
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="nav">
          <Link href="/" className="brand">
            tapbound<span className="brand-dot">↗</span>
          </Link>
          <nav aria-label="Main navigation">
            {links.map(([href, label]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
          <span className="market-badge">NEW YORK CITY</span>
        </header>
        {children}
        <footer>
          <div>
            <Link className="brand" href="/">
              tapbound↗
            </Link>
            <p>Find the pour. Plan the crawl.</p>
          </div>
          <p>
            Independent, sourced, and made for exploring.
            <br />
            21+ · Enjoy responsibly ·{" "}
            <Link href="/about">Sources & field notes</Link>
          </p>
        </footer>
        <nav className="bottom-nav" aria-label="Mobile navigation">
          {links.map(([href, label, Icon]) => (
            <Link href={href} key={href}>
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </nav>
      </body>
    </html>
  );
}
