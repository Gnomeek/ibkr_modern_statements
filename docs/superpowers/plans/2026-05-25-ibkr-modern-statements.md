# IBKR Modern Statements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a purely client-side static React app that parses IBKR Activity Statement CSVs and renders a financial dashboard with per-ticker shareable cards.

**Architecture:** Vite + React 18 + TypeScript SPA with hash-based routing. CSV parsing happens in the browser via PapaParse; multiple files are merged via a deduplication strategy in `lib/merger.ts`. All state lives in a React Context; components are structured by feature area under `src/components/`.

**Tech Stack:** Vite, React 18, TypeScript, Base UI (MUI headless), Tailwind CSS v4, PapaParse, html2canvas, React Router v6 (hash), Recharts, Vitest

---

## File Map

```
ibkr_modern_statements/
  index.html
  vite.config.ts
  tailwind.config.ts          ← Tailwind v4 config
  tsconfig.json
  package.json
  src/
    main.tsx                  ← ReactDOM.createRoot, Router
    App.tsx                   ← Route definitions
    i18n.ts                   ← t() helper + EN/ZH dictionary
    types/
      statement.ts            ← All TypeScript interfaces
    lib/
      parser.ts               ← CSV raw rows → StatementData
      merger.ts               ← StatementData[] → MergedStatementData
      calculations.ts         ← Derived metrics from MergedStatementData
    context/
      StatementContext.tsx    ← React Context + Provider
    hooks/
      useStatement.ts         ← useContext(StatementContext) wrapper
    pages/
      UploadPage.tsx          ← File upload UI
      DashboardPage.tsx       ← Tab shell + top bar
    components/
      upload/
        UploadZone.tsx        ← Drag-drop + file list + overlap badge
      overview/
        SummaryCards.tsx      ← 4 metric cards
        PortfolioPieChart.tsx ← Recharts donut
        PeriodInfo.tsx        ← Period + account info row
      positions/
        PositionsTable.tsx    ← Sortable table
        ShareModal.tsx        ← Modal shell with card tabs
        ShareCard.tsx         ← Renderable card (rate + amount variants)
      trades/
        TradesTable.tsx       ← Trade log table
        TickerFilter.tsx      ← Multi-select ticker filter
      ui/
        Badge.tsx             ← Green/red P/L badge
        Card.tsx              ← Generic surface card
        PnlCell.tsx           ← Colored P/L table cell
  tests/
    lib/
      parser.test.ts
      merger.test.ts
      calculations.test.ts
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

- [ ] **Step 1: Initialise Vite project**

```bash
cd /Users/wzhao2/Documents/GithubRepos/Untitled/ibkr_modern_statements
npm create vite@latest . -- --template react-ts
```

Accept overwrite prompts (the directory already exists with non-conflicting files).

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install @base-ui-components/react react-router-dom recharts papaparse html2canvas
npm install -D tailwindcss @tailwindcss/vite vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
npm install -D @types/papaparse @types/html2canvas
```

- [ ] **Step 3: Configure Tailwind v4 in vite.config.ts**

Replace generated `vite.config.ts` with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 4: Create tests/setup.ts**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Create src/index.css with Tailwind import**

```css
@import "tailwindcss";
```

- [ ] **Step 6: Replace src/main.tsx**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
```

- [ ] **Step 7: Create src/App.tsx**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

- [ ] **Step 8: Create stub pages so the app compiles**

`src/pages/UploadPage.tsx`:
```tsx
export default function UploadPage() {
  return <div className="p-8 text-white bg-gray-900 min-h-screen">Upload</div>
}
```

`src/pages/DashboardPage.tsx`:
```tsx
export default function DashboardPage() {
  return <div className="p-8 text-white bg-gray-900 min-h-screen">Dashboard</div>
}
```

- [ ] **Step 9: Verify the app runs**

```bash
npm run dev
```

Expected: Vite dev server starts on `http://localhost:5173`, browser shows "Upload" text.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + Tailwind + Base UI project"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/types/statement.ts`

- [ ] **Step 1: Create the types file**

```ts
// src/types/statement.ts

export interface Trade {
  symbol: string
  dateTime: string        // raw string from CSV e.g. "2026-01-05, 09:48:12"
  quantity: number        // negative = sell
  price: number
  proceeds: number
  commission: number
  basis: number
  realizedPL: number
  mtmPL: number
  code: string
}

export interface OpenPosition {
  symbol: string
  quantity: number
  costPrice: number
  costBasis: number
  closePrice: number
  marketValue: number
  unrealizedPL: number
}

export interface RealizedUnrealizedSummary {
  symbol: string
  realizedTotal: number
  unrealizedTotal: number
}

export interface StatementData {
  // Meta
  periodStart: Date
  periodEnd: Date
  accountName: string
  accountId: string
  baseCurrency: string

  // NAV
  currentNav: number
  priorNav: number
  twr: number             // time-weighted return as decimal e.g. 0.09988

  // Per-ticker
  trades: Trade[]
  openPositions: OpenPosition[]
  realizedUnrealized: RealizedUnrealizedSummary[]
}

export interface TickerSummary {
  symbol: string
  quantity: number        // 0 = fully closed position
  costPrice: number       // avg cost per share (0 if fully closed)
  currentPrice: number    // 0 if fully closed
  marketValue: number     // 0 if fully closed
  realizedPL: number
  unrealizedPL: number
  totalPL: number
  returnPct: number       // totalPL / costBasis * 100
  costBasis: number
}

export interface MergedStatementData {
  periodStart: Date
  periodEnd: Date
  accountName: string
  accountId: string
  baseCurrency: string

  currentNav: number
  twr: number

  trades: Trade[]                                    // deduplicated, all files
  openPositions: OpenPosition[]                      // from latest file only
  realizedUnrealized: RealizedUnrealizedSummary[]    // recomputed from merged trades

  hasOverlap: boolean
  fileCount: number
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/statement.ts
git commit -m "feat: add TypeScript types for statement data"
```

---

## Task 3: CSV Parser

**Files:**
- Create: `src/lib/parser.ts`
- Create: `tests/lib/parser.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/lib/parser.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { parseStatement } from '../../src/lib/parser'

const csv = readFileSync(
  'example_ibkr_statements.csv',
  'utf-8'
)

describe('parseStatement', () => {
  it('parses account metadata', () => {
    const result = parseStatement(csv)
    expect(result.accountName).toBe('shuyu zhao')
    expect(result.accountId).toBe('U13263688')
    expect(result.baseCurrency).toBe('USD')
  })

  it('parses period dates', () => {
    const result = parseStatement(csv)
    expect(result.periodStart.getFullYear()).toBe(2026)
    expect(result.periodStart.getMonth()).toBe(0) // January = 0
    expect(result.periodEnd.getMonth()).toBe(4)   // May = 4
  })

  it('parses TWR', () => {
    const result = parseStatement(csv)
    expect(result.twr).toBeCloseTo(0.09988, 4)
  })

  it('parses current NAV', () => {
    const result = parseStatement(csv)
    expect(result.currentNav).toBeCloseTo(83175.33, 1)
  })

  it('parses open positions', () => {
    const result = parseStatement(csv)
    const nvda = result.openPositions.find(p => p.symbol === 'NVDA')
    expect(nvda).toBeDefined()
    expect(nvda!.quantity).toBe(110)
    expect(nvda!.closePrice).toBeCloseTo(215.33, 2)
  })

  it('parses trades', () => {
    const result = parseStatement(csv)
    const aaplTrade = result.trades.find(
      t => t.symbol === 'AAPL' && t.quantity === 6
    )
    expect(aaplTrade).toBeDefined()
    expect(aaplTrade!.price).toBeCloseTo(269.745, 2)
  })

  it('parses realized/unrealized summary', () => {
    const result = parseStatement(csv)
    const allw = result.realizedUnrealized.find(r => r.symbol === 'ALLW')
    expect(allw).toBeDefined()
    expect(allw!.realizedTotal).toBeCloseTo(114.31, 1)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/lib/parser.test.ts
```

