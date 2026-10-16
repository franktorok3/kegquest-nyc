import {describe,it,expect} from "vitest";
import {searchBeers} from "../src/lib/beer-search";
import {visitableLocations} from "../src/lib/catalog";
import {parseSavedBeers,savedBeerKey} from "../src/lib/saved-beers/store";
const now=new Date("2026-10-15T18:00:00Z");
const venue={...visitableLocations[0],id:"test",name:"Test Taproom",borough:"Queens",menuVerifiedAt:now.toISOString(),tapStatus:"verified",schedule:null,beers:[{name:"Small",style:"Pilsner",family:"Pilsner",abv:4.5,serving:"draft" as const},{name:"Big",style:"Double IPA",family:"IPA",abv:8,serving:"draft" as const},{name:"Unknown",style:"Lager",family:"Lager",serving:"draft" as const}]};
describe("practical beer discovery",()=>{
 it("combines geography and strength, excluding unknown ABV",()=>{expect(searchBeers([venue],{borough:"Queens",maxAbv:"5"},now).map(x=>x.beer.name)).toEqual(["Small"]);expect(searchBeers([venue],{borough:"Brooklyn"},now)).toHaveLength(0);});
 it("searches brewery names and excludes unconfirmed opening hours",()=>{expect(searchBeers([venue],{q:"Test Taproom"},now)).toHaveLength(3);expect(searchBeers([venue],{open:true},now)).toHaveLength(0);});
 it("does not recover stale beers through search or strength filters",()=>{expect(searchBeers([{...venue,tapStatus:"unavailable"}],{q:"Small"},now)).toHaveLength(0);});
 it("normalizes saved keys and tolerates invalid browser storage",()=>{expect(savedBeerKey("a","  BIG   Beer ")).toBe(savedBeerKey("a","big beer"));expect(parseSavedBeers("not json")).toEqual([]);expect(parseSavedBeers('{"name":"beer"}')).toEqual([]);expect(parseSavedBeers('[{},null,3]')).toEqual([]);});
});
