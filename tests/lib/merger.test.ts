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
  cashBalance: 1000,
  startingNav: 50000,
  depositsWithdrawals: 10000,
  endingNav: 80000,
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
    // TWR from latest file — IBKR's TWR is cumulative from account inception
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

  it('throws on empty input', () => {
    expect(() => mergeStatements([])).toThrow('No statements provided')
  })
})
