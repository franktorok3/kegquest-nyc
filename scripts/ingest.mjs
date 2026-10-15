import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const agent='KegQuestBot';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const policies=new Map(); const last=new Map();
export async function respectfulFetch(url){
 const u=new URL(url); if(u.protocol!=='https:')throw Error('HTTPS required');
 if(!policies.has(u.origin)){
  const r=await fetch(u.origin+'/robots.txt',{headers:{'User-Agent':agent+'/1.0 (NYC brewery directory)'},signal:AbortSignal.timeout(15000),redirect:'error'});
  if(r.status!==404&&!r.ok)throw Error('Robots unavailable: '+r.status);
  policies.set(u.origin,robotsParser(u.origin+'/robots.txt',r.status===404?'':await r.text()));
 }
 const p=policies.get(u.origin);if(p.isAllowed(url,agent)===false)throw Error('Disallowed by robots.txt');
 const delay=Math.max(1500,(p.getCrawlDelay(agent)||0)*1000);if(delay>30000)throw Error('Crawl delay exceeds budget');
 await pause(Math.max(0,delay-(Date.now()-(last.get(u.origin)||0))));last.set(u.origin,Date.now());
 const r=await fetch(url,{headers:{'User-Agent':agent+'/1.0 (NYC brewery directory)'},signal:AbortSignal.timeout(20000),redirect:'manual'});
 if(r.status>=300&&r.status<400)throw Error('Redirect requires reviewed source URL');
 if(!r.ok)throw Error('HTTP '+r.status);if(!r.headers.get('content-type')?.includes('text/html'))throw Error('Not HTML');
 const html=await r.text();if(html.length>4000000)throw Error('Page too large');return html;
}
export function parseDraft(html){
 const $=cheerio.load(html);const beers=[];
 // Explicit Untappd/Craftpeak draft panels only. Never scan product catalogues.
 $('[data-tab="draft"]').each((_,panel)=>{
  $(panel).find('.list-item').each((_,el)=>{
   const name=$(el).find('.item-title').first().text().trim();
   const style=$(el).find('.item-descriptor').first().text().trim();
   const abv=$(el).text().match(/(\d+(?:\.\d+)?)\s*%/);
   if(name&&style&&abv&&!beers.some(b=>b.name===name))beers.push({name,style,abv:Number(abv[1])});
  });
 });return beers;
}
export function parseEckhart(html){
 const $=cheerio.load(html),beers=[];
 $('section.menu-section').filter((_,el)=>$(el).find('h2').text().trim()==='On Draft Now').find('.draft-beer').each((_,el)=>{
 const name=$(el).find('h3').text().trim(),abv=$(el).find('.ibu-abv').text().match(/(\d+(?:\.\d+)?)\s*%/);
 if(name&&abv)beers.push({name,style:name,abv:Number(abv[1])});
 });return beers;
}
async function run(){
 const seeds=JSON.parse(await fs.readFile(path.join(root,'src/data/seeds.json'),'utf8'));const result=[];
 for(const seed of seeds){
  const checkedAt=new Date().toISOString();let record={...seed,checkedAt,verifiedAt:null,status:'unavailable',image:null,beers:[],tapStatus:'unavailable',hours:null,address:null};
  try{
   const html=await respectfulFetch(seed.source);const $=cheerio.load(html);$('script,style,noscript').remove();const text=$('body').text().replace(/\s+/g,' ').trim();
   record.status='verified';record.verifiedAt=checkedAt;
   const image=$('meta[property="og:image"]').attr('content');if(image){const resolved=new URL(image,seed.source);if(resolved.protocol==='https:')record.image=resolved.href;}
   // Reviewed literal evidence must still appear on each refresh.
   if(seed.addressEvidence&&text.toLowerCase().includes(seed.addressEvidence.toLowerCase()))record.address=seed.displayAddress;
   if(seed.hoursEvidence&&text.toLowerCase().includes(seed.hoursEvidence.toLowerCase()))record.hours=seed.hoursEvidence;
   record.beers=new URL(seed.source).hostname==='eckhartbeer.com'?parseEckhart(html):new URL(seed.source).hostname==='otherhalfbrewing.com'?parseDraft(html):[];record.tapStatus=record.beers.length?'verified':'unavailable';
   record.note=record.beers.length?'Extracted from an explicitly labeled draft section.':'No supported, verifiable draft list found on this page.';
   await fs.mkdir(path.join(root,'work/evidence'),{recursive:true});await fs.writeFile(path.join(root,'work/evidence',seed.id+'.txt'),text);
  }catch(e){record.note=e.message;}
  result.push(record);console.log(seed.name,record.status,record.beers.length,record.note);
 }
 await fs.writeFile(path.join(root,'src/data/breweries.json'),JSON.stringify(result,null,2)+'\n');
}
if(process.argv[1]===fileURLToPath(import.meta.url))await run();