Expected: FAIL — `parseStatement` not found.

- [ ] **Step 3: Implement parser**

```ts
// src/lib/parser.ts
import Papa from 'papaparse'
import type { StatementData, Trade, OpenPosition, RealizedUnrealizedSummary } from '../types/statement'

type Row = string[]

export function parseStatement(csvText: string): StatementData {
  const { data } = Papa.parse<Row>(csvText, { skipEmptyLines: true })

  const result: Partial<StatementData> & {
    trades: Trade[]
    openPositions: OpenPosition[]
    realizedUnrealized: RealizedUnrealizedSummary[]
  } = {
    trades: [],
    openPositions: [],
    realizedUnrealized: [],
    twr: 0,
    currentNav: 0,
    priorNav: 0,
  }

  let section = ''
  let navHeaderCols: string[] = []
  let tradeHeaderCols: string[] = []
  let openPosHeaderCols: string[] = []
  let ruHeaderCols: string[] = []

  for (const row of data) {
    const [sectionName, rowType, ...rest] = row
    if (!sectionName) continue

    if (rowType === 'Header') {
      section = sectionName
      if (section === 'Net Asset Value') navHeaderCols = rest
      if (section === 'Trades') tradeHeaderCols = rest
      if (section === 'Open Positions') openPosHeaderCols = rest
      if (section === 'Realized & Unrealized Performance Summary') ruHeaderCols = rest
      continue
    }

    if (rowType !== 'Data') continue

    switch (section) {
      case 'Statement': {
        const [fieldName, fieldValue] = rest
        if (fieldName === 'Period') {
          const parts = fieldValue.split(' - ')
          result.periodStart = parsePeriodDate(parts[0].trim())
          result.periodEnd = parsePeriodDate(parts[1].trim())
        }
        break
      }

      case 'Account Information': {
        const [fieldName, fieldValue] = rest
        if (fieldName === 'Name') result.accountName = fieldValue
        if (fieldName === 'Account') result.accountId = fieldValue
        if (fieldName === 'Base Currency') result.baseCurrency = fieldValue
        break
      }

      case 'Net Asset Value': {
        // Two sub-formats: the asset class rows and the standalone TWR row
        // TWR row: rest[0] is a percentage string like "9.988250429%"
        if (rest.length === 1 && rest[0].endsWith('%')) {
          result.twr = parseFloat(rest[0]) / 100
          break
        }
        const colIdx = (name: string) => navHeaderCols.indexOf(name)
        const assetClass = rest[colIdx('Asset Class') - 2] ?? rest[0]
        if (assetClass === 'Total') {
          result.currentNav = parseFloat(rest[colIdx('Current Total') - 2] ?? rest[3]) || 0
          result.priorNav = parseFloat(rest[colIdx('Prior Total') - 2] ?? rest[1]) || 0
        }
        break
      }

      case 'Realized & Unrealized Performance Summary': {
        const col = (name: string) => {
          const i = ruHeaderCols.indexOf(name)
          return i >= 0 ? rest[i] : undefined
        }
        const symbol = col('Symbol') ?? rest[1]
        if (!symbol || symbol === 'Total') break
        result.realizedUnrealized.push({
          symbol,
          realizedTotal: parseFloat(col('Realized Total') ?? rest[5]) || 0,
          unrealizedTotal: parseFloat(col('Unrealized Total') ?? rest[10]) || 0,
        })
        break
      }

      case 'Open Positions': {
        const discriminator = rest[0]
        if (discriminator !== 'Summary') break
        const col = (name: string) => {
          const i = openPosHeaderCols.indexOf(name)
          return i >= 0 ? rest[i] : undefined
        }
        const symbol = col('Symbol') ?? rest[3]
        if (!symbol) break
        result.openPositions.push({
          symbol,
          quantity: parseFloat(col('Quantity') ?? rest[5]) || 0,
          costPrice: parseFloat(col('Cost Price') ?? rest[7]) || 0,
          costBasis: parseFloat(col('Cost Basis') ?? rest[8]) || 0,
          closePrice: parseFloat(col('Close Price') ?? rest[9]) || 0,
          marketValue: parseFloat(col('Value') ?? rest[10]) || 0,
          unrealizedPL: parseFloat(col('Unrealized P/L') ?? rest[11]) || 0,
        })
        break
      }

      case 'Trades': {
        const discriminator = rest[0]
        if (discriminator !== 'Order') break
        const col = (name: string) => {
          const i = tradeHeaderCols.indexOf(name)
          return i >= 0 ? rest[i] : undefined
        }
        const symbol = col('Symbol') ?? rest[3]
        if (!symbol) break
        result.trades.push({
          symbol,
          dateTime: col('Date/Time') ?? rest[4],
          quantity: parseFloat(col('Quantity') ?? rest[5]) || 0,
          price: parseFloat(col('T. Price') ?? rest[6]) || 0,
          proceeds: parseFloat(col('Proceeds') ?? rest[8]) || 0,
          commission: parseFloat(col('Comm/Fee') ?? rest[9]) || 0,
          basis: parseFloat(col('Basis') ?? rest[10]) || 0,
          realizedPL: parseFloat(col('Realized P/L') ?? rest[11]) || 0,
          mtmPL: parseFloat(col('MTM P/L') ?? rest[12]) || 0,
          code: col('Code') ?? rest[13] ?? '',
        })
        break
      }
    }
  }

  if (!result.periodStart || !result.periodEnd) {
    throw new Error('Could not parse period from CSV — is this an IBKR Activity Statement?')
  }

  return result as StatementData
}

function parsePeriodDate(s: string): Date {
  // "January 1, 2026" or "May 22, 2026"
  return new Date(s)
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx vitest run tests/lib/parser.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/parser.ts tests/lib/parser.test.ts tests/setup.ts
git commit -m "feat: implement CSV parser with full section extraction"
```

---

## Task 4: Multi-File Merger

