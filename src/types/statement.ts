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
  cashBalance: number     // Cash row in Net Asset Value section

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
  cashBalance: number     // from latest file

  trades: Trade[]                                    // deduplicated, all files
  openPositions: OpenPosition[]                      // from latest file only
  realizedUnrealized: RealizedUnrealizedSummary[]    // recomputed from merged trades

  hasOverlap: boolean
  fileCount: number
}
