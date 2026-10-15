import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import { respectfulFetch, waitForBrowserNavigation } from "./ingest.mjs";
let seeds = JSON.parse(
  await fs.readFile(
    process.argv.includes("--extra")
      ? "src/data/browser-sources.json"
      : "src/data/seeds.json",
    "utf8",
  ),
);
if (process.argv.includes("--all"))
  seeds = [
    ...seeds,
    ...JSON.parse(await fs.readFile("src/data/browser-sources.json", "utf8")),
  ];
const cache = new Map();
await fs.mkdir("work/browser-evidence", { recursive: true });
const browser = await chromium.launch();
for (const seed of seeds) {
  if (
    process.argv[2] &&
    !["--extra", "--all"].includes(process.argv[2]) &&
    !seed.id.includes(process.argv[2])
  )
    continue;
  if (process.argv.includes("--skip")) {
    try {
      await fs.access("work/browser-evidence/" + seed.id + ".json");
      continue;
    } catch {}
  }
  const startedAt = new Date().toISOString();
  let context;
  try {
    if (cache.has(seed.source)) {
      const old = cache.get(seed.source);
      if (old === seed.id) continue;
      await fs.copyFile(
        "work/browser-evidence/" + old + ".json",
        "work/browser-evidence/" + seed.id + ".json",
      );
      await fs.copyFile(
        "work/browser-evidence/" + old + ".html",
        "work/browser-evidence/" + seed.id + ".html",
      );
      continue;
    }
    await respectfulFetch(seed.source);
    await waitForBrowserNavigation(seed.source);
    context = await browser.newContext({
      userAgent: "TapboundBot/3.0 (+https://kegquest-nyc.vercel.app/about)",
      viewport: { width: 1280, height: 1000 },
    });
    await context.route("**/*", (route) => {
      const req = route.request();
      if (["font", "media"].includes(req.resourceType())) return route.abort();
      if (
        req.isNavigationRequest() &&
        (req.frame().parentFrame() !== null || req.url().split("#")[0] !== seed.source.split("#")[0])
      )
        return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    await page.goto(seed.source, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForTimeout(1800);
    const evidence = {
      id: seed.id,
      source: page.url(),
      checkedAt: startedAt,
      text: await page.locator("body").innerText(),
      links: await page
        .locator("a[href]")
        .evaluateAll((a) => a.map((x) => ({ text: x.innerText, url: x.href }))),
      frames: page.frames().map((f) => f.url()),
      images: await page
        .locator("img")
        .evaluateAll((a) =>
          a.map((x) => ({ alt: x.alt, url: x.currentSrc || x.src })),
        ),
    };
    await fs.writeFile(
      "work/browser-evidence/" + seed.id + ".json",
      JSON.stringify(evidence, null, 2),
    );
    await fs.writeFile(
      "work/browser-evidence/" + seed.id + ".html",
      await page.content(),
    );
    cache.set(seed.source, seed.id);
    console.log(seed.id, "OK", evidence.text.length);
  } catch (e) {
    await fs.rm("work/browser-evidence/" + seed.id + ".json", { force: true });
    await fs.writeFile(
      "work/browser-evidence/" + seed.id + "-error.json",
      JSON.stringify({ id: seed.id, checkedAt: startedAt, error: e.message }),
    );
    console.log(seed.id, "BLOCKED", e.message.split("\n")[0]);
  } finally {
    await context?.close();
  }
}
await browser.close();