**Files:**
- Create: `src/lib/merger.ts`
- Create: `tests/lib/merger.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/lib/merger.test.ts
import { describe, it, expect } from 'vitest'
import { mergeStatements } from '../../src/lib/merger'
import type { StatementData, Trade } from '../../src/types/statement'

const makeTrade = (override: Partial<Trade> = {}): Trade => ({
  symbol: 'AAPL',
  dateTime: '2026-01-05, 09:48:12',
  quantity: 6,
  price: 269.745,
  proceeds: -1618.47,
  commission: -0.35,
  basis: 1618.82,
  realizedPL: 0,
  mtmPL: -14.91,
  code: 'O',
  ...override,
})

const makeStatement = (override: Partial<StatementData> = {}): StatementData => ({
  periodStart: new Date('2026-01-01'),
  periodEnd: new Date('2026-06-01'),
  accountName: 'Test User',
  accountId: 'U123',
  baseCurrency: 'USD',
  currentNav: 80000,
  priorNav: 50000,
  twr: 0.09,
  trades: [makeTrade()],
  openPositions: [],
  realizedUnrealized: [],
  ...override,
})

describe('mergeStatements', () => {
  it('single file is a pass-through', () => {
    const s = makeStatement()
    const result = mergeStatements([s])
    expect(result.fileCount).toBe(1)
    expect(result.hasOverlap).toBe(false)
    expect(result.trades).toHaveLength(1)
  })

  it('deduplicates trades with identical key across files', () => {
    const s1 = makeStatement({ periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-06-30') })
    const s2 = makeStatement({ periodStart: new Date('2026-04-01'), periodEnd: new Date('2026-12-31') })
    const result = mergeStatements([s1, s2])
    expect(result.trades).toHaveLength(1) // duplicate removed
  })

  it('detects overlap between two files', () => {
    const s1 = makeStatement({ periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-06-30') })
    const s2 = makeStatement({ periodStart: new Date('2026-04-01'), periodEnd: new Date('2026-12-31') })
    const result = mergeStatements([s1, s2])
    expect(result.hasOverlap).toBe(true)
  })

  it('no overlap when periods are adjacent', () => {
    const s1 = makeStatement({ periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-06-30') })
    const s2 = makeStatement({ periodStart: new Date('2026-07-01'), periodEnd: new Date('2026-12-31') })
    const result = mergeStatements([s1, s2])
    expect(result.hasOverlap).toBe(false)
  })

  it('merges period to min start and max end', () => {
    const s1 = makeStatement({ periodStart: new Date('2025-01-01'), periodEnd: new Date('2025-12-31') })
    const s2 = makeStatement({ periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-06-30') })
    const result = mergeStatements([s1, s2])
    expect(result.periodStart.getFullYear()).toBe(2025)
    expect(result.periodEnd.getMonth()).toBe(5) // June
  })

  it('uses latest file NAV and TWR', () => {
    const s1 = makeStatement({ periodEnd: new Date('2025-12-31'), currentNav: 50000, twr: 0.05 })
    const s2 = makeStatement({ periodEnd: new Date('2026-06-30'), currentNav: 80000, twr: 0.09 })
    const result = mergeStatements([s1, s2])
    expect(result.currentNav).toBe(80000)
    expect(result.twr).toBe(0.09)
  })

  it('keeps distinct trades from both files', () => {
    const t1 = makeTrade({ symbol: 'AAPL', dateTime: '2026-01-05, 09:48:12' })
    const t2 = makeTrade({ symbol: 'NVDA', dateTime: '2026-03-01, 10:00:00' })
    const s1 = makeStatement({ trades: [t1] })
    const s2 = makeStatement({ trades: [t2] })
    const result = mergeStatements([s1, s2])
    expect(result.trades).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/lib/merger.test.ts
```

Expected: FAIL — `mergeStatements` not found.

- [ ] **Step 3: Implement merger**

```ts
// src/lib/merger.ts
import type { StatementData, MergedStatementData, Trade } from '../types/statement'

export function mergeStatements(statements: StatementData[]): MergedStatementData {
  if (statements.length === 0) throw new Error('No statements provided')

  const sorted = [...statements].sort(
    (a, b) => a.periodStart.getTime() - b.periodStart.getTime()
  )

  const hasOverlap = detectOverlap(sorted)
  const latest = sorted.reduce((a, b) => a.periodEnd > b.periodEnd ? a : b)

  const allTrades = deduplicateTrades(sorted.flatMap(s => s.trades))

  return {
    periodStart: sorted[0].periodStart,
    periodEnd: latest.periodEnd,
    accountName: latest.accountName,
    accountId: latest.accountId,
    baseCurrency: latest.baseCurrency,
    currentNav: latest.currentNav,
    twr: latest.twr,
    trades: allTrades,
    openPositions: latest.openPositions,
    realizedUnrealized: latest.realizedUnrealized,
    hasOverlap,
    fileCount: statements.length,
  }
}

function tradeKey(t: Trade): string {
  return `${t.symbol}|${t.dateTime}|${t.quantity}|${t.price}`
}

function deduplicateTrades(trades: Trade[]): Trade[] {
  const seen = new Set<string>()
  const result: Trade[] = []
  for (const trade of trades) {
    const key = tradeKey(trade)
    if (!seen.has(key)) {
      seen.add(key)
      result.push(trade)
    }
  }
  return result.sort((a, b) => b.dateTime.localeCompare(a.dateTime))
}

function detectOverlap(sorted: StatementData[]): boolean {
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].periodEnd > sorted[i + 1].periodStart) return true
  }
  return false
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx vitest run tests/lib/merger.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/merger.ts tests/lib/merger.test.ts
git commit -m "feat: implement multi-file merger with deduplication"
```

---

## Task 5: Calculations

**Files:**
- Create: `src/lib/calculations.ts`
- Create: `tests/lib/calculations.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/lib/calculations.test.ts
import { describe, it, expect } from 'vitest'
import { buildTickerSummaries, buildPortfolioMetrics } from '../../src/lib/calculations'
import type { MergedStatementData } from '../../src/types/statement'

const makeMerged = (): MergedStatementData => ({
  periodStart: new Date('2026-01-01'),
  periodEnd: new Date('2026-05-22'),
  accountName: 'Test',
  accountId: 'U1',
  baseCurrency: 'USD',
  currentNav: 83175.33,
  twr: 0.09988,
  hasOverlap: false,
  fileCount: 1,
  trades: [
    {
      symbol: 'ALLW', dateTime: '2026-01-06, 09:34:58', quantity: -40,
      price: 27.995, proceeds: 1119.8, commission: -0.366,
      basis: -1005.12, realizedPL: 114.31, mtmPL: -3.8, code: 'C',
    },
  ],
  openPositions: [
    {
      symbol: 'NVDA', quantity: 110, costPrice: 186.5,
      costBasis: 20515, closePrice: 215.33, marketValue: 23686.3,
      unrealizedPL: 3172.29,
    },
  ],
  realizedUnrealized: [
    { symbol: 'ALLW', realizedTotal: 114.31, unrealizedTotal: 0 },
    { symbol: 'NVDA', realizedTotal: 0, unrealizedTotal: 3172.29 },
  ],
})

describe('buildTickerSummaries', () => {
  it('computes NVDA unrealized-only position', () => {
    const summaries = buildTickerSummaries(makeMerged())
    const nvda = summaries.find(s => s.symbol === 'NVDA')
    expect(nvda).toBeDefined()
    expect(nvda!.unrealizedPL).toBeCloseTo(3172.29, 1)
    expect(nvda!.totalPL).toBeCloseTo(3172.29, 1)
    expect(nvda!.returnPct).toBeCloseTo((3172.29 / 20515) * 100, 1)
  })

  it('computes ALLW fully-closed position', () => {
    const summaries = buildTickerSummaries(makeMerged())
    const allw = summaries.find(s => s.symbol === 'ALLW')
    expect(allw).toBeDefined()
    expect(allw!.realizedPL).toBeCloseTo(114.31, 1)
    expect(allw!.quantity).toBe(0)
  })
})

describe('buildPortfolioMetrics', () => {
  it('sums total P/L', () => {
    const merged = makeMerged()
    const metrics = buildPortfolioMetrics(merged)
    expect(metrics.totalPL).toBeCloseTo(114.31 + 3172.29, 1)
  })

  it('passes through NAV and TWR', () => {
    const metrics = buildPortfolioMetrics(makeMerged())
    expect(metrics.currentNav).toBeCloseTo(83175.33, 1)
    expect(metrics.twr).toBeCloseTo(0.09988, 4)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/lib/calculations.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement calculations**

```ts
// src/lib/calculations.ts
import type { MergedStatementData, TickerSummary } from '../types/statement'

