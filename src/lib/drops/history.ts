export type ObservedMenu = {
  id: string;
  source: string;
  menuSource?: string;
  parserVersion?: string;
  tapStatus: string;
  menuVerifiedAt?: string | null;
  beers: { name: string }[];
};
export type DropHistory = Record<string, {
  source: string;
  parser: string;
  checkedAt: string;
  beers: Record<string, { firstSeen: string; kind: "addition" | "baseline" }>;
}>;
export const beerKey = (name: string) => name.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

// Failed checks never reset history. A new source/parser establishes a baseline,
// since greater extraction coverage is not evidence of a newly added beer.
export function updateDropHistory(history: DropHistory, menus: ObservedMenu[]): DropHistory {
  const next: DropHistory = structuredClone(history);
  for (const menu of menus) {
    const time = menu.menuVerifiedAt;
    if (menu.tapStatus !== "verified" || !time || !Number.isFinite(Date.parse(time)) || !menu.beers.length) continue;
    const old = next[menu.id];
    if (old && Date.parse(time) <= Date.parse(old.checkedAt)) continue;
    const source = menu.menuSource || menu.source;
    const parser = menu.parserVersion || "legacy";
    const comparable = old?.source === source && old?.parser === parser;
    const beers = { ...old?.beers };
    for (const beer of menu.beers) {
      const key = beerKey(beer.name);
      if (key && !beers[key]) beers[key] = { firstSeen: time, kind: comparable ? "addition" : "baseline" };
    }
    next[menu.id] = { source, parser, checkedAt: time, beers };
  }
  return next;
}
