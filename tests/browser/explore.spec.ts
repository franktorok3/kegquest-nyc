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
  await page.getByLabel("Borough", { exact: true }).selectOption("Queens");
  await expect(page).toHaveURL(/borough=Queens/);
  await expect(page.locator(".location-card").first()).toBeVisible();
  await page.getByLabel("Borough", { exact: true }).selectOption("Manhattan");
  await expect(page).toHaveURL(/borough=Manhattan/);
  await page.goBack();
  await expect(page.getByLabel("Borough", { exact: true })).toHaveValue(
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
  const y=await section.evaluate(e=>e.getBoundingClientRect().top);
  const hero=await page.locator(".home-hero").evaluate(e=>e.getBoundingClientRect().top);
  expect(y).toBeLessThan(hero);
  await section.locator("h3 a").first().click();
  await expect(page).toHaveURL(/\/breweries\//);
});
