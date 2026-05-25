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
    const costBasis = pos?.costBasis ?? estimateCostBasisFromTrades(data, symbol)
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

  // 正确的总盈亏 = 期末NAV - 期初NAV - 净入金
  // 即扣除出入金影响后真正的投资收益
  const netInvestmentGain = data.endingNav - data.startingNav - data.depositsWithdrawals

  // 收益率分母 = 期初NAV + 净入金（简单近似，适合入金时间分散的情况）
  // IBKR 自己算的 TWR 是更准确的时间加权版本，我们同时展示两个
  const returnBase = data.startingNav + Math.max(0, data.depositsWithdrawals)
  const totalReturnPct = returnBase !== 0 ? (netInvestmentGain / returnBase) * 100 : 0

  return {
    currentNav: data.currentNav,
    totalRealizedPL,
    totalUnrealizedPL,
    totalPL,
    totalReturnPct,
    twr: data.twr,
  }
}
