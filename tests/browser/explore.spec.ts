import { test, expect, type Page } from "@playwright/test";

async function addPlannerBrewery(page: Page, name: string) {
  await page.getByRole("textbox", { name: "Look up a brewery" }).fill(name);
  await page.getByRole("button", { name: `Add ${name} to trail`, exact: true }).click();
}

test("beer discovery, persistent draft, reorder and source details", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Find the pour",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/taplists?q=Czech+pilsner");
  await expect(page.locator(".beer-card").first()).toBeVisible();
  await page
    .locator(".beer-card")
    .first()
    .getByRole("button", { name: "Add to Trail" })
    .click();
  await page.goto("/planner");
  await expect(page.locator(".stop")).toHaveCount(1);
  await addPlannerBrewery(page, "Other Half");
  await expect(page.locator(".stop")).toHaveCount(2);
  const before = await page.locator(".stop h3").allTextContents();
  await page
    .getByRole("button", { name: /Move .* down/ })
    .first()
    .click();
  expect(await page.locator(".stop h3").allTextContents()).toEqual(
    [...before].reverse(),
  );
  await page.reload();
  await expect(page.locator(".stop")).toHaveCount(2);
  await page.locator(".stop h3 a").first().click();
  await expect(
    page.getByRole("link", { name: /Directions/ }).first(),
  ).toHaveAttribute("href", /google.com\/maps/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("filters survive navigation, empty states and unavailable sources are honest", async ({
  page,
}) => {
  await page.goto("/explore");
  await page.getByRole("button", { name: "Filter taprooms" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("combobox", { name: "Borough", exact: true }).selectOption("Queens");
  await expect(page).toHaveURL(/borough=Queens/);
  await page.getByRole("button", { name: /Show \d+ taprooms/ }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".location-card").first()).toBeVisible();
  await expect(page.locator(".place-caption .eyebrow").first()).toContainText("Queens");
  await page.getByRole("button", { name: "Filter taprooms" }).click();
  await page.getByRole("combobox", { name: "Borough", exact: true }).selectOption("Manhattan");
  await expect(page).toHaveURL(/borough=Manhattan/);
  await page.getByRole("button", { name: "Close filters" }).click();
  await page.goBack();
  await page.getByRole("button", { name: "Filter taprooms" }).click();
  await expect(page.getByRole("combobox", { name: "Borough", exact: true })).toHaveValue(
    "Queens",
  );
  await page.goto("/explore?q=no-such-place-zzzz");
  await expect(
    page.getByText("No verified matches for these filters."),
  ).toBeVisible();
  await page.goto("/breweries/bronx-brewery");
  await expect(page.getByText(/unavailable/i).first()).toBeVisible();
  const missing = await page.goto("/breweries/does-not-exist");
  expect(missing?.status()).toBe(404);
});
test("save and reopen in an independent browser", async ({ page, browser }) => {
  test.skip(
    process.env.E2E_SAVE !== "1",
    "Requires the live database to be publicly reachable",
  );
  await page.goto("/planner");
  await expect(page.getByLabel("Trail name")).toHaveCount(0);
  await addPlannerBrewery(page, "Other Half");
  await page.getByLabel("Trail name").fill("Tapbound verified trail");
  const savedRequest=page.waitForRequest(request=>request.url().endsWith("/api/trails")&&request.method()==="POST");
  await page.getByRole("button", { name: /Save.*share/i }).click();
  expect((await savedRequest).postDataJSON()).toMatchObject({format:"stops",locationIds:["other-half-centre"]});
  const input = page.getByLabel("Public trail link");
  await expect(input).toBeVisible({ timeout: 25000 });
  const url = await input.inputValue();
  const fresh = await browser.newContext();
  const visitor = await fresh.newPage();
  await visitor.goto(url);
  await expect(
    visitor.getByRole("heading", { name: "Tapbound verified trail" }),
  ).toBeVisible();
  await expect(visitor.locator(".simple-shared-stops .stop")).toHaveCount(1);
  await expect(visitor.locator(".stop h3")).toHaveText("Other Half");
  await expect(visitor.getByRole("link",{name:/Directions/})).toHaveAttribute("href",/google.com\/maps/);
  await expect(visitor.getByText(/1 taprooms?, in your chosen order\./)).toBeVisible();
  expect(await visitor.locator("main").innerText()).not.toMatch(/\b\d{1,2}:\d{2}\s*(?:AM|PM)?|\b\d{4}-\d{2}-\d{2}\b|planning allowance|minutes including visits/);
  await fresh.close();
});

test("map, neighborhood suggestions and city-wide brewery lookup remain usable", async ({
  page, context,
}) => {
  await page.goto("/explore");
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.getByLabel("Brewery location map")).toBeVisible();
  await expect(page.locator(".maplibregl-marker").first()).toBeVisible();
  expect(
    await page
      .locator(".maplibregl-canvas")
      .evaluate((el) => el.getBoundingClientRect().width),
  ).toBeGreaterThan(250);
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(page.locator(".location-card").first()).toBeVisible();
  await page.goto("/planner");
  await expect(page.getByRole("combobox",{name:"Starting neighborhood"})).toHaveValue("Gowanus");
  // Looking up a known Queens taproom must work from a Brooklyn starting area.
  await page.getByRole("textbox",{name:"Look up a brewery"}).fill("Fifth Hammer");
  await expect(page.getByRole("button",{name:"Add Fifth Hammer Brewing to trail",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Clear brewery search"}).click();
  await page.getByRole("combobox",{name:"Starting neighborhood"}).selectOption("Long Island City");
  await expect(page.locator(".suggestion-heading")).toContainText("AROUND LONG ISLAND CITY");
  await page.getByRole("button",{name:"Add 3 suggested stops",exact:true}).click();
  await expect(page.locator(".stop")).toHaveCount(3);
  const ids=await page.locator(".stop").evaluateAll(stops=>stops.map(stop=>stop.getAttribute("data-location-id")));
  expect(new Set(ids).size).toBe(3);
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({latitude:40.673,longitude:-73.990});
  await page.getByRole("button",{name:"Use my location",exact:true}).click();
  await expect(page.getByRole("combobox",{name:"Starting neighborhood"})).toHaveValue("nearby");
  await expect(page.locator(".suggestion-heading")).toContainText("CLOSE TO YOU");
  const miles=(await page.locator(".suggestion p").allTextContents()).map(value=>Number(value.match(/([\d.]+) mi/)?.[1]));
  expect(miles.length).toBeGreaterThan(0);
  expect(miles.every(Number.isFinite)).toBe(true);
  expect(miles).toEqual([...miles].sort((a,b)=>a-b));
  await expect(page.locator(".stop")).toHaveCount(3);
});

test("new beer section leads the homepage with traceable discoveries", async ({page}) => {
  await page.goto("/");
  const section=page.getByRole("region",{name:"New beer drops."});
  await expect(section.getByRole("heading",{name:"New beer drops."})).toBeVisible();
  await expect(section.locator(".drop-card").first()).toBeVisible();
  expect(await section.locator(".drop-card").count()).toBeLessThanOrEqual(6);
  await expect(section.getByRole("link",{name:"Menu source"}).first()).toHaveAttribute("href",/^https:\/\//);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator(".home-hero img")).toBeVisible();
  await section.locator("h3 a").first().click();
  await expect(page).toHaveURL(/\/breweries\//);
});

test("taste discovery opens a matching beer board with active navigation", async ({page}) => {
  await page.goto("/");
  await page.getByRole("link",{name:/Dark & roasty/}).click();
  await expect(page).toHaveURL(/taste=dark/);
  await expect(page.getByRole("heading",{level:1})).toHaveText("Dark & roasty");
  const styles=await page.locator(".beer-card>p").allTextContents();
  expect(styles.length).toBeGreaterThan(0);
  expect(styles.every(s=>/stout|porter|schwarz|dark lager|dunkel/i.test(s))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("restored guide exposes photography, boroughs, beer styles and mobile navigation", async ({page},info) => {
  await page.goto("/");
  await expect(page.locator(".home-hero img")).toBeVisible();
  await expect(page.locator(".borough-grid")).toBeVisible();
  await expect(page.locator(".flavor-paths")).toBeVisible();
  await expect(page.locator(".feature-card").first()).toBeVisible();
  await expect(page.locator(".guide-picks")).toBeVisible();
  if(info.project.name==="mobile"){
    await page.getByRole("navigation",{name:"Mobile navigation"}).getByRole("link",{name:"On Tap",exact:true}).click();
  } else {
    await page.getByRole("navigation",{name:"Main navigation"}).getByRole("link",{name:"On Tap",exact:true}).click();
  }
  await expect(page).toHaveURL(/\/taplists/);
  await expect.poll(()=>page.locator(".beer-card").count()).toBeGreaterThan(100);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("beer shortlist persists and combined practical filters survive reload",async({page})=>{
 await page.goto("/taplists");
 await page.getByRole("button",{name:"Filter beers"}).click();
 await page.getByRole("combobox",{name:"Beer borough"}).selectOption("Brooklyn");
 await expect(page).toHaveURL(/borough=Brooklyn/);
 await page.getByRole("combobox",{name:"Maximum ABV"}).selectOption("5");
 await expect(page).toHaveURL(/maxAbv=5/);
 await page.reload();
 await page.getByRole("button",{name:"Filter beers"}).click();
 await expect(page.getByRole("combobox",{name:"Beer borough"})).toHaveValue("Brooklyn");
 await expect(page.getByRole("combobox",{name:"Maximum ABV"})).toHaveValue("5");
 await page.getByRole("button",{name:"Close filters"}).click();
 await expect(page.getByRole("dialog")).not.toBeVisible();
 const card=page.locator(".beer-card").first();await expect(card).toBeVisible();
 const name=await card.locator("h3").innerText();
 await card.getByRole("button",{name:/Save .* to want to try/}).click();
 await expect(card.getByRole("button",{name:/Remove .* from want to try/})).toHaveAttribute("aria-pressed","true");
 await page.getByRole("link",{name:"My want-to-try list"}).click();
 await expect(page.getByRole("heading",{level:1,name:"Want to try."})).toBeVisible();
 await expect(page.locator(".beer-card h3")).toHaveText(name);
 await page.reload();await expect(page.locator(".beer-card h3")).toHaveText(name);
 await expect(page.getByText("On the current menu")).toBeVisible();
 await page.getByRole("button",{name:/Add to Trail/}).click();
 await page.getByRole("link",{name:/In your trail/}).click();
 await expect(page.locator(".stop")).toHaveCount(1);
 await page.goto("/saved-beers");await page.getByRole("button",{name:/Remove .* from want to try/}).click();
 await expect(page.getByText("Your next favorite belongs here.")).toBeVisible();
});


test("nearby discovery requests permission, sorts by distance and handles coverage",async({page,context})=>{
 await context.grantPermissions(["geolocation"]);
 await context.setGeolocation({latitude:40.673,longitude:-73.990});
 await page.goto("/");await page.getByRole("link",{name:"Near me",exact:true}).click();
 await expect(page.getByRole("heading",{level:1})).toHaveText("Good beer, near you.");
 await expect(page.locator(".location-card").first()).toBeVisible();
 await page.getByRole("button",{name:"Use my location",exact:true}).click();
 await expect(page.getByRole("combobox",{name:"Nearby radius"})).toHaveValue("5");
 await expect(page.locator(".location-card").first()).toBeVisible();
 const distances=await page.locator(".location-card .badge").allTextContents();
 const miles=distances.filter(x=>x.includes("mi away")).map(parseFloat);
 expect(miles.length).toBeGreaterThan(0);expect(miles).toEqual([...miles].sort((a,b)=>a-b));expect(miles.every(x=>x<=5)).toBe(true);
 await expect(page.locator(".location-card").first().getByRole("link",{name:"Directions"})).toHaveAttribute("href",/maps/);
 await page.getByRole("button",{name:"Search taprooms"}).click();
 await expect(page.getByRole("textbox",{name:"Search breweries"})).toBeFocused();
 await page.getByRole("textbox",{name:"Search breweries"}).fill("Threes");
 await page.getByRole("button",{name:"Search",exact:true}).click();
 await expect(page.getByRole("dialog")).not.toBeVisible();
 await expect(page.getByRole("combobox",{name:"Nearby radius"})).toBeVisible();
 await expect(page.locator(".location-card").first()).toContainText("Threes");
 await context.setGeolocation({latitude:34.05,longitude:-118.24});
 await page.getByRole("button",{name:"Update location"}).click();
 await expect(page.getByText("Widen the distance or remove a filter.",{exact:false})).toBeVisible();
 await page.getByRole("button",{name:"Filter taprooms"}).click();
 await page.getByRole("button",{name:"Stop using my location"}).click();
 await expect(page.getByRole("dialog")).not.toBeVisible();
 await expect(page.getByRole("button",{name:"Use my location"})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("denied location keeps borough browsing available",async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,"geolocation",{value:{getCurrentPosition:(_success:unknown,error:(e:{code:number})=>void)=>error({code:1})}});});
 await page.goto("/nearby");await page.getByRole("button",{name:"Use my location"}).click();
 await expect(page.getByRole("status")).toContainText("Location access is blocked");
 await page.getByRole("link",{name:"Browse by borough instead"}).click();
 await expect(page.getByRole("heading",{level:1})).toHaveText("Find your next stop.");
 await page.getByRole("button",{name:"Filter taprooms"}).click();
 await expect(page.getByRole("combobox",{name:"Borough",exact:true})).toBeVisible();
 await page.getByRole("button",{name:"Close filters"}).click();
 await expect(page.locator(".location-card").first()).toBeVisible();
});

test("discovery puts real places and beers before setup, with one active navigation item",async({page},info)=>{
 for(const [path,active,card] of [["/explore","Explore",".location-card"],["/nearby","Explore",".location-card"],["/taplists","On Tap",".beer-card"]]){
  await page.goto(path);
  const firstCard=page.locator(card).first();
  await expect(firstCard).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const nav=page.getByRole("navigation",{name:info.project.name==="mobile"?"Mobile navigation":"Main navigation"});
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(nav.getByRole("link",{name:active,exact:true})).toHaveAttribute("aria-current","page");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(path!=="/taplists"){
   const name=firstCard.locator(".place-cover h3");
   const beer=firstCard.locator(".pour-preview strong").first();
   await expect(firstCard.locator(".place-cover img")).toBeVisible();
   await expect(name).toBeVisible();
   await expect(beer).toBeVisible();
   if(info.project.name==="mobile"){
    for(const content of [name,beer]){
     const box=await content.boundingBox();
     expect(box).not.toBeNull();
     expect(box!.y+box!.height).toBeLessThanOrEqual(600);
    }
   }
   await page.getByRole("button",{name:"Filter taprooms"}).click();
   await expect(page.getByRole("dialog")).toBeVisible();
   await page.keyboard.press("Escape");
   await expect(page.getByRole("dialog")).not.toBeVisible();
   await expect(page.getByRole("button",{name:"Filter taprooms"})).toBeFocused();
  }
 }
});


test("dragging a trail stop changes its order and persists after reload", async ({page})=>{
 await page.goto("/planner");
 await page.getByRole("button",{name:"Add 3 suggested stops",exact:true}).click();
 const stops=page.locator(".simple-stops .stop");
 await expect(stops).toHaveCount(3);
 const before=await stops.locator("h3").allTextContents();
 await stops.first().scrollIntoViewIfNeeded();
 await stops.last().scrollIntoViewIfNeeded();
 const source=await stops.first().getByRole("button",{name:/^Drag /}).boundingBox();
 const target=await stops.last().getByRole("button",{name:/^Drag /}).boundingBox();
 expect(source).not.toBeNull();expect(target).not.toBeNull();
 await page.mouse.move(source!.x+source!.width/2,source!.y+source!.height/2);
 await page.mouse.down();
 await page.mouse.move(source!.x+source!.width/2,source!.y+source!.height/2+10,{steps:3});
 await expect(page.locator(".stop-drag-preview")).toBeVisible();
 await page.mouse.move(target!.x+target!.width/2,target!.y+target!.height/2,{steps:16});
 await expect(page.locator('[role="status"]').filter({hasText:/over stop 3 of 3/})).toHaveCount(1);
 await page.mouse.up();
 const reordered=[before[1],before[2],before[0]];
 await expect(stops.locator("h3")).toHaveText(reordered);
 await expect(page.locator(".stop-drag-preview")).toHaveCount(0);
 await page.reload();
 await expect(page.locator(".simple-stops .stop h3")).toHaveText(reordered);
});

test("keyboard drag reorders a trail, cancels safely and persists",async({page})=>{
 await page.goto("/planner");
 await page.getByRole("button",{name:"Add 3 suggested stops",exact:true}).click();
 const stops=page.locator(".simple-stops .stop");
 await expect(stops).toHaveCount(3);
 const before=await stops.locator("h3").allTextContents();
 const handle=stops.first().getByRole("button",{name:/^Drag /});
 await handle.focus();
 await page.keyboard.press("Space");
 await expect(page.locator(".stop-drag-preview")).toBeVisible();
 // Keyboard coordinates depend on the overlay's measured layout after pickup.
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 await page.keyboard.press("ArrowDown");
 await expect(page.locator('[role="status"]').filter({hasText:/over stop 2 of 3/})).toHaveCount(1);
 await page.keyboard.press("Space");
 const reordered=[before[1],before[0],before[2]];
 await expect(stops.locator("h3")).toHaveText(reordered);
 await expect(page.locator(".stop-drag-preview")).toHaveCount(0);
 await page.reload();
 await expect(page.locator(".simple-stops .stop h3")).toHaveText(reordered);
 await stops.first().getByRole("button",{name:/^Drag /}).focus();
 await page.keyboard.press("Space");
 await expect(page.locator(".stop-drag-preview")).toBeVisible();
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 await page.keyboard.press("ArrowDown");
 await expect(page.locator('[role="status"]').filter({hasText:/over stop 2 of 3/})).toHaveCount(1);
 await page.keyboard.press("Escape");
 await expect(page.locator(".stop-drag-preview")).toHaveCount(0);
 await expect(stops.locator("h3")).toHaveText(reordered);
 await page.reload();
 await expect(page.locator(".simple-stops .stop h3")).toHaveText(reordered);
});
