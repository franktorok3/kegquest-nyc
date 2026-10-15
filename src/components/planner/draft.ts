"use client";
import { useSyncExternalStore } from "react";
import { Preferences, preferencesSchema } from "../../lib/validation/trail";
export type Draft = {
  name: string;
  preferences: Preferences;
  ids: string[];
  reasons: Record<string, string>;
};
export function defaultPreferences(): Preferences {
  return {
    cityId: "nyc",
    neighborhood: "",
    preferredStyles: [],
    excludedStyles: [],
    date: new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
    }).format(new Date()),
    startTime: "14:00",
    availableMinutes: 240,
    maximumStops: 3,
    mode: "walking",
    visitMinutes: 60,
    food: false,
    outdoor: false,
  };
}
const KEY = "tapbound-draft-v1";
function read() {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}
function subscribe(f: () => void) {
  window.addEventListener("tapbound-draft", f);
  window.addEventListener("storage", f);
  return () => {
    window.removeEventListener("tapbound-draft", f);
    window.removeEventListener("storage", f);
  };
}
export function readDraft(raw = read()): Draft {
  try {
    const v = JSON.parse(raw),
      p = preferencesSchema.safeParse(v.preferences);
    if (p.success && Array.isArray(v.ids))
      return {
        name: typeof v.name === "string" ? v.name : "My NYC trail",
        preferences: p.data,
        ids: [
          ...new Set<string>(
            v.ids.filter((x: unknown) => typeof x === "string"),
          ),
        ].slice(0, 8),
        reasons: v.reasons || {},
      };
  } catch {}
  return {
    name: "My NYC trail",
    preferences: defaultPreferences(),
    ids: [],
    reasons: {},
  };
}
export function writeDraft(d: Draft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
    window.dispatchEvent(new Event("tapbound-draft"));
  } catch {}
}
export function useDraft() {
  const raw = useSyncExternalStore(subscribe, read, () => "");
  return [readDraft(raw), writeDraft] as const;
}