export interface PortfolioMetrics {
  currentNav: number
  totalRealizedPL: number
  totalUnrealizedPL: number
  totalPL: number
  totalReturnPct: number
  twr: number
}

export function buildTickerSummaries(data: MergedStatementData): TickerSummary[] {
  const symbols = new Set([
    ...data.realizedUnrealized.map(r => r.symbol),
    ...data.openPositions.map(p => p.symbol),
  ])

  return Array.from(symbols).map(symbol => {
    const ru = data.realizedUnrealized.find(r => r.symbol === symbol)
    const pos = data.openPositions.find(p => p.symbol === symbol)

    const realizedPL = ru?.realizedTotal ?? 0
    const unrealizedPL = ru?.unrealizedTotal ?? pos?.unrealizedPL ?? 0
    const totalPL = realizedPL + unrealizedPL

    const quantity = pos?.quantity ?? 0
    const costPrice = pos?.costPrice ?? 0
    const costBasis = pos?.costBasis ?? Math.abs(estimateCostBasisFromTrades(data, symbol))
    const currentPrice = pos?.closePrice ?? 0
    const marketValue = pos?.marketValue ?? 0

    const returnPct = costBasis !== 0 ? (totalPL / costBasis) * 100 : 0

    return { symbol, quantity, costPrice, currentPrice, marketValue, realizedPL, unrealizedPL, totalPL, returnPct, costBasis }
  })
}

function estimateCostBasisFromTrades(data: MergedStatementData, symbol: string): number {
  // For closed positions, sum absolute basis of buy trades
  return data.trades
    .filter(t => t.symbol === symbol && t.quantity > 0)
    .reduce((sum, t) => sum + Math.abs(t.basis), 0)
}

export function buildPortfolioMetrics(data: MergedStatementData): PortfolioMetrics {
  const totalRealizedPL = data.realizedUnrealized.reduce((s, r) => s + r.realizedTotal, 0)
  const totalUnrealizedPL = data.realizedUnrealized.reduce((s, r) => s + r.unrealizedTotal, 0)
  const totalPL = totalRealizedPL + totalUnrealizedPL
  const costBase = data.currentNav - totalPL
  const totalReturnPct = costBase !== 0 ? (totalPL / costBase) * 100 : 0

  return {
    currentNav: data.currentNav,
    totalRealizedPL,
    totalUnrealizedPL,
    totalPL,
    totalReturnPct,
    twr: data.twr,
  }
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx vitest run tests/lib/calculations.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calculations.ts tests/lib/calculations.test.ts
git commit -m "feat: implement portfolio calculations and ticker summaries"
```

---

## Task 6: i18n Helper + Statement Context

**Files:**
- Create: `src/i18n.ts`
- Create: `src/context/StatementContext.tsx`
- Create: `src/hooks/useStatement.ts`

- [ ] **Step 1: Create i18n.ts**

```ts
// src/i18n.ts
export type Lang = 'en' | 'zh'

const dict = {
  // Navigation
  upload: { en: 'Upload', zh: '上传' },
  analyze: { en: 'Analyze', zh: '开始分析' },
  uploadMore: { en: 'Upload More', zh: '继续上传' },

  // Tabs
  overview: { en: 'Overview', zh: '总览' },
  positions: { en: 'Positions', zh: '持仓' },
  trades: { en: 'Trades', zh: '交易记录' },

  // Overview cards
  totalNav: { en: 'Total NAV', zh: '账户总市值' },
  totalPL: { en: 'Total P/L', zh: '总盈亏' },
  totalReturn: { en: 'Total Return', zh: '总收益率' },
  twr: { en: 'Time-Weighted Return', zh: '时间加权收益率' },

  // Positions table
  ticker: { en: 'Ticker', zh: '股票' },
  qty: { en: 'Qty', zh: '数量' },
  costPrice: { en: 'Cost Price', zh: '成本价' },
  currentPrice: { en: 'Current Price', zh: '当前价' },
  marketValue: { en: 'Market Value', zh: '市值' },
  realizedPL: { en: 'Realized P/L', zh: '已实现盈亏' },
  unrealizedPL: { en: 'Unrealized P/L', zh: '未实现盈亏' },
  returnPct: { en: 'Return %', zh: '收益率' },
  action: { en: 'Action', zh: '操作' },
  share: { en: 'Share', zh: '分享' },

  // Trades table
  date: { en: 'Date', zh: '日期' },
  side: { en: 'Side', zh: '方向' },
  buy: { en: 'Buy', zh: '买入' },
  sell: { en: 'Sell', zh: '卖出' },
  price: { en: 'Price', zh: '成交价' },
  proceeds: { en: 'Proceeds', zh: '金额' },
  commission: { en: 'Commission', zh: '手续费' },

  // Share card
  totalReturnCard: { en: 'Total Return', zh: '累计收益率' },
  totalPLCard: { en: 'Total P/L', zh: '累计盈亏' },
  realized: { en: 'Realized', zh: '已实现' },
  unrealized: { en: 'Unrealized', zh: '未实现' },
  mktValue: { en: 'Mkt Value', zh: '总市值' },
  cost: { en: 'Cost', zh: '成本价' },
  generatedBy: { en: 'Generated by IBKR Modern Statements', zh: '由 IBKR Modern Statements 生成' },

  // Upload page
  dragDrop: { en: 'Drag & drop IBKR CSV files here, or click to browse', zh: '拖拽 IBKR CSV 文件到此处，或点击选择' },
  overlapDetected: { en: 'Overlap detected — deduplicating', zh: '检测到日期重叠 — 自动去重' },
  howToExport: { en: 'How to export from IBKR', zh: '如何从 IBKR 导出报表' },
  period: { en: 'Period', zh: '期间' },
  remove: { en: 'Remove', zh: '删除' },
  account: { en: 'Account', zh: '账户' },
  currency: { en: 'Currency', zh: '货币' },
} as const

type DictKey = keyof typeof dict

export function createT(lang: Lang) {
  return (key: DictKey): string => dict[key][lang]
}
```

- [ ] **Step 2: Create StatementContext.tsx**

```tsx
// src/context/StatementContext.tsx
import { createContext, useState, useCallback, type ReactNode } from 'react'
import type { MergedStatementData, StatementData } from '../types/statement'
import { parseStatement } from '../lib/parser'
import { mergeStatements } from '../lib/merger'
import type { Lang } from '../i18n'

export interface FileEntry {
  name: string
  statement: StatementData
  error?: string
}

interface StatementContextValue {
  files: FileEntry[]
  merged: MergedStatementData | null
  lang: Lang
  darkMode: boolean
  addFiles: (csvTexts: { name: string; text: string }[]) => void
  removeFile: (name: string) => void
  setLang: (lang: Lang) => void
  setDarkMode: (dark: boolean) => void
}

export const StatementContext = createContext<StatementContextValue | null>(null)

export function StatementProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [lang, setLang] = useState<Lang>('en')
  const [darkMode, setDarkMode] = useState(true)

  const merged: MergedStatementData | null = files.length > 0
    ? mergeStatements(files.map(f => f.statement))
    : null

  const addFiles = useCallback((inputs: { name: string; text: string }[]) => {
    setFiles(prev => {
      const next = [...prev]
      for (const { name, text } of inputs) {
        if (next.find(f => f.name === name)) continue
        try {
          const statement = parseStatement(text)
          next.push({ name, statement })
        } catch (e) {
          next.push({ name, statement: null as any, error: (e as Error).message })
        }
      }
      return next
    })
  }, [])

  const removeFile = useCallback((name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name))
  }, [])

  return (
    <StatementContext.Provider value={{ files, merged, lang, darkMode, addFiles, removeFile, setLang, setDarkMode }}>
      {children}
    </StatementContext.Provider>
  )
}
```

- [ ] **Step 3: Create useStatement.ts**

```ts
// src/hooks/useStatement.ts
import { useContext } from 'react'
import { StatementContext } from '../context/StatementContext'

