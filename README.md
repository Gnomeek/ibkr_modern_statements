# IBKR Modern Statements

A client-side web app for analyzing Interactive Brokers activity statements. Upload your CSV exports and get a clean dashboard — no data ever leaves your browser.

**Live demo:** _(deploy to Vercel and paste URL here)_

---

## Features

- **Multi-file support** — IBKR limits exports to 365 days. Upload multiple CSVs covering different periods; overlapping date ranges are detected and deduplicated automatically.
- **Overview tab** — total NAV, realized + unrealized P/L, total return %, time-weighted return, and an interactive portfolio allocation donut chart.
- **Positions tab** — sortable table with per-ticker cost price, current price, market value, realized/unrealized P/L, and return %. Each row has a share button.
- **Trades tab** — full trade history, sortable by any column, filterable by ticker.
- **Share cards** — generate a 375×500px card per ticker showing either return rate or P/L amount. Supports dark and light themes. Downloads as a high-resolution PNG.
- **One-click privacy mask** — hide all dollar amounts with a single button, safe for screen sharing.
- **EN / 中文** language toggle.
- **Dark / light** theme toggle.

---

## How to export from IBKR

1. Log in → **Reports** → **Statements**
2. Select statement type: **Activity**
3. Set date range (max 365 days per export) → format: **CSV**
4. Download. For history longer than 365 days, export multiple CSVs and upload them all at once.

---

## Local development

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # run unit tests (19 tests)
npm run build     # production build → dist/
```

Requires Node 18+.

---

## Deploy to Vercel

**Option A — CLI**

```bash
npm install -g vercel
vercel
```

Follow the prompts. Vercel auto-detects Vite:
- Build command: `npm run build`
- Output directory: `dist`

**Option B — GitHub auto-deploy**

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Git Repository
3. Select the repo — zero config needed
4. Every `git push` triggers a new deployment

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite |
| Styling | Tailwind CSS v4 |
| Components | Base UI (MUI headless) |
| Charts | Recharts |
| CSV parsing | PapaParse |
| Image export | html2canvas |
| Routing | React Router v6 (hash mode) |
| Tests | Vitest |

---

## Architecture

All processing happens in the browser. The data flow is:

```
CSV file(s)
  → PapaParse
  → parseStatement()       src/lib/parser.ts
  → mergeStatements()      src/lib/merger.ts   (dedup overlapping periods)
  → StatementContext        src/context/StatementContext.tsx
  → Dashboard components
```

Key files:

```
src/
  lib/
    parser.ts          CSV → StatementData (handles IBKR's multi-section format)
    merger.ts          StatementData[] → MergedStatementData
    calculations.ts    Derived metrics (ticker summaries, portfolio totals)
    shareCard.ts       html2canvas PNG export
  context/
    StatementContext.tsx  Global state (files, merged data, UI preferences)
  pages/
    UploadPage.tsx
    DashboardPage.tsx
  components/
    overview/          SummaryCards, PortfolioPieChart, PeriodInfo
    positions/         PositionsTable, ShareModal, ShareCard
    trades/            TradesTable, TickerFilter
    ui/                PnlCell
```

---

## Privacy

No network requests are made after the page loads. Your CSV data is parsed entirely in the browser and never transmitted anywhere.
