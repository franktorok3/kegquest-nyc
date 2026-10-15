# Operations

Daily refresh: GitHub Actions → robots-aware crawl → unit tests → production build → signed database sync → committed snapshot → Vercel deploy. Details are refreshed daily, exceeding the requested weekly cadence. Monthly discovery queues candidate links for review. Failed jobs remain failed rather than claiming fresh data. Review repository Actions for failures and `/admin` for protected data-service diagnostics.

Add a source only after reviewing its official identity, public address, visit status and robots policy. Store exact evidence literals. Add a fixture parser test, run ingestion, verify output and source timestamp, review style normalization, and commit. Do not promote directory outbound links automatically. Refresh geocodes only when addresses change. Add holiday overrides with dated evidence.

Verify production after every release: homepage anonymous HTTP 200; explore filters and map; current beer → add stop → planner; reorder and reload draft; save → independent browser opens shared token; unknown brewery/token 404; invalid input 400; unauthorized backend 401; admin public 401. `E2E_SAVE=1` is opt-in because it creates real database records.

If saving returns 503, confirm Hatchable Public project visibility, deployed backend status, matching RSA keys and Vercel environment. Do not expose a private key or substitute a temporary preview URL. Existing local drafts survive failures. If sync fails, fix the backend and rerun the workflow. Old browser catalog remains available; its freshness labels age automatically.

Use Vercel's previous known-good deployment for frontend rollback. Database ingestion upserts are idempotent per source/timestamp; historical snapshots remain. Schema migration changes require a new migration file; never edit a migration already applied to a live service. Owner-only maintenance can remove explicitly identified test trails, cascading normalized stops. No automatic destructive retention job is installed.

Secrets: TAPBOUND_PRIVATE_KEY in Vercel production/GitHub Actions, RATE_LIMIT_SALT in Vercel. Public configuration: TAPBOUND_DATA_URL. Hatchable uses its built-in database; no Supabase service credentials are required. Local .env.local, PEM files and work/ are ignored.
