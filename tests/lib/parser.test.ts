// tests/lib/parser.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { parseStatement } from '../../src/lib/parser'

const csv = readFileSync('tests/fixtures/sample_statement.csv', 'utf-8')

describe('parseStatement', () => {
  it('parses account metadata', () => {
    const result = parseStatement(csv)
    expect(result.accountName).toBe('Demo User')
    expect(result.accountId).toBe('UDEMO001')
    expect(result.baseCurrency).toBe('USD')
  })

  it('parses period dates', () => {
    const result = parseStatement(csv)
    expect(result.periodStart.getFullYear()).toBe(2025)
    expect(result.periodStart.getMonth()).toBe(0)  // January = 0
    expect(result.periodEnd.getMonth()).toBe(11)   // December = 11
  })

  it('parses TWR', () => {
    const result = parseStatement(csv)
    expect(result.twr).toBeCloseTo(0.185, 3)
  })

  it('parses current NAV', () => {
    const result = parseStatement(csv)
    expect(result.currentNav).toBeCloseTo(71000, 0)
  })

  it('parses cash balance', () => {
    const result = parseStatement(csv)
    expect(result.cashBalance).toBeCloseTo(3000, 0)
  })

  it('parses Change in NAV fields', () => {
    const result = parseStatement(csv)
    expect(result.startingNav).toBeCloseTo(50000, 0)
    expect(result.depositsWithdrawals).toBeCloseTo(10000, 0)
    expect(result.endingNav).toBeCloseTo(71000, 0)
  })

  it('parses open positions', () => {
    const result = parseStatement(csv)
    const msft = result.openPositions.find(p => p.symbol === 'MSFT')
    expect(msft).toBeDefined()
    expect(msft!.quantity).toBe(15)
    expect(msft!.closePrice).toBeCloseTo(533.33, 1)
    expect(msft!.unrealizedPL).toBeCloseTo(3200, 0)
  })

  it('parses trades', () => {
    const result = parseStatement(csv)
    const aaplBuy = result.trades.find(t => t.symbol === 'AAPL' && t.quantity === 20)
    expect(aaplBuy).toBeDefined()
    expect(aaplBuy!.price).toBeCloseTo(180.00, 2)
  })

  it('parses realized/unrealized summary', () => {
    const result = parseStatement(csv)
    const aapl = result.realizedUnrealized.find(r => r.symbol === 'AAPL')
    expect(aapl).toBeDefined()
    expect(aapl!.realizedTotal).toBeCloseTo(850, 0)
    expect(aapl!.unrealizedTotal).toBeCloseTo(1200, 0)
  })

  it('excludes closed position TSLA from open positions', () => {
    const result = parseStatement(csv)
    expect(result.openPositions.find(p => p.symbol === 'TSLA')).toBeUndefined()
  })

  it('captures TSLA realized loss from trades', () => {
    const result = parseStatement(csv)
    const tsla = result.trades.filter(t => t.symbol === 'TSLA' && t.realizedPL !== 0)
    expect(tsla.length).toBeGreaterThan(0)
    expect(tsla[0].realizedPL).toBeCloseTo(-420, 0)
  })
})
