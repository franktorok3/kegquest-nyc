import records from './data/breweries.json';
export type Brewery={id:string;name:string;borough:string;neighborhood:string;source:string;checkedAt:string;verifiedAt:string|null;status:string;image:string|null;beers:{name:string;style:string;abv:number}[];tapStatus:string;hours:string|null;address:string|null;note:string};
export const breweries=records as Brewery[];
export const boroughs=['Brooklyn','Queens','Manhattan','Bronx','Staten Island'];
export const styles=['IPA','Lager','Stout','Sour / Wild','Wheat','Non-alcoholic'];
export function freshness(b:Brewery,now=Date.now()){if(!b.verifiedAt||b.tapStatus!=='verified')return 'Unavailable';const age=now-Date.parse(b.verifiedAt);return age<=36*3600000?'Recently checked':age<=7*86400000?'Aging':'Stale';}
export function styleMatches(style:string,filter:string){if(filter==='Sour / Wild')return /sour|wild|gose|lambic/i.test(style);if(filter==='Lager')return /lager|pils|festbier|kölsch|märzen|marzen/i.test(style);if(filter==='Non-alcoholic')return /non.alcoholic/i.test(style);return style.toLowerCase().includes(filter.toLowerCase());}
export function mapUrl(b:Brewery){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(b.address||b.name+' '+b.borough+' NYC');}
