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
