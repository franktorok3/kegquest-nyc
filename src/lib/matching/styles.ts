export const styleFamilies = [
  "IPA",
  "Hazy IPA",
  "West Coast IPA",
  "Pale Ale",
  "Pilsner",
  "Lager",
  "Kölsch",
  "Wheat Beer",
  "Stout",
  "Porter",
  "Sour",
  "Saison",
  "Belgian Ale",
  "Amber Ale",
  "Brown Ale",
  "Strong Ale",
  "Other",
];
export function normalizeStyle(s: string) {
  if (/hazy|new england/i.test(s)) return "Hazy IPA";
  if (/west coast/i.test(s)) return "West Coast IPA";
  if (/\bipa\b/i.test(s)) return "IPA";
  if (/pils|czech.style pale lager/i.test(s)) return "Pilsner";
  if (/kölsch|kolsch/i.test(s)) return "Kölsch";
  if (/lager|festbier|marzen|märzen/i.test(s)) return "Lager";
  if (/pale ale/i.test(s)) return "Pale Ale";
  if (/stout/i.test(s)) return "Stout";
  if (/porter/i.test(s)) return "Porter";
  if (/sour|wild ale|gose|lambic/i.test(s)) return "Sour";
  if (/saison|farmhouse/i.test(s)) return "Saison";
  if (/wheat|weiss|witbier/i.test(s)) return "Wheat Beer";
  if (/belgian|dubbel|tripel/i.test(s)) return "Belgian Ale";
  if (/amber ale/i.test(s)) return "Amber Ale";
  if (/brown ale/i.test(s)) return "Brown Ale";
  if (/strong ale|barleywine/i.test(s)) return "Strong Ale";
  return "Other";
}
export function matchesStyle(original: string, selected: string) {
  return (
    !selected ||
    normalizeStyle(original) === selected ||
    (selected === "IPA" && /IPA/.test(normalizeStyle(original))) ||
    original.toLowerCase().includes(selected.toLowerCase())
  );
}
