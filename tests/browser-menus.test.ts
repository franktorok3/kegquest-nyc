import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {parseBrowserMenu} from '../ingestion/adapters/browser-menus.mjs';
const cases=[['evil-twin-menu','craftpeak',20],['evil-twin-dumbo','craftpeak',18],['grimm-menu','grimm',21],['flagship-menu','beermenus',10],['fifth-hammer-menu','fifth-hammer',14],['kills-boro-menu','kills-boro',15],['gunhill-menu','gunhill',16],['threes-menu-canonical','beermenus-page',18]] as const;
describe('reviewed rendered-menu fixtures',()=>{
 for(const[id,adapter,count]of cases)it('parses the scoped draft entries from '+id,()=>{
  const beers=parseBrowserMenu(adapter,readFileSync('tests/fixtures/'+id+'.html','utf8'));
  expect(beers).toHaveLength(count);expect(new Set(beers.map(x=>x.name)).size).toBe(count);
  expect(beers.every(x=>x.name&&x.style)).toBe(true);
  expect(beers.some(x=>/\b(cider|seltzer|cocktail)\b/i.test(x.style))).toBe(false);
 });
 it('keeps barleywine and excludes packaged drinks',()=>{
  const evil=parseBrowserMenu('craftpeak',readFileSync('tests/fixtures/evil-twin-dumbo.html','utf8'));
  expect(evil.some(x=>x.style==='Barleywine - English')).toBe(true);
  expect(evil.some(x=>x.name.includes('CUVÉE DE CANDY'))).toBe(false);
  const fifth=parseBrowserMenu('fifth-hammer',readFileSync('tests/fixtures/fifth-hammer-menu.html','utf8'));
  expect(fifth.some(x=>x.name==='CUVEE 2025')).toBe(false);
 });
});
