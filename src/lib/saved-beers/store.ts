"use client";
import {useSyncExternalStore} from "react";
export type SavedBeer={key:string;locationId:string;name:string;style:string;abv?:number;savedAt:string};
const storageKey="tapbound:wanted-beers:v1",event="tapbound:wanted-beers-change";
export const savedBeerKey=(locationId:string,name:string)=>locationId+":"+name.normalize("NFKC").trim().replace(/\s+/g," ").toLowerCase();
export function parseSavedBeers(raw:string|null):SavedBeer[]{
 try{const value:unknown=JSON.parse(raw||"[]");if(!Array.isArray(value))return [];return value.filter((x):x is SavedBeer=>!!x&&typeof x==='object'&&typeof x.key==='string'&&typeof x.locationId==='string'&&typeof x.name==='string'&&typeof x.style==='string'&&typeof x.savedAt==='string').slice(0,500);}catch{return [];}
}
function snapshot(){try{return localStorage.getItem(storageKey)||"[]";}catch{return "[]";}}
function subscribe(cb:()=>void){window.addEventListener("storage",cb);window.addEventListener(event,cb);return()=>{window.removeEventListener("storage",cb);window.removeEventListener(event,cb);};}
export function useSavedBeers(){const raw=useSyncExternalStore(subscribe,snapshot,()=>"[]");const beers=parseSavedBeers(raw);return {beers,toggle:(beer:Omit<SavedBeer,"key"|"savedAt">)=>{const key=savedBeerKey(beer.locationId,beer.name);const current=parseSavedBeers(snapshot());const next=current.some(x=>x.key===key)?current.filter(x=>x.key!==key):[{...beer,key,savedAt:new Date().toISOString()},...current].slice(0,500);try{localStorage.setItem(storageKey,JSON.stringify(next));window.dispatchEvent(new Event(event));return true;}catch{return false;}}};}
