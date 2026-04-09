# Aciujums Performance & Infrastructure Plan

## Status legend
- [x] Done
- [ ] Pending
- [~] In progress

---

## Phase 1 — CSS bundle (153 KB → 35 KB) [x]
- [x] Replaced Bootstrap + Font Awesome with Tailwind CSS v3
- [x] Extracted ~1380 lines of project-specific CSS from custom.css into globals.css (@layer components)
- [x] All Bootstrap utility classes converted to Tailwind equivalents across 13 files
- [x] Font Awesome icons replaced with inline SVGs (bars, times, search, chevrons, facebook, linkedin)
- [x] custom.css (278KB Bootstrap+FA bundle) import removed from layout.js

## Phase 2 — Dead imports [x]
- [x] 2a: Removed dead `getIndexDataByYear` import from MapContainer.js
- [x] 2b: Deleted unused `components/Chart.js` (was importing `chart.js/auto` for nothing); moved `Chart.register()` outside component body in municipality page (was running on every render)

## Phase 3 — Unused dependencies [x]
- [x] Delete axios from Next.js app + unused hooks (useApiWithCache, useEntityData, useIndexData)

## Phase 3b — Replace axios with fetch (whole project) [x]
- [x] `functions/downloaders/vmi/index.mjs` — replaced axios+cheerio with native fetch + regex
- [x] Removed axios from `aciujums/package.json`
- [x] No other function in `functions/` uses axios

## Phase 4 — SSR boundary [x]
- [x] Extracted interactive logic into `HomeInteractive.js` (client); `page.js` is now a Server Component that SSR-renders the heading + shell

## Phase 5 — Cross-region API URLs [x]
- [x] Fix hardcoded API URLs — inject from SST env vars (done in Phase 8c)

## Phase 6 — arm64 for Next.js Lambda [x]
- [x] Set arm64 architecture for Next.js server Lambda in `sst.config.ts`

## Phase 7 — Next.js upgrade [x]
- [x] Upgraded Next.js to 16.2.2 (+ eslint-config-next)

## Phase 8 — AWS infrastructure as code (SST)

### 8a — Copy Lambda source to repo [x]
- [x] `functions/downloaders/` — 8 Node.js RC + VMI downloader functions
- [x] `functions/validators/` — 2 Python validation functions
- [x] `functions/processors/` — 2 Python processor functions
- [x] `functions/alerts/` — 1 Python SNS alert function
- [x] `functions/api/` — 5 Node.js API query functions

### 8b — Define all resources in sst.config.ts [x]
- [x] S3 bucket: `nipc-dl-raw`
- [x] S3 bucket: `nipc-dl-analytics`
- [x] DynamoDB tables: `aciujums_entities`, `aciujums_finances`, `aciujums_summary`, `aciujums_search`, `aciujums_logs`
- [x] All 8 downloader Lambda functions (nodejs24.x, arm64)
- [x] All 2 validator Lambda functions (python3.14, arm64, AWS SDK Pandas layer)
- [x] All 2 processor Lambda functions (python3.14, arm64, AWS SDK Pandas layer)
- [x] Alert Lambda (python3.14, arm64)
- [x] All 5 API Lambda functions (nodejs24.x, arm64)
- [x] API Gateway HTTP (v2) wiring
- [x] EventBridge rules (RC monthly cron, VMI monthly cron)
- [x] S3 event triggers → validators
- [x] SNS topic: `lambda-csv-errors`
- [x] CloudWatch log subscription → send-alert

### 8c — Fix cross-region latency [x]
- [x] Co-locate Next.js deployment with API (both eu-central-1)
- [x] Replace hardcoded API Gateway URLs with SST-injected env vars
- [x] Add missing `GET /search_index` route (was called from client but never existed in API)

### 8d — Fix commented-out DynamoDB inserts [x]
- [x] Uncommented `insert_data`, `insert_summary_data`, `insert_index_data` in vmi-processor

### 8e — Runtime upgrades [x]
- [x] All Node.js Lambdas → `nodejs24.x` (set in 8b)
- [x] All Python Lambdas → `python3.14` (set in 8b)
- [x] All Lambdas → `arm64` (set in 8b + Phase 6 for Next.js)
- [x] Python Lambdas → official AWS SDK Pandas layer for python3.14 arm64 (set in 8b)
