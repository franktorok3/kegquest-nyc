import { describe, it, expect } from "vitest";
import { updateDropHistory, type ObservedMenu } from "../src/lib/drops/history";
import { latestDrops } from "../src/lib/drops/feed";
import { visitableLocations } from "../src/lib/catalog";
const menu = (names: string[], time: string, extra = {}): ObservedMenu => ({id:"test", source:"https://example.com/menu", parserVersion:"1", tapStatus:"verified", menuVerifiedAt:time, beers:names.map(name => ({name})), ...extra});
const day1="2026-10-14T12:00:00Z", day2="2026-10-15T12:00:00Z", day3="2026-10-16T12:00:00Z";
describe("new beer observations", () => {
  it("treats first coverage as baseline, then detects additions without resetting dates", () => {
    const start=updateDropHistory({},[menu(["A"],day1)]);
    const next=updateDropHistory(start,[menu([" A  ","B"],day2)]);
    expect(next.test.beers.a).toEqual({firstSeen:day1,kind:"baseline"});
    expect(next.test.beers.b).toEqual({firstSeen:day2,kind:"addition"});
    expect(start.test.beers.b).toBeUndefined();
    expect(updateDropHistory(next,[menu(["A","B"],day3)]).test.beers.b.firstSeen).toBe(day2);
  });
  it("does not treat failed checks or returning beers as new", () => {
    const start=updateDropHistory({},[menu(["A"],day1)]);
    const failed=updateDropHistory(start,[menu([],day2,{tapStatus:"unavailable"})]);
    expect(failed).toEqual(start);
    expect(updateDropHistory(failed,[menu(["A"],day3)]).test.beers.a.firstSeen).toBe(day1);
  });
  it("new sources and parser coverage establish baselines; older observations cannot overwrite", () => {
    const start=updateDropHistory({},[menu(["A"],day1)]);
    const next=updateDropHistory(start,[menu(["A","B"],day2,{parserVersion:"2"})]);
    expect(next.test.beers.b.kind).toBe("baseline");
    expect(updateDropHistory(next,[menu(["C"],day1)])).toEqual(next);
    expect(updateDropHistory(next,[menu(["D"],day3,{menuSource:"https://example.com/new"})]).test.beers.d.kind).toBe("baseline");
  });
  it("shows only recent observations still present on fresh visitable menus", () => {
    const l={...visitableLocations[0], id:"test", menuVerifiedAt:day2, tapStatus:"verified",beers:[{name:"A",style:"IPA",family:"IPA",serving:"draft" as const}]};
    const h=updateDropHistory({},[menu(["A"],day1)]);
    expect(latestDrops([l],h,Date.parse(day2))).toHaveLength(1);
    expect(latestDrops([{...l,tapStatus:"unavailable"}],h,Date.parse(day2))).toHaveLength(0);
    expect(latestDrops([{...l,beers:[]}],h,Date.parse(day2))).toHaveLength(0);
    expect(latestDrops([{...l,menuVerifiedAt:"2026-11-15T12:00:00Z"}],h,Date.parse("2026-11-15T12:00:00Z"))).toHaveLength(0);
  });
});

it("expires current discovery after 24 hours even if the last menu is retained", async () => {
  const {currentMenu}=await import("../src/lib/catalog");
  const location={...visitableLocations[0],tapStatus:"verified",menuVerifiedAt:day1};
  expect(currentMenu(location,Date.parse(day1)+24*3600000)).toBe(true);
  expect(currentMenu(location,Date.parse(day1)+24*3600000+1)).toBe(false);
});
