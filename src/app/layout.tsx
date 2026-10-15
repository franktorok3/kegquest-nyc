import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "../components/navigation";
import "./globals.css";
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
            tapbound<span className="brand-dot">↗</span>
          </Link>
          <Navigation />
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
            Good beer. Good company. Go explore.
            <br />
            21+ · Enjoy responsibly ·{" "}
            <Link href="/about">About Tapbound</Link>
          </p>
        </footer>
        <Navigation mobile />
      </body>
    </html>
  );
}
