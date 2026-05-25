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
