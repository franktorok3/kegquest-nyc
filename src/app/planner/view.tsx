"use client";
import {useRef,useState} from "react";
import Link from "next/link";
import {LocateFixed,Search,Plus,Check,Copy} from "lucide-react";
import {useDraft} from "../../components/planner/draft";
import SortableStops from "../../components/planner/sortable-stops";
import Photo from "../../components/brewery/photo";
import {locations,visitableLocations,currentMenu} from "../../lib/catalog";
import {suggestStops} from "../../lib/planner-suggestions";
import {Coordinates} from "../../lib/geography";
import {openingStatus} from "../../lib/hours";

export default function Planner(){
 const [draft,setDraft]=useDraft();
 const [area,setArea]=useState("Gowanus"),[query,setQuery]=useState(""),[origin,setOrigin]=useState<Coordinates>(),[locating,setLocating]=useState(false),[notice,setNotice]=useState("");
 const [saving,setSaving]=useState(false),[error,setError]=useState(""),[share,setShare]=useState(""),[copied,setCopied]=useState(false);
 const revision=useRef(0);
 const selected=draft.ids.map(id=>locations.find(b=>b.id===id)).filter(b=>!!b);
 const suggestions=suggestStops(locations,{origin,neighborhood:origin?undefined:area,selectedIds:draft.ids,query,limit:6});
 const neighborhoods=[...new Set(visitableLocations.map(b=>b.neighborhood))].sort();
 function changeStops(ids:string[]){revision.current++;setDraft({...draft,ids:[...new Set(ids)].slice(0,8),reasons:{}});setShare("");setCopied(false);}
 function add(ids:string[]){changeStops([...draft.ids,...ids]);}
 function locate(){
  if(!navigator.geolocation){setNotice("Location isn’t available. Choose a neighborhood or search for a brewery.");return;}
  setLocating(true);setNotice("");
  navigator.geolocation.getCurrentPosition(p=>{setOrigin({lat:p.coords.latitude,lng:p.coords.longitude});setQuery("");setLocating(false);setNotice("Suggestions near you. Location stays on this device.");},e=>{setLocating(false);setNotice(e.code===1?"Location is blocked. Choose a neighborhood or search instead.":"Couldn’t find your location. Choose a neighborhood or try again.");},{timeout:10000,maximumAge:0});
 }
 async function save(){
  setSaving(true);setError("");const version=revision.current;
  try{
   const r=await fetch("/api/trails",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:draft.name.trim()||"My NYC trail",preferences:draft.preferences,locationIds:selected.map(b=>b.id),format:"stops"})});
   const data=await r.json();if(!r.ok)throw Error(data.error||"Could not save trail.");
   const url=window.location.origin+data.url;
   if(version===revision.current)setShare(url);
   try{const stored=JSON.parse(localStorage.getItem("tapbound-trails-v1")||"[]");const existing=Array.isArray(stored)?stored:[];localStorage.setItem("tapbound-trails-v1",JSON.stringify([{name:draft.name.trim()||"My NYC trail",url,date:new Date().toISOString().slice(0,10),token:data.token},...existing].slice(0,50)));}catch{}
  }catch(e){setError(e instanceof Error?e.message:"Could not save. Your draft remains on this device.");}finally{setSaving(false);}
 }
 return <main className="page simple-planner">
  <div className="simple-plan-heading"><span className="eyebrow">A FEW GOOD STOPS</span><h1>Make an afternoon of it.</h1><p>Add a few places. Drag them into your order.</p></div>
  <div className="simple-plan-grid">
   <section className="your-plan" aria-labelledby="your-plan-title">
    <div className="simple-section-heading"><h2 id="your-plan-title">Your trail</h2><span>{selected.length} / 8 stops</span></div>
    {selected.length?<><SortableStops locations={selected} onReorder={changeStops} onRemove={id=>changeStops(draft.ids.filter(x=>x!==id))}/><p className="fine drag-hint">Drag the grip to reorder. Your draft saves here automatically.</p><div className="simple-save"><label>Trail name<input aria-label="Trail name" maxLength={80} value={draft.name} onChange={e=>{revision.current++;setDraft({...draft,name:e.target.value});setShare("");}}/></label><button className="button" disabled={saving} onClick={save}>{saving?"Saving…":"Save & share trail"}</button></div></>:<div className="plan-start"><span>01</span><p>Start with a taproom below.</p></div>}
    {error&&<p role="alert" className="warning">{error}</p>}
    {share&&<div className="share-result" role="status"><label>Public trail link<input aria-label="Public trail link" readOnly value={share}/></label><button className="button secondary" onClick={async()=>{try{await navigator.clipboard.writeText(share);setCopied(true);}catch{setError("Select and copy the link above.");}}}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?"Copied":"Copy link"}</button><a href={share} className="text-link">Open shared trail ↗︎</a><p className="fine">Anyone with this link can view your stops.</p></div>}
   </section>
   <section className="plan-discovery" aria-labelledby="plan-discovery-title">
    <div className="simple-section-heading"><h2 id="plan-discovery-title">Find a stop</h2></div>
    <div className="plan-location"><button className="locate-pill" disabled={locating} onClick={locate}><LocateFixed size={16}/>{locating?"Finding you…":"Use my location"}</button><label><span className="sr-only">Starting neighborhood</span><select aria-label="Starting neighborhood" value={origin?"nearby":area} onChange={e=>{setOrigin(undefined);setArea(e.target.value);setNotice("");}}>{origin&&<option value="nearby">Near you</option>}<option value="">All NYC</option>{neighborhoods.map(n=><option key={n}>{n}</option>)}</select></label></div>
    {notice&&<p role="status" className="fine plan-notice">{notice}</p>}
    <label className="plan-search"><Search size={18}/><span className="sr-only">Look up a brewery</span><input aria-label="Look up a brewery" placeholder="Brewery, neighborhood or borough" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button onClick={()=>setQuery("")} aria-label="Clear brewery search">×</button>}</label>
    <div className="suggestion-heading"><span>{query?"SEARCH RESULTS":origin?"CLOSE TO YOU":area?`AROUND ${area.toUpperCase()}`:selected.length?"NEAR YOUR LAST STOP":"NYC TAPROOMS"}</span>{!query&&suggestions.length>0&&draft.ids.length<8&&<button className="text-link" onClick={()=>add(suggestions.slice(0,Math.min(3,8-draft.ids.length)).map(x=>x.location.id))}>Add {Math.min(3,suggestions.length,8-draft.ids.length)} suggested stops</button>}</div>
    <div className="suggested-stops">{suggestions.map(({location:b,distanceKm})=><article className="suggestion" key={b.id}><Link href={"/breweries/"+b.id} tabIndex={-1} aria-hidden="true"><Photo src={b.image} name={b.name}/></Link><div><h3><Link href={"/breweries/"+b.id}>{b.name}</Link></h3><p>{b.neighborhood}{distanceKm!==null?` · ${(distanceKm/1.609344).toFixed(1)} mi`:""}</p><span>{openingStatus(b,new Date())}{currentMenu(b)?` · ${b.beers.length} beers`:" · Menu unavailable"}</span></div><button className="suggestion-add" aria-label={"Add "+b.name+" to trail"} disabled={draft.ids.length>=8} onClick={()=>add([b.id])}><Plus size={18}/></button></article>)}</div>
    {!suggestions.length&&<p className="plan-no-results">{query?"No matching taprooms. Try a brewery name or another neighborhood.":"No more taprooms nearby. Choose another neighborhood or look one up. We cover NYC."}</p>}
    {draft.ids.length>=8&&<p className="fine">Your trail has 8 stops. Remove one to make room.</p>}
    {suggestions.some(s=>s.distanceKm!==null)&&<p className="fine distance-caption">Distances are straight-line {origin?"from you":area?"from a taproom in "+area:"from your last stop"}. Check directions and hours before heading out.</p>}
   </section>
  </div>
 </main>;
}
