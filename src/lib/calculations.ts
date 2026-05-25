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
  // 对已平仓头寸，累加买入交易的绝对成本
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