export function useStatement() {
  const ctx = useContext(StatementContext)
  if (!ctx) throw new Error('useStatement must be used inside StatementProvider')
  return ctx
}
```

- [ ] **Step 4: Wire Provider into main.tsx**

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { StatementProvider } from './context/StatementContext'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <StatementProvider>
        <App />
      </StatementProvider>
    </HashRouter>
  </StrictMode>
)
```

- [ ] **Step 5: Verify app still runs**

```bash
npm run dev
```

Expected: No compilation errors, page shows "Upload".

- [ ] **Step 6: Commit**

```bash
git add src/i18n.ts src/context/StatementContext.tsx src/hooks/useStatement.ts src/main.tsx
git commit -m "feat: add i18n helper, statement context, and useStatement hook"
```

---

## Task 7: Upload Page

**Files:**
- Create: `src/components/upload/UploadZone.tsx`
- Modify: `src/pages/UploadPage.tsx`

- [ ] **Step 1: Implement UploadZone.tsx**

```tsx
// src/components/upload/UploadZone.tsx
import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { useStatement } from '../../hooks/useStatement'
import { createT } from '../../i18n'

export default function UploadZone() {
  const { lang } = useStatement()
  const t = createT(lang)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const { addFiles } = useStatement()

  async function handleFiles(fileList: FileList) {
    const inputs = await Promise.all(
      Array.from(fileList).map(async f => ({ name: f.name, text: await f.text() }))
    )
    addFiles(inputs)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) handleFiles(e.target.files)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`
        cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors
        ${dragging
          ? 'border-green-400 bg-green-400/10'
          : 'border-gray-600 hover:border-gray-400 bg-gray-800/50'}
      `}
    >
      <div className="text-4xl mb-4">📁</div>
      <p className="text-gray-300 text-sm">{t('dragDrop')}</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        multiple
        className="hidden"
        onChange={onChange}
      />
    </div>
  )
}
```

- [ ] **Step 2: Implement full UploadPage.tsx**

```tsx
// src/pages/UploadPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStatement } from '../hooks/useStatement'
import { createT } from '../i18n'
import UploadZone from '../components/upload/UploadZone'

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function UploadPage() {
  const { files, merged, removeFile, lang, setLang } = useStatement()
  const t = createT(lang)
  const navigate = useNavigate()
  const [showHint, setShowHint] = useState(false)

  const validFiles = files.filter(f => !f.error)

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">IBKR Modern Statements</h1>
          <button
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            className="text-sm text-gray-400 hover:text-white px-3 py-1 rounded border border-gray-700 hover:border-gray-500 transition-colors"
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>
        </div>

        {/* Drop zone */}
        <UploadZone />

        {/* File list */}
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map(f => (
              <li key={f.name} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{f.name}</p>
                  {f.error
                    ? <p className="text-xs text-red-400 mt-0.5">{f.error}</p>
                    : <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(f.statement.periodStart)} ~ {formatDate(f.statement.periodEnd)}
                      </p>
                  }
                </div>
                <button
                  onClick={() => removeFile(f.name)}
                  className="text-gray-500 hover:text-red-400 text-sm ml-4 transition-colors"
                >
                  {t('remove')}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Overlap badge */}
        {merged?.hasOverlap && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2 text-yellow-400 text-sm">
            ⚠ {t('overlapDetected')}
          </div>
        )}

        {/* Analyze button */}
        {validFiles.length > 0 && (
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-xl transition-colors"
          >
            {t('analyze')} →
          </button>
        )}

        {/* How to export hint */}
        <div>
          <button
            onClick={() => setShowHint(v => !v)}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showHint ? '▾' : '▸'} {t('howToExport')}
          </button>
          {showHint && (
            <div className="mt-3 bg-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
              <p>1. Log in to IBKR → <strong>Reports</strong> → <strong>Statements</strong></p>
              <p>2. Select <strong>Activity</strong> statement type</p>
              <p>3. Choose date range (max 365 days) → <strong>CSV</strong> format</p>
              <p>4. Download and upload here. For longer history, export multiple CSVs.</p>
              <img src="assets/how-to-get-ibkr-statements.jpeg" alt="IBKR export guide" className="rounded mt-2 w-full" />
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
```

- [ ] **Step 3: Start dev server and verify upload works**

```bash
npm run dev
```

Visit `http://localhost:5173`. Drag `example_ibkr_statements.csv` onto the zone. Expected: file appears in list with period "2026-01-01 ~ 2026-05-22". "Analyze →" button appears.

- [ ] **Step 4: Commit**

```bash
git add src/components/upload/UploadZone.tsx src/pages/UploadPage.tsx
git commit -m "feat: implement upload page with drag-drop, file list, and overlap badge"
```

---

## Task 8: Dashboard Shell + Top Bar

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 1: Implement DashboardPage with Base UI Tabs**

