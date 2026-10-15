export type SourceCandidate={id:string;url:string;locationId:string;reliability:'official_brewery_menu'|'official_brewery_site'|'approved_provider'|'directory'};
export type ParsedBeer={name:string;style?:string;abv?:number;serving:'draft'|'can'|'bottle'|'takeaway';price?:string};
export type ParsedMenu={entries:ParsedBeer[];scope:'location';locationId:string};
export interface BrewerySourceAdapter{version:string;discover():Promise<SourceCandidate[]>;fetch(candidate:SourceCandidate):Promise<{url:string;body:string;fetchedAt:string}>;parse(result:{url:string;body:string;fetchedAt:string}):Promise<ParsedMenu>;normalize(menu:ParsedMenu):Promise<ParsedMenu>;validate(menu:ParsedMenu):Promise<{valid:boolean;errors:string[]}>;}
