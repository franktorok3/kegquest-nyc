import { test, expect } from "@playwright/test";
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
  await page
    .getByLabel("Add brewery", { exact: true })
    .selectOption("other-half-centre");
  await page.locator(".add-stop button").click();
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
  await page.getByRole("combobox", { name: "Borough", exact: true }).selectOption("Queens");
  await expect(page).toHaveURL(/borough=Queens/);
  await expect(page.locator(".location-card").first()).toBeVisible();
  await page.getByRole("combobox", { name: "Borough", exact: true }).selectOption("Manhattan");
  await expect(page).toHaveURL(/borough=Manhattan/);
  await page.goBack();
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
  await page.getByLabel("Trail name").fill("Tapbound verified trail");
  await page
    .getByLabel("Add brewery", { exact: true })
    .selectOption("other-half-centre");
  await page.locator(".add-stop button").click();
  await page.getByRole("button", { name: /Save.*share/i }).click();
  const input = page.getByLabel("Public trail link");
  await expect(input).toBeVisible({ timeout: 25000 });
  const url = await input.inputValue();
  const fresh = await browser.newContext();
  const visitor = await fresh.newPage();
  await visitor.goto(url);
  await expect(
    visitor.getByRole("heading", { name: "Tapbound verified trail" }),
  ).toBeVisible();
  await expect(visitor.locator(".stop")).toHaveCount(1);
  await fresh.close();
});

test("map toggle and recommendation builder remain usable", async ({
  page,
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
  await page.getByLabel("Planned date").fill("2026-10-17");
  await page.getByLabel("Start time", { exact: true }).fill("14:00");
  await page.getByRole("button", { name: /Generate recommended/ }).click();
  await expect(page.locator(".stop").first()).toBeVisible();
  expect(await page.locator(".stop").count()).toBeLessThanOrEqual(3);
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
 await page.getByRole("combobox",{name:"Beer borough"}).selectOption("Brooklyn");
 await page.getByRole("combobox",{name:"Maximum ABV"}).selectOption("5");
 await expect(page).toHaveURL(/maxAbv=5/);
 await page.reload();
 await expect(page.getByRole("combobox",{name:"Beer borough"})).toHaveValue("Brooklyn");
 await expect(page.getByRole("combobox",{name:"Maximum ABV"})).toHaveValue("5");
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
 await expect(page.getByRole("heading",{name:"Good beer, near you."})).toBeVisible();
 await expect(page.locator(".location-card")).toHaveCount(0);
 await page.getByRole("button",{name:"Use my location",exact:true}).click();
 await expect(page.getByRole("combobox",{name:"Nearby radius"})).toHaveValue("5");
 await expect(page.locator(".location-card").first()).toBeVisible();
 const distances=await page.locator(".location-card .badge").allTextContents();
 const miles=distances.filter(x=>x.includes("mi away")).map(parseFloat);
 expect(miles.length).toBeGreaterThan(0);expect(miles).toEqual([...miles].sort((a,b)=>a-b));expect(miles.every(x=>x<=5)).toBe(true);
 await expect(page.locator(".location-card").first().getByRole("link",{name:"Directions"})).toHaveAttribute("href",/maps/);
 await page.getByText("Refine results · style, hours & more").click();
 await page.getByRole("textbox",{name:"Search breweries"}).fill("Threes");
 await page.getByRole("button",{name:"Search",exact:true}).click();
 await expect(page.getByRole("combobox",{name:"Nearby radius"})).toBeVisible();
 await expect(page.locator(".location-card").first()).toContainText("Threes");
 await context.setGeolocation({latitude:34.05,longitude:-118.24});
 await page.getByRole("button",{name:"Update location"}).click();
 await expect(page.getByText("Widen the distance or remove a filter.",{exact:false})).toBeVisible();
 await page.getByRole("button",{name:"Stop using my location"}).click();
 await expect(page.getByRole("button",{name:"Use my location"})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("denied location keeps borough browsing available",async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,"geolocation",{value:{getCurrentPosition:(_success:unknown,error:(e:{code:number})=>void)=>error({code:1})}});});
 await page.goto("/nearby");await page.getByRole("button",{name:"Use my location"}).click();
 await expect(page.getByRole("status")).toContainText("Location access is blocked");
 await page.getByRole("link",{name:"Browse by borough instead"}).click();
 await expect(page.getByRole("combobox",{name:"Borough",exact:true})).toBeVisible();
 await expect(page.locator(".location-card").first()).toBeVisible();
});
