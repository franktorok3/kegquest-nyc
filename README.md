# KegQuest NYC

A mobile-first, independently sourced NYC brewery field guide. Next.js App Router, TypeScript, React, Tailwind CSS, Lucide icons. No database, API keys, paid integrations, or user account required.

## Features

- 46 initial brewery/producer entries representing all five boroughs; growing coverage, not an exhaustive census or a list of guaranteed walk-in taprooms.
- Search by brewery, neighborhood, borough, or observed beer name.
- Borough filters, style discovery from sourced draft menus, browser-local saved places.
- Individual detail routes with source URL, attempted/success timestamps, hours/visit notices, verified addresses and map links, source-provided image previews, menu availability and freshness.
- Editorial cream/forest/orange responsive design with original CSS beer illustration, keyboard focus states, reduced-motion support, mobile horizontal borough filters.

## Run

Node 22+ and npm:

```sh
npm ci
npm run dev
npm test
npm run build
npm start
```

`npm run lint` runs ESLint; `npm run typecheck` checks TypeScript (run build first to generate route types). `npm run ingest` performs a real network refresh. Tests use fixtures/mocked requests rather than hitting breweries.

## Source model

`src/data/seeds.json` is the reviewed source registry. `src/data/breweries.json` is the published snapshot. Seed names/boroughs come from the NYC Brewers Guild directory (https://www.nycbrewed.com/breweries) and official brewery location pages. The directory includes sake and other producers as listed by the Guild; it is not a promise of a public taproom. Multiple Other Half locations are separate entries.

Each snapshot records `source`, `checkedAt`, `verifiedAt`, `status`, `note`, `address`, `hours`, `image`, `beers`, and `tapStatus`. HTTP success only means the page was fetched. It does not verify every field or imply the business is open. Addresses/hours require literal reviewed source evidence. Image previews use the official page's Open Graph image, may be logos/products, and stay hosted at their original URL. The UI uses illustrated placeholders when unavailable. Source content remains owned by its publisher.

Only an explicitly labeled draft panel is parsed: `[data-tab="draft"] .list-item`, with required title, style, and ABV. This currently supports the Other Half location pages. Cans/bottles-to-go, general beer catalogues, hidden JavaScript menus, image/PDF menus, unsupported schemas and blocked sources do not become invented tap lists. Other menus remain unavailable until a tested adapter is added. A brewery site's listed beer is not a guarantee of current physical availability.

The Bronx Brewery source currently states its backyard is not open for daily service; that is a visit notice, not normal weekly hours.

## Respectful ingestion

`scripts/ingest.mjs` identifies as KegQuestBot, reads robots.txt per origin, honors disallow and crawl delay, waits at least 1.5 seconds between same-origin content requests, has request timeouts, and stops on blocked robots, non-HTML, oversized content or redirects needing review. A robots 404 means no policy; other failure codes fail closed. No login, paywall, CAPTCHA, or browser restriction is bypassed. URLs are a maintainer-controlled allowlist; there is no public arbitrary-URL ingestion endpoint. Local text evidence is saved under ignored `work/evidence/` for review, not published wholesale.

A fresh attempt replaces the snapshot. Failed sources become unavailable; previous snapshots are retained in Git history. Adding a seed does not mark its details verified. Avoid broad free-text beer extraction: add explicit location-aware adapters and fixture tests.

## Freshness and scheduling

- Recently checked: successful draft extraction within 36 hours.
- Aging: 36 hours through 7 days.
- Stale: older than 7 days; excluded from style discovery.
- Unavailable: no successfully verified draft menu.

Home and detail pages render dynamically so age is evaluated at request time, even if the scheduled job fails. Reload an already-open browser tab to update its freshness labels.

GitHub Actions `Refresh brewery sources` runs daily at 10:17 UTC and supports manual dispatch. It crawls, tests and builds before committing a snapshot. GitHub scheduling may be delayed and inactive public repos may have schedules disabled by GitHub. Vercel's Git integration deploys the changed main branch. Git-backed snapshots are used rather than writing temporary Vercel function disk or adding a database solely for scheduling. Inspect both the refresh workflow and the Vercel deployment before claiming a refresh is live. Failed runs must be investigated in Actions; no separate alerting service is configured.

## Deployment

The repository's main branch is the intended production branch. Create/link a Next.js project under the authorized Vercel account, connect the GitHub repository, build, and deploy. No app secrets are needed. Production must permit anonymous viewing; preview protection may remain enabled. Never report a preview, SSO redirect, or queued build as a live public deployment.

Validate the public alias without authentication: homepage, a detail route, unknown slug 404, mobile layout, search/borough/style filters, favorites persistence, and source/map links. Recheck Actions and production after a manual ingestion dispatch.

## Tests and limitations

Unit tests cover all boroughs, unique IDs, source lineage, freshness transitions, beer validation, style matching, draft/can separation, and robots denial/failure. Browser tests exercise responsive overflow, filters, empty results, persistence and detail navigation. Production dependency audit should remain clean.

Coverage is intentionally incomplete where the source cannot be verified. Most directory entries do not yet have a supported draft adapter or verified hours/address. Remote image sources can change or block embedding. No live inventory guarantee, open-now calculation, user tracking, geolocation, booking, or payments. Confirm hours at the brewery before traveling.

See `BUILD_PROMPT.md` for reusable Codex implementation instructions.
