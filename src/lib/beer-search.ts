import {currentMenu,type Location} from "./catalog";
import {matchesStyle} from "./matching/styles";
import {matchesTaste} from "./discovery";
import {openingStatus} from "./hours";
export type BeerFilters={q?:string;style?:string;taste?:string;borough?:string;maxAbv?:string;open?:boolean};
export function searchBeers(locations:Location[],f:BeerFilters,now=new Date()){
 const max=f.maxAbv?Number(f.maxAbv):null;
 return locations.filter(b=>b.visitable&&currentMenu(b,now.getTime())&&(!f.borough||b.borough===f.borough)&&(!f.open||openingStatus(b,now)==="Open")).flatMap(b=>b.beers.map(beer=>({b,beer}))).filter(({b,beer})=>
 (!f.q||f.q.toLowerCase().split(/\s+/).filter(Boolean).every(term=>`${beer.name} ${beer.style} ${beer.family} ${b.name} ${b.neighborhood}`.toLowerCase().includes(term)))&&matchesStyle(beer.style,f.style||"")&&matchesTaste(beer.style,f.taste||"")&&(max===null||(Number.isFinite(max)&&beer.abv!==undefined&&beer.abv<=max)));
}
