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
  // 收集所有出现过的标的（trades + open positions + summary）
  const symbols = new Set([
    ...data.trades.map(t => t.symbol),
    ...data.openPositions.map(p => p.symbol),
    ...data.realizedUnrealized.map(r => r.symbol),
  ])

  return Array.from(symbols).map(symbol => {
    const pos = data.openPositions.find(p => p.symbol === symbol)

    // 已实现盈亏：直接从合并后的全量 trades 累加，跨 CSV 正确
    const realizedPL = data.trades
      .filter(t => t.symbol === symbol)
      .reduce((sum, t) => sum + t.realizedPL, 0)

    // 未实现盈亏：来自 open positions（最新文件，准确）
    const unrealizedPL = pos?.unrealizedPL ?? 0

    const totalPL = realizedPL + unrealizedPL

    const quantity    = pos?.quantity   ?? 0
    const costPrice   = pos?.costPrice  ?? 0
    const currentPrice = pos?.closePrice ?? 0
    const marketValue = pos?.marketValue ?? 0

    // 成本基础：open position 有则直接用，否则从 trades 反推
    const costBasis = pos?.costBasis ?? estimateCostBasisFromTrades(data, symbol)

    const returnPct = costBasis !== 0 ? (totalPL / costBasis) * 100 : 0

    return { symbol, quantity, costPrice, currentPrice, marketValue, realizedPL, unrealizedPL, totalPL, returnPct, costBasis }
  })
}

function estimateCostBasisFromTrades(data: MergedStatementData, symbol: string): number {
  // 先找买入 trade 的 basis
  const buyBasis = data.trades
    .filter(t => t.symbol === symbol && t.quantity > 0)
    .reduce((sum, t) => sum + Math.abs(t.basis), 0)
  if (buyBasis > 0) return buyBasis

  // 买入在报表期之外时，卖出 trade 记录了成本（basis 为负值），取绝对值
  return data.trades
    .filter(t => t.symbol === symbol && t.quantity < 0)
    .reduce((sum, t) => sum + Math.abs(t.basis), 0)
}

export function buildPortfolioMetrics(data: MergedStatementData): PortfolioMetrics {
  // 已实现盈亏从全量 trades 计算，跨 CSV 正确
  const totalRealizedPL = data.trades.reduce((s, t) => s + t.realizedPL, 0)
  // 未实现盈亏从最新文件的 open positions 汇总
  const totalUnrealizedPL = data.openPositions.reduce((s, p) => s + p.unrealizedPL, 0)
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
