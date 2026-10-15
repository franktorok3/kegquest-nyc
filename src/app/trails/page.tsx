"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useDraft } from "../../components/planner/draft";
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}
function read() {
  try {
    return localStorage.getItem("tapbound-trails-v1") || "[]";
  } catch {
    return "[]";
  }
}
export default function Trails() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]"),
    [draft] = useDraft();
  let trails: { name: string; url: string; date: string; token: string }[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      trails = parsed.filter((t) => /^[a-f0-9]{48}$/.test(t.token));
  } catch {}
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow muted">THE DAYS WORTH KEEPING</span>
          <h1>My trails.</h1>
          <p>
            Saved links on this device. Your public trails live independently of
            this browser.
          </p>
        </div>
        <Link className="button" href="/planner">
          Plan a Crawl →
        </Link>
      </div>
      {draft.ids.length > 0 && (
        <Link className="draft-banner" href="/planner">
          <strong>Continue your draft</strong>
          <span>
            {draft.name} · {draft.ids.length} stops →
          </span>
        </Link>
      )}
      <div className="cards">
        {trails.map((t) => (
          <Link
            className="saved-card"
            href={"/trails/" + t.token}
            key={t.token}
          >
            <span className="eyebrow muted">{t.date}</span>
            <h3>{t.name}</h3>
            <p>View shared itinerary ↗</p>
          </Link>
        ))}
      </div>
      {!trails.length && (
        <div className="empty">
          <h2>A good day deserves a plan.</h2>
          <p>Save a trail from the planner and it will appear here.</p>
          <Link className="button" href="/planner">
            Build your first trail
          </Link>
        </div>
      )}
    </main>
  );
}
