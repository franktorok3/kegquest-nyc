"use client";
import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowUp, ArrowDown, Trash2, Plus, Copy, Check } from "lucide-react";
import { useDraft } from "../../components/planner/draft";
import {
  visitableLocations,
  locations,
  markets,
  directions,
} from "../../lib/catalog";
import { styleFamilies } from "../../lib/matching/styles";
import { buildTrail, recommend } from "../../lib/planner";
import { Preferences } from "../../lib/validation/trail";
const Map = dynamic(() => import("../../components/map/brewery-map"), {
  ssr: false,
  loading: () => <div className="map-skeleton">Loading map…</div>,
});
export default function Planner() {
  const [d, setDraft] = useDraft(),
    [add, setAdd] = useState(""),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [share, setShare] = useState(""),
    [copied, setCopied] = useState(false);
  const p = d.preferences,
    trail = buildTrail(d.ids, p, locations, d.name);
  function update(changes: Partial<Preferences>) {
    setDraft({ ...d, preferences: { ...p, ...changes } });
    setShare("");
  }
  function move(index: number, delta: number) {
    const ids = [...d.ids];
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    setDraft({ ...d, ids });
    setShare("");
  }
  async function save() {
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/trails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: d.name,
          preferences: p,
          locationIds: d.ids,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error || "Could not save trail.");
      const url = window.location.origin + data.url;
      setShare(url);
      try {
        const existing = JSON.parse(
          localStorage.getItem("tapbound-trails-v1") || "[]",
        );
        localStorage.setItem(
          "tapbound-trails-v1",
          JSON.stringify(
            [
              { name: d.name, url, date: p.date, token: data.token },
              ...existing,
            ].slice(0, 50),
          ),
        );
      } catch {}
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save. Your draft remains on this device.",
      );
    } finally {
      setSaving(false);
    }
  }
  const selected = trail.stops
    .map((s) => locations.find((l) => l.id === s.locationId))
    .filter((l) => !!l);
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow muted">THE CRAWL BUILDER</span>
          <h1>
            A better way to
            <br className="mobile-break" /> make a day of it.
          </h1>
          <p>
            Choose your taste, time, and neighborhood. We’ll connect the stops.
          </p>
        </div>
        <span className="badge">Draft saved on this device</span>
      </div>
      <div className="planner-layout">
        <aside className="preferences">
          <h2>Make it yours.</h2>
          <label>
            Trail name
            <input
              aria-label="Trail name"
              maxLength={80}
              value={d.name}
              onChange={(e) => {
                setDraft({ ...d, name: e.target.value });
                setShare("");
              }}
            />
          </label>
          <label>
            City
            <select
              aria-label="Planner city"
              value={p.cityId}
              onChange={(e) => update({ cityId: e.target.value })}
            >
              {markets.map((m) => (
                <option value={m.id} disabled={!m.active} key={m.id}>
                  {m.name}
                  {!m.active ? " · coming later" : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Starting neighborhood
            <select
              aria-label="Starting neighborhood"
              value={p.neighborhood}
              onChange={(e) => update({ neighborhood: e.target.value })}
            >
              <option value="">Anywhere in the city</option>
              {[...new Set(visitableLocations.map((b) => b.neighborhood))]
                .sort()
                .map((n) => (
                  <option key={n}>{n}</option>
                ))}
            </select>
          </label>
          <div className="field-pair">
            <label>
              Date
              <input
                type="date"
                aria-label="Planned date"
                value={p.date}
                onChange={(e) => {
                  if (e.target.value) update({ date: e.target.value });
                }}
              />
            </label>
            <label>
              Start time
              <input
                type="time"
                aria-label="Start time"
                value={p.startTime}
                onChange={(e) => {
                  if (e.target.value) update({ startTime: e.target.value });
                }}
              />
            </label>
          </div>
          <div className="field-pair">
            <label>
              Time available
              <select
                aria-label="Time available"
                value={p.availableMinutes}
                onChange={(e) =>
                  update({ availableMinutes: Number(e.target.value) })
                }
              >
                {[120, 180, 240, 300, 360, 480].map((n) => (
                  <option value={n} key={n}>
                    {n / 60} hours
                  </option>
                ))}
              </select>
            </label>
            <label>
              Desired stops
              <select
                aria-label="Desired stops"
                value={p.maximumStops}
                onChange={(e) =>
                  update({ maximumStops: Number(e.target.value) })
                }
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="field-pair">
            <label>
              Getting around
              <select
                aria-label="Transportation"
                value={p.mode}
                onChange={(e) =>
                  update({ mode: e.target.value as Preferences["mode"] })
                }
              >
                {["walking", "cycling", "driving", "transit"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <label>
              Time per stop
              <select
                aria-label="Time per stop"
                value={p.visitMinutes}
                onChange={(e) =>
                  update({ visitMinutes: Number(e.target.value) })
                }
              >
                {[30, 45, 60, 90, 120].map((n) => (
                  <option value={n} key={n}>
                    {n} minutes
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset>
            <legend>Your preferred styles</legend>
            <div className="preference-chips">
              {styleFamilies
                .filter((s) => s !== "Other")
                .map((s) => (
                  <button
                    type="button"
                    aria-pressed={p.preferredStyles.includes(s)}
                    className={p.preferredStyles.includes(s) ? "active" : ""}
                    key={s}
                    onClick={() =>
                      update({
                        preferredStyles: p.preferredStyles.includes(s)
                          ? p.preferredStyles.filter((x) => x !== s)
                          : [...p.preferredStyles, s],
                      })
                    }
                  >
                    {s}
                  </button>
                ))}
            </div>
          </fieldset>
          <details>
            <summary>Exclusions & amenities</summary>
            <label>
              Exclude beers in this style
              <select
                value={p.excludedStyles[0] || ""}
                onChange={(e) =>
                  update({
                    excludedStyles: e.target.value ? [e.target.value] : [],
                  })
                }
              >
                <option value="">No exclusion</option>
                {styleFamilies.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={p.food}
                onChange={(e) => update({ food: e.target.checked })}
              />{" "}
              Require verified food
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={p.outdoor}
                onChange={(e) => update({ outdoor: e.target.checked })}
              />{" "}
              Require verified outdoor seating
            </label>
            <p className="fine">
              Exclusions apply to known current menus. Unknown menus cannot
              establish the absence of a style.
            </p>
          </details>
          <button
            className="button full"
            onClick={() => {
              const result = recommend(p, locations);
              setDraft({ ...d, ids: result.ids, reasons: result.reasons });
              setShare("");
              setError(
                result.ids.length
                  ? ""
                  : "No verified locations fit these requirements and hours. Try more time or fewer filters.",
              );
            }}
          >
            Generate recommended stops →
          </button>
          <p className="fine">
            Recommendations prioritize short distances, menu matches, and
            regular opening hours.
          </p>
        </aside>
        <section className="plan-content">
          <Map locations={selected} route />
          <div className="section-top">
            <div>
              <h2>Your trail.</h2>
              <p className="fine">
                {trail.stops.length} stops · ~{trail.totalMinutes} min including
                visits
              </p>
            </div>
          </div>
          <p className="notice">
            Travel times are planning allowances derived from straight-line
            distances. They are not routed walking, driving, or transit
            estimates. Check directions and allow extra time.
          </p>
          {trail.totalMinutes > p.availableMinutes && (
            <p className="warning">
              This trail exceeds your available time by{" "}
              {trail.totalMinutes - p.availableMinutes} minutes.
            </p>
          )}
          {p.mode === "driving" && (
            <p className="fine">Choose a designated driver if drinking.</p>
          )}
          {trail.stops.map((s, i) => {
            const b = locations.find((b) => b.id === s.locationId)!;
            return (
              <article className="stop" key={s.locationId}>
                <span className="stop-number">{i + 1}</span>
                <div className="stop-main">
                  <span className="eyebrow">
                    {new Date(s.arrival).toLocaleTimeString("en-US", {
                      timeZone: b.timeZone,
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {new Date(s.departure).toLocaleTimeString("en-US", {
                      timeZone: b.timeZone,
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <h3>
                    <Link href={"/breweries/" + b.id}>{b.name}</Link>
                  </h3>
                  <p>{b.address}</p>
                  {s.travel && (
                    <p className="fine">
                      {s.travel.distanceKm} km straight-line · ~
                      {s.travel.minutes} min travel allowance
                    </p>
                  )}
                  {s.warning && <p className="warning">{s.warning}</p>}
                  {d.reasons[s.locationId] && (
                    <p className="reason">{d.reasons[s.locationId]}</p>
                  )}
                  <div className="stop-actions">
                    <a
                      className="text-link"
                      href={directions(b)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Directions ↗︎
                    </a>
                    <label className="replace">
                      Replace
                      <select
                        aria-label={"Replace " + b.name}
                        value=""
                        onChange={(e) => {
                          const ids = [...d.ids];
                          ids[i] = e.target.value;
                          setDraft({ ...d, ids, reasons: {} });
                          setShare("");
                        }}
                      >
                        <option value="" disabled>
                          Choose a place
                        </option>
                        {visitableLocations
                          .filter((x) => !d.ids.includes(x.id))
                          .map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.name}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="reorder">
                  <button
                    aria-label={"Move " + b.name + " up"}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp size={17} />
                  </button>
                  <button
                    aria-label={"Move " + b.name + " down"}
                    disabled={i === trail.stops.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown size={17} />
                  </button>
                  <button
                    aria-label={"Remove " + b.name}
                    onClick={() => {
                      setDraft({
                        ...d,
                        ids: d.ids.filter((id) => id !== b.id),
                        reasons: {},
                      });
                      setShare("");
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })}
          {!trail.stops.length && (
            <div className="empty">
              <h3>Your day starts here.</h3>
              <p>
                Generate recommendations or add a verified location below. You
                can adjust every stop.
              </p>
            </div>
          )}
          <div className="add-stop">
            <select
              aria-label="Add brewery"
              value={add}
              onChange={(e) => setAdd(e.target.value)}
            >
              <option value="">Choose a brewery to add</option>
              {visitableLocations
                .filter((b) => !d.ids.includes(b.id))
                .map((b) => (
                  <option value={b.id} key={b.id}>
                    {b.name} · {b.neighborhood}
                  </option>
                ))}
            </select>
            <button
              className="button secondary"
              disabled={!add || d.ids.length >= 8}
              onClick={() => {
                setDraft({ ...d, ids: [...d.ids, add] });
                setAdd("");
                setShare("");
              }}
            >
              <Plus size={17} /> Add stop
            </button>
          </div>
          <div className="save-bar">
            <div>
              <strong>Make this one a keeper.</strong>
              <p>
                No account needed. Your shared trail is public and read-only.
              </p>
            </div>
            <button
              className="button"
              disabled={!trail.stops.length || !d.name.trim() || saving}
              onClick={save}
            >
              {saving ? "Saving…" : "Save & share trail"}
            </button>
          </div>
          {error && (
            <p className="warning" role="alert">
              {error}
            </p>
          )}
          {share && (
            <div className="share-result" role="status">
              <label>
                Public trail link
                <input aria-label="Public trail link" readOnly value={share} />
              </label>
              <button
                className="button secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(share);
                    setCopied(true);
                  } catch {
                    setError("Select and copy the link above.");
                  }
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
                {copied ? "Copied" : "Copy link"}
              </button>
              <a href={share} className="text-link">
                Open shared trail ↗︎
              </a>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
