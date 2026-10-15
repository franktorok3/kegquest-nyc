export const tastes = [
  {id:"crisp",name:"Crisp & clean",hint:"Pilsners, helles & Kölsch",color:"#edc85f",pattern:/pils|helles|kölsch|kolsch|pale lager/i},
  {id:"hoppy",name:"Hop forward",hint:"West Coast to hazy IPA",color:"#bed293",pattern:/ipa|pale ale/i},
  {id:"tart",name:"Tart & fruity",hint:"Sours, gose & wild ales",color:"#e8b0b4",pattern:/sour|gose|wild ale|berliner|lambic/i},
  {id:"dark",name:"Dark & roasty",hint:"Stouts, porters & dark lagers",color:"#b5a3cb",pattern:/stout|porter|schwarz|dark lager|dunkel/i},
  {id:"curious",name:"Something different",hint:"Saison & Belgian-style ales",color:"#a7cbd2",pattern:/saison|farmhouse|belgian|tripel|dubbel/i},
];
export function matchesTaste(style:string, taste:string) {
  return !taste || !!tastes.find(t=>t.id===taste)?.pattern.test(style);
}
export const fieldNotes = [
  {id:"grimm",title:"A little funk. A little pizza.",text:"Grimm pairs a brewery-floor taproom with Lala’s rooftop apizza. Start with its current saison, sour or hop-forward lineup, then head upstairs for a change of scene.",source:"https://grimmales.com/our-story/",tag:"THE BEER GEEK DETOUR"},
  {id:"threes-gowanus",title:"Your afternoon has a backyard.",text:"Threes Gowanus brings a working brewery, kitchen, beer garden and music under one roof. A place to settle in with friends and work your way through the tap list.",source:"https://threesbrewing.com/pages/gowanus",tag:"THE LONG-AFTERNOON PICK"},
];
