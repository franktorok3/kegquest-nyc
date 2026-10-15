import { currentMenu, type Location } from "../catalog";
import { beerKey, type DropHistory } from "./history";
export function latestDrops(locations: Location[], history: DropHistory, now = Date.now()) {
  return locations.filter(l => l.visitable && currentMenu(l, now)).flatMap(location =>
    location.beers.flatMap(beer => {
      const observed = history[location.id]?.beers[beerKey(beer.name)];
      if (!observed) return [];
      const age = now - Date.parse(observed.firstSeen);
      if (age < 0 || age > 14 * 86400000) return [];
      return [{ location, beer, ...observed }];
    })
  ).sort((a, b) => Number(b.kind === "addition") - Number(a.kind === "addition") || Date.parse(b.firstSeen) - Date.parse(a.firstSeen) || a.beer.name.localeCompare(b.beer.name));
}
