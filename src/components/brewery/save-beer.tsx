"use client";
import {useState} from "react";
import {Bookmark,BookmarkCheck} from "lucide-react";
import {useSavedBeers,savedBeerKey} from "../../lib/saved-beers/store";
export default function SaveBeer({locationId,name,style,abv}:{locationId:string;name:string;style:string;abv?:number}){const {beers,toggle}=useSavedBeers();const [error,setError]=useState(false);const saved=beers.some(b=>b.key===savedBeerKey(locationId,name));return <span className="save-beer-control"><button type="button" className={"save-beer "+(saved?"saved":"")} aria-pressed={saved} aria-label={(saved?"Remove ":"Save ")+name+(saved?" from want to try":" to want to try")} onClick={()=>setError(!toggle({locationId,name,style,abv}))}>{saved?<BookmarkCheck size={16}/>:<Bookmark size={16}/>} {saved?"Saved":"Want to try"}</button>{error&&<span role="status" className="fine">Your browser couldn’t save this beer.</span>}</span>}