```tsx
// src/pages/DashboardPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs } from '@base-ui-components/react/tabs'
import { useStatement } from '../hooks/useStatement'
import { createT } from '../i18n'
import SummaryCards from '../components/overview/SummaryCards'
import PortfolioPieChart from '../components/overview/PortfolioPieChart'
import PeriodInfo from '../components/overview/PeriodInfo'
import PositionsTable from '../components/positions/PositionsTable'
import TradesTable from '../components/trades/TradesTable'

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const { merged, lang, setLang, darkMode, setDarkMode } = useStatement()
  const t = createT(lang)
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')

  if (!merged) {
    navigate('/')
    return null
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>

      {/* Top bar */}
      <header className={`sticky top-0 z-10 border-b ${darkMode ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'} px-6 py-3`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <span className="font-semibold">{merged.accountName}</span>
            <span className="text-xs text-gray-500 ml-3">
              {formatDate(merged.periodStart)} → {formatDate(merged.periodEnd)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-400 hover:text-white px-3 py-1 rounded border border-gray-700 transition-colors"
            >
              + {t('uploadMore')}
            </button>
            <button
              onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
              className="text-sm text-gray-400 hover:text-white px-3 py-1 rounded border border-gray-700 transition-colors"
            >
              {lang === 'en' ? '中文' : 'EN'}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-sm text-gray-400 hover:text-white px-3 py-1 rounded border border-gray-700 transition-colors"
            >
              {darkMode ? '☀' : '☾'}
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        <Tabs.Root value={tab} onValueChange={setTab}>
          <Tabs.List className="flex gap-1 mb-6 border-b border-gray-800 pb-0">
            {[
              { value: 'overview', label: t('overview') },
              { value: 'positions', label: t('positions') },
              { value: 'trades', label: t('trades') },
            ].map(({ value, label }) => (
              <Tabs.Tab
                key={value}
                value={value}
                className={`px-4 py-2 text-sm font-medium rounded-t transition-colors cursor-pointer
                  ${tab === value
                    ? 'text-white border-b-2 border-green-400'
                    : 'text-gray-500 hover:text-gray-300'}`}
              >
                {label}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          <Tabs.Panel value="overview" className="space-y-6">
            <SummaryCards />
            <PortfolioPieChart />
            <PeriodInfo />
          </Tabs.Panel>

          <Tabs.Panel value="positions">
            <PositionsTable />
          </Tabs.Panel>

          <Tabs.Panel value="trades">
            <TradesTable />
          </Tabs.Panel>
        </Tabs.Root>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create stub components so app compiles**

`src/components/overview/SummaryCards.tsx`:
```tsx
export default function SummaryCards() { return <div /> }
```

`src/components/overview/PortfolioPieChart.tsx`:
```tsx
export default function PortfolioPieChart() { return <div /> }
```

`src/components/overview/PeriodInfo.tsx`:
```tsx
export default function PeriodInfo() { return <div /> }
```

`src/components/positions/PositionsTable.tsx`:
```tsx
export default function PositionsTable() { return <div /> }
```

`src/components/trades/TradesTable.tsx`:
```tsx
export default function TradesTable() { return <div /> }
```

- [ ] **Step 3: Verify dashboard renders**

Upload the example CSV, click "Analyze →". Expected: dashboard with three tabs visible, top bar shows "shuyu zhao" and period.

- [ ] **Step 4: Commit**

```bash
git add src/pages/DashboardPage.tsx src/components/
git commit -m "feat: implement dashboard shell with Base UI tabs and top bar"
```

---

## Task 9: Overview Tab Components

**Files:**
- Modify: `src/components/overview/SummaryCards.tsx`
- Modify: `src/components/overview/PortfolioPieChart.tsx`
- Modify: `src/components/overview/PeriodInfo.tsx`
- Create: `src/components/ui/PnlCell.tsx`

- [ ] **Step 1: Create PnlCell shared component**

```tsx
// src/components/ui/PnlCell.tsx
interface Props {
  value: number
  format?: 'currency' | 'percent'
  className?: string
}

function fmt(value: number, format: 'currency' | 'percent') {
  if (format === 'percent') {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }
  return `${value >= 0 ? '+' : ''}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function PnlCell({ value, format = 'currency', className = '' }: Props) {
  const color = value >= 0 ? 'text-green-400' : 'text-red-400'
  return <span className={`font-mono ${color} ${className}`}>{fmt(value, format)}</span>
}
```

- [ ] **Step 2: Implement SummaryCards.tsx**

```tsx
// src/components/overview/SummaryCards.tsx
import { useStatement } from '../../hooks/useStatement'
import { createT } from '../../i18n'
import { buildPortfolioMetrics } from '../../lib/calculations'
import PnlCell from '../ui/PnlCell'

function MetricCard({ label, children, dark }: { label: string; children: React.ReactNode; dark: boolean }) {
  return (
    <div className={`rounded-xl p-5 ${dark ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="text-2xl font-bold">{children}</div>
    </div>
  )
}

export default function SummaryCards() {
  const { merged, lang, darkMode } = useStatement()
  const t = createT(lang)
  if (!merged) return null

  const m = buildPortfolioMetrics(merged)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard label={t('totalNav')} dark={darkMode}>
        <span className="font-mono">${m.currentNav.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </MetricCard>
      <MetricCard label={t('totalPL')} dark={darkMode}>
        <PnlCell value={m.totalPL} />
      </MetricCard>
      <MetricCard label={t('totalReturn')} dark={darkMode}>
        <PnlCell value={m.totalReturnPct} format="percent" />
      </MetricCard>
      <MetricCard label={t('twr')} dark={darkMode}>
        <PnlCell value={m.twr * 100} format="percent" />
      </MetricCard>
    </div>
  )
}
```

- [ ] **Step 3: Implement PortfolioPieChart.tsx**

```tsx
// src/components/overview/PortfolioPieChart.tsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useStatement } from '../../hooks/useStatement'

const COLORS = ['#00ff88', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

export default function PortfolioPieChart() {
  const { merged, darkMode } = useStatement()
  if (!merged) return null

  const data = merged.openPositions
    .filter(p => p.marketValue > 0)
    .map(p => ({ name: p.symbol, value: parseFloat(p.marketValue.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) return null

  return (
    <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Portfolio Allocation</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value">
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => [`$${v.toLocaleString()}`, '']}
            contentStyle={{ background: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: 8 }}
          />
          <Legend formatter={name => <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{name}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 4: Implement PeriodInfo.tsx**

```tsx
// src/components/overview/PeriodInfo.tsx
import { useStatement } from '../../hooks/useStatement'
import { createT } from '../../i18n'

function mask(id: string) {
  return id.slice(0, 2) + '****' + id.slice(-3)
}

export default function PeriodInfo() {
  const { merged, lang, darkMode } = useStatement()
  const t = createT(lang)
  if (!merged) return null

  return (
    <div className={`rounded-xl p-5 flex flex-wrap gap-6 text-sm ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
      <div>
        <span className="text-gray-500 mr-2">{t('period')}:</span>
        <span>{merged.periodStart.toISOString().slice(0, 10)} → {merged.periodEnd.toISOString().slice(0, 10)}</span>
      </div>
      <div>
        <span className="text-gray-500 mr-2">{t('account')}:</span>
        <span>{mask(merged.accountId)}</span>
      </div>
      <div>
        <span className="text-gray-500 mr-2">{t('currency')}:</span>
        <span>{merged.baseCurrency}</span>
      </div>
      {merged.fileCount > 1 && (
        <div className="text-yellow-400">
          {merged.fileCount} files merged
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verify overview tab looks correct**

```bash
npm run dev
```

Upload CSV → dashboard → Overview tab. Expected: 4 metric cards with values, donut chart of holdings, period info row at bottom.

- [ ] **Step 6: Commit**

```bash
git add src/components/overview/ src/components/ui/PnlCell.tsx
git commit -m "feat: implement overview tab — summary cards, pie chart, period info"
```

---

## Task 10: Positions Table

**Files:**
- Modify: `src/components/positions/PositionsTable.tsx`

- [ ] **Step 1: Implement PositionsTable.tsx**

```tsx
// src/components/positions/PositionsTable.tsx
import { useState } from 'react'
import { useStatement } from '../../hooks/useStatement'
import { createT } from '../../i18n'
import { buildTickerSummaries } from '../../lib/calculations'
import type { TickerSummary } from '../../types/statement'
import PnlCell from '../ui/PnlCell'
import ShareModal from './ShareModal'

type SortKey = keyof Pick<TickerSummary, 'symbol' | 'marketValue' | 'realizedPL' | 'unrealizedPL' | 'totalPL' | 'returnPct'>

export default function PositionsTable() {
  const { merged, lang, darkMode } = useStatement()
  const t = createT(lang)
  const [sortKey, setSortKey] = useState<SortKey>('totalPL')
  const [sortAsc, setSortAsc] = useState(false)
  const [shareSymbol, setShareSymbol] = useState<string | null>(null)

  if (!merged) return null

  const summaries = buildTickerSummaries(merged)

  const sorted = [...summaries].sort((a, b) => {
    const av = a[sortKey]
    const bv = b[sortKey]
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
    return sortAsc ? cmp : -cmp
  })

  function onSort(key: SortKey) {
    if (sortKey === key) setSortAsc(v => !v)
    else { setSortKey(key); setSortAsc(false) }
  }

  const th = (label: string, key: SortKey) => (
    <th
      key={key}
      onClick={() => onSort(key)}
      className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-300 transition-colors"
    >
      {label} {sortKey === key ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  )

  const shareTarget = shareSymbol ? summaries.find(s => s.symbol === shareSymbol) ?? null : null

  return (
    <>
      <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
            <tr>
              {th(t('ticker'), 'symbol')}
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('qty')}</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('costPrice')}</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('currentPrice')}</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('marketValue')}</th>
              {th(t('realizedPL'), 'realizedPL')}
              {th(t('unrealizedPL'), 'unrealizedPL')}
              {th('Total P/L', 'totalPL')}
              {th(t('returnPct'), 'returnPct')}
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('action')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {sorted.map(row => (
              <tr key={row.symbol} className={`${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                <td className="px-3 py-3 font-mono font-semibold">{row.symbol}</td>
                <td className="px-3 py-3 text-right font-mono text-gray-400">{row.quantity || '—'}</td>
                <td className="px-3 py-3 text-right font-mono">{row.costPrice > 0 ? `$${row.costPrice.toFixed(2)}` : '—'}</td>
                <td className="px-3 py-3 text-right font-mono">{row.currentPrice > 0 ? `$${row.currentPrice.toFixed(2)}` : '—'}</td>
                <td className="px-3 py-3 text-right font-mono">{row.marketValue > 0 ? `$${row.marketValue.toLocaleString()}` : '—'}</td>
                <td className="px-3 py-3 text-right"><PnlCell value={row.realizedPL} /></td>
                <td className="px-3 py-3 text-right"><PnlCell value={row.unrealizedPL} /></td>
                <td className="px-3 py-3 text-right"><PnlCell value={row.totalPL} /></td>
                <td className="px-3 py-3 text-right"><PnlCell value={row.returnPct} format="percent" /></td>
                <td className="px-3 py-3 text-right">
                  <button
                    onClick={() => setShareSymbol(row.symbol)}
                    className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                  >
                    {t('share')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {shareTarget && (
        <ShareModal ticker={shareTarget} onClose={() => setShareSymbol(null)} />
      )}
    </>
  )
}
```

- [ ] **Step 2: Create stub ShareModal so app compiles**

```tsx
// src/components/positions/ShareModal.tsx
import type { TickerSummary } from '../../types/statement'
interface Props { ticker: TickerSummary; onClose: () => void }
export default function ShareModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl p-6" onClick={e => e.stopPropagation()}>
        <button onClick={onClose}>✕ Close</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify positions table renders and sorts**

Open dashboard → Positions tab. Expected: sortable table with all tickers, green/red P/L values, "Share" button per row.

- [ ] **Step 4: Commit**

```bash
git add src/components/positions/PositionsTable.tsx src/components/positions/ShareModal.tsx
git commit -m "feat: implement sortable positions table"
```

---

## Task 11: Trades Table

**Files:**
- Modify: `src/components/trades/TradesTable.tsx`
- Create: `src/components/trades/TickerFilter.tsx`

- [ ] **Step 1: Create TickerFilter.tsx**

```tsx
// src/components/trades/TickerFilter.tsx
interface Props {
  symbols: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  dark: boolean
}

export default function TickerFilter({ symbols, selected, onChange, dark }: Props) {
  function toggle(sym: string) {
    onChange(selected.includes(sym) ? selected.filter(s => s !== sym) : [...selected, sym])
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {symbols.map(sym => (
        <button
          key={sym}
          onClick={() => toggle(sym)}
          className={`text-xs px-2 py-1 rounded font-mono transition-colors ${
            selected.includes(sym)
              ? 'bg-green-500 text-black'
              : dark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {sym}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Implement TradesTable.tsx**

```tsx
// src/components/trades/TradesTable.tsx
import { useState } from 'react'
import { useStatement } from '../../hooks/useStatement'
import { createT } from '../../i18n'
import TickerFilter from './TickerFilter'
import PnlCell from '../ui/PnlCell'

function formatDateTime(s: string) {
  return s.replace(', ', ' ')
}

export default function TradesTable() {
  const { merged, lang, darkMode } = useStatement()
  const t = createT(lang)
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([])

  if (!merged) return null

  const allSymbols = [...new Set(merged.trades.map(t => t.symbol))].sort()
  const filtered = selectedSymbols.length === 0
    ? merged.trades
    : merged.trades.filter(tr => selectedSymbols.includes(tr.symbol))

  return (
    <div>
      <TickerFilter
        symbols={allSymbols}
        selected={selectedSymbols}
        onChange={setSelectedSymbols}
        dark={darkMode}
      />
      <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
            <tr>
              {[t('date'), t('ticker'), t('side'), t('qty'), t('price'), t('proceeds'), t('commission'), t('realizedPL')].map(h => (
                <th key={h} className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {filtered.map((tr, i) => (
              <tr key={i} className={`${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                <td className="px-3 py-2 font-mono text-xs text-gray-400">{formatDateTime(tr.dateTime)}</td>
                <td className="px-3 py-2 font-mono font-semibold">{tr.symbol}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${tr.quantity > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {tr.quantity > 0 ? t('buy') : t('sell')}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono">{Math.abs(tr.quantity)}</td>
                <td className="px-3 py-2 font-mono">${tr.price.toFixed(3)}</td>
                <td className="px-3 py-2 font-mono">${Math.abs(tr.proceeds).toFixed(2)}</td>
                <td className="px-3 py-2 font-mono text-gray-400">${Math.abs(tr.commission).toFixed(4)}</td>
                <td className="px-3 py-2"><PnlCell value={tr.realizedPL} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify trades tab**

Dashboard → Trades tab. Expected: all trades newest first, ticker filter chips above table, buy/sell badges.

- [ ] **Step 4: Commit**

```bash
git add src/components/trades/TradesTable.tsx src/components/trades/TickerFilter.tsx
git commit -m "feat: implement trades table with ticker filter"
```

---

## Task 12: Share Cards + Modal

**Files:**
- Create: `src/components/positions/ShareCard.tsx`
- Modify: `src/components/positions/ShareModal.tsx`
- Create: `src/lib/shareCard.ts`

- [ ] **Step 1: Create ShareCard.tsx**

```tsx
// src/components/positions/ShareCard.tsx
import { forwardRef } from 'react'
import type { TickerSummary } from '../../types/statement'
import type { Lang } from '../../i18n'
import { createT } from '../../i18n'

interface Props {
  ticker: TickerSummary
  variant: 'rate' | 'amount'
  dark: boolean
  lang: Lang
  period: string
}

function fmtPct(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

function fmtUsd(v: number) {
  return `${v >= 0 ? '+' : '-'}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const ShareCard = forwardRef<HTMLDivElement, Props>(({ ticker, variant, dark, lang, period }, ref) => {
  const t = createT(lang)
  const positive = ticker.returnPct >= 0

  const bg = dark ? '#0a0a0a' : '#ffffff'
  const primary = positive
    ? (dark ? '#00ff88' : '#16a34a')
    : (dark ? '#ff4444' : '#dc2626')
  const text = dark ? '#ffffff' : '#111827'
  const muted = dark ? '#6b7280' : '#9ca3af'
  const surface = dark ? '#1a1a1a' : '#f3f4f6'

  return (
    <div
      ref={ref}
      style={{
        width: 375,
        height: 500,
        background: bg,
        color: text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 16,
        border: dark ? '1px solid #1f2937' : '1px solid #e5e7eb',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: muted }}>IBKR</span>
        <span style={{ fontSize: 12, color: muted }}>{period}</span>
      </div>

      {/* Ticker */}
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>{ticker.symbol}</div>
        <div style={{ fontSize: 13, color: muted, marginTop: 4 }}>
          {variant === 'rate' ? t('totalReturnCard') : t('totalPLCard')}
        </div>
      </div>

      {/* Big number */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 52, fontWeight: 900, color: primary, lineHeight: 1 }}>
          {variant === 'rate' ? fmtPct(ticker.returnPct) : fmtUsd(ticker.totalPL)}
        </span>
        <span style={{ fontSize: 40 }}>{variant === 'rate' ? '🚀' : '📈'}</span>
      </div>

      {/* Detail rows */}
      <div style={{ background: surface, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {variant === 'rate' ? (
          <>
            <Row label={t('cost')} value={`$${ticker.costPrice.toFixed(2)}`} muted={muted} text={text} />
            <Row label={t('currentPrice')} value={`$${ticker.currentPrice.toFixed(2)}`} muted={muted} text={text} />
          </>
        ) : (
          <>
            <Row label={t('realized')} value={fmtUsd(ticker.realizedPL)} muted={muted} text={primary} />
            <Row label={t('unrealized')} value={fmtUsd(ticker.unrealizedPL)} muted={muted} text={primary} />
            <Row label={t('mktValue')} value={`$${ticker.marketValue.toLocaleString()}`} muted={muted} text={text} />
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ fontSize: 11, color: muted, textAlign: 'center' }}>{t('generatedBy')}</div>
    </div>
  )
})

ShareCard.displayName = 'ShareCard'
export default ShareCard

function Row({ label, value, muted, text }: { label: string; value: string; muted: string; text: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
      <span style={{ color: muted }}>{label}</span>
      <span style={{ fontWeight: 600, color: text, fontFamily: 'monospace' }}>{value}</span>
    </div>
  )
}
```

- [ ] **Step 2: Create shareCard.ts export utility**

```ts
// src/lib/shareCard.ts
import html2canvas from 'html2canvas'

export async function exportCardAsPng(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
  })
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}
```

- [ ] **Step 3: Implement full ShareModal.tsx**

```tsx
// src/components/positions/ShareModal.tsx
import { useRef, useState } from 'react'
import type { TickerSummary } from '../../types/statement'
import { useStatement } from '../../hooks/useStatement'
import { createT } from '../../i18n'
import ShareCard from './ShareCard'
import { exportCardAsPng } from '../../lib/shareCard'

interface Props {
  ticker: TickerSummary
  onClose: () => void
}

export default function ShareModal({ ticker, onClose }: Props) {
  const { merged, lang, darkMode } = useStatement()
  const t = createT(lang)
  const [variant, setVariant] = useState<'rate' | 'amount'>('rate')
  const [cardDark, setCardDark] = useState(darkMode)
  const cardRef = useRef<HTMLDivElement>(null)

  if (!merged) return null

  const period = `${merged.periodStart.toISOString().slice(0, 7)} ~ ${merged.periodEnd.toISOString().slice(0, 7)}`

  async function download() {
    if (!cardRef.current) return
    await exportCardAsPng(cardRef.current, `${ticker.symbol}-${variant}-${cardDark ? 'dark' : 'light'}.png`)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`rounded-2xl p-6 w-full max-w-md ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{ticker.symbol} — {t('share')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">✕</button>
        </div>

        {/* Variant + theme toggles */}
        <div className="flex gap-2 mb-4">
          {(['rate', 'amount'] as const).map(v => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                variant === v ? 'bg-green-500 text-black font-semibold' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {v === 'rate' ? t('totalReturnCard') : t('totalPLCard')}
            </button>
          ))}
          <button
            onClick={() => setCardDark(v => !v)}
            className="px-3 py-2 text-sm rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
          >
            {cardDark ? '☀' : '☾'}
          </button>
        </div>

        {/* Card preview — scaled to fit modal */}
        <div className="flex justify-center mb-4 overflow-hidden" style={{ height: 267 }}>
          <div style={{ transform: 'scale(0.71)', transformOrigin: 'top center' }}>
            <ShareCard
              ref={cardRef}
              ticker={ticker}
              variant={variant}
              dark={cardDark}
              lang={lang}
              period={period}
            />
          </div>
        </div>

        {/* Download button */}
        <button
          onClick={download}
          className="w-full py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-colors"
        >
          ↓ Download PNG
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify share cards work**

Dashboard → Positions → click "Share" on NVDA. Expected: modal opens with card preview, toggle rate/amount switches content, toggle dark/light changes theme, "Download PNG" saves a 750×1000px file.

- [ ] **Step 5: Commit**

```bash
git add src/components/positions/ShareCard.tsx src/components/positions/ShareModal.tsx src/lib/shareCard.ts
git commit -m "feat: implement share cards with rate/amount variants and PNG export"
```

---

## Task 13: Production Build + Final Polish

**Files:**
- Modify: `index.html`
- Modify: `package.json` (build script check)

- [ ] **Step 1: Update index.html title and meta**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Analyze your IBKR portfolio statements in the browser. No data leaves your device." />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>" />
    <title>IBKR Modern Statements</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: `dist/` folder created with no TypeScript errors.

- [ ] **Step 3: Preview production build**

```bash
npm run preview
```

Visit the preview URL. Upload CSV, confirm all three tabs work, confirm PNG download works.

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: production build verified — IBKR Modern Statements complete"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Multi-file upload with overlap detection (Task 7 UploadPage + Task 4 merger)
- ✅ Deduplicate by `Symbol|DateTime|Quantity|Price` (Task 4)
- ✅ Latest file wins for NAV/TWR/OpenPositions (Task 4 merger)
- ✅ Overview tab: 4 cards + pie chart + period info (Task 9)
- ✅ Positions tab: sortable table + share modal (Tasks 10, 12)
- ✅ Trades tab: chronological + ticker filter (Task 11)
- ✅ Share cards: rate card + amount card (Task 12)
- ✅ Dark/light theme for cards (Task 12)
- ✅ EN/ZH language toggle (Task 6 i18n)
- ✅ "Upload More" from dashboard (Task 8 top bar)
- ✅ Per-file period display + remove button (Task 7)
- ✅ PNG export at 2× resolution (Task 12 shareCard.ts)

**No placeholders found.**

**Type consistency verified:** `TickerSummary`, `MergedStatementData`, `Trade`, `OpenPosition` used consistently across tasks 2→12.
