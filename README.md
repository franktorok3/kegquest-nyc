# Tapbound

**Find the pour. Plan the crawl.** A mobile-first NYC brewery discovery and trail planner built with Next.js App Router, TypeScript, React, Tailwind, MapLibre and a dedicated Hatchable PostgreSQL service.

- Public frontend: https://kegquest-nyc.vercel.app
- Repository: https://github.com/franktorok3/kegquest-nyc
- Data service console: https://hatchable.com/console/projects/tapbound-data

The original KegQuest repository and Vercel project are intentionally retained. Tapbound is the product name. No unrelated database or demo project is used.

## Experience

Explore verified locations across all five NYC boroughs with synchronized map/list views, URL-based search and filters, optional location permission, source links and official-site image previews. Beer-first search finds sourced draft listings by name, original style and normalized family. Detail pages distinguish current, stale, historical and unavailable menus. The deterministic planner recommends stops, estimates travel allowances and arrival times, checks regular hours, and supports adding, removing, replacing and reordering stops. Drafts persist on-device; saved trails persist in PostgreSQL with unguessable public read-only links.

Unknown hours and amenities are never treated as confirmed. Event-only or closed venues are excluded from automatic recommendations. Other US cities are represented structurally but disabled until local data is verified. Coverage is a reviewed starting set, not an exhaustive census of NYC breweries.

## Development

Requires Node 22+.

```sh
npm ci
cp .env.example .env.local
npm run dev
npm test
npm run lint
npm run build
npm start
BASE_URL=http://localhost:3000 npm run test:e2e
```

Discovery, filters, maps and local drafts work without backend credentials. Durable save returns an honest unavailable message until configured. To exercise real persistence against a configured reachable data service, run `E2E_SAVE=1 BASE_URL=https://kegquest-nyc.vercel.app npm run test:e2e`. This creates two test trails. Unit tests do not call brewery sites.

## Data operations

```sh
npm run ingest
npx playwright install chromium
npm run ingest:browser
node scripts/geocode.mjs
node scripts/discover.mjs
npm run sync:db
```

The daily GitHub workflow fetches menus AND details, renders reviewed source pages in Playwright Chromium, tests/builds the snapshot, preserves normalized history in PostgreSQL, then commits the publishable snapshot. A monthly workflow collects directory links for human review without adding them to the crawler. Actions requires `TAPBOUND_PRIVATE_KEY` as a secret and `TAPBOUND_DATA_URL` as a repository variable. Cached HTTP responses use conditional validators locally; hosted Actions starts cold unless cache is restored. Maps use OpenStreetMap raster tiles and visible attribution, with no bulk download or prefetch.

## Deployment

Vercel is connected to main and needs `TAPBOUND_DATA_URL`, `TAPBOUND_PRIVATE_KEY`, and `RATE_LIMIT_SALT` in production. The private key stays server-side. Hatchable contains only its public verification key, database migration and signed API handlers. Deploy backend files from `hatchable/` through the Hatchable connector; migration files run once. The Hatchable project must have **Public** visibility for Vercel to call the API. Its admin page remains admin-only; all data endpoints require server signatures. This project visibility setting is a human action in the Hatchable console.

Do not put private keys in Git, browser bundles, screenshots or logs. Rotate the RSA pair by updating the backend verification key and both Vercel/GitHub private-key settings together.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Sources and verification](docs/DATA_SOURCES.md)
- [Operations and recovery](docs/OPERATIONS.md)
- [Remaining expansion work](docs/ROADMAP.md)
- [Reusable Codex build instructions](BUILD_PROMPT.md)
