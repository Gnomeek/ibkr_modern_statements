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
    ...data.trades.map(t => t.symbol),
    ...data.openPositions.map(p => p.symbol),
    ...data.realizedUnrealized.map(r => r.symbol),
  ])

  return Array.from(symbols).map(symbol => {
    const pos = data.openPositions.find(p => p.symbol === symbol)

    // Sum realized P/L from all trades — correct across multiple CSVs
    const realizedPL = data.trades
      .filter(t => t.symbol === symbol)
      .reduce((sum, t) => sum + t.realizedPL, 0)

    const unrealizedPL = pos?.unrealizedPL ?? 0
    const totalPL = realizedPL + unrealizedPL

    const quantity     = pos?.quantity    ?? 0
    const costPrice    = pos?.costPrice   ?? 0
    const currentPrice = pos?.closePrice  ?? 0
    const marketValue  = pos?.marketValue ?? 0
    const costBasis    = pos?.costBasis   ?? estimateCostBasisFromTrades(data, symbol)
    const returnPct    = costBasis !== 0 ? (totalPL / costBasis) * 100 : 0

    return { symbol, quantity, costPrice, currentPrice, marketValue, realizedPL, unrealizedPL, totalPL, returnPct, costBasis }
  })
}

function estimateCostBasisFromTrades(data: MergedStatementData, symbol: string): number {
  const buyBasis = data.trades
    .filter(t => t.symbol === symbol && t.quantity > 0)
    .reduce((sum, t) => sum + Math.abs(t.basis), 0)
  if (buyBasis > 0) return buyBasis

  // When the buy happened before the earliest CSV, reconstruct from sell trade's basis field
  return data.trades
    .filter(t => t.symbol === symbol && t.quantity < 0)
    .reduce((sum, t) => sum + Math.abs(t.basis), 0)
}

export function buildPortfolioMetrics(data: MergedStatementData): PortfolioMetrics {
  const totalRealizedPL   = data.trades.reduce((s, t) => s + t.realizedPL, 0)
  const totalUnrealizedPL = data.openPositions.reduce((s, p) => s + p.unrealizedPL, 0)
  const totalPL           = totalRealizedPL + totalUnrealizedPL

  // Net return: strip deposits/withdrawals from NAV change to isolate investment gains
  const netInvestmentGain = data.endingNav - data.startingNav - data.depositsWithdrawals
  // Denominator approximates invested capital; IBKR's TWR (displayed separately) is more precise
  const returnBase    = data.startingNav + Math.max(0, data.depositsWithdrawals)
  const totalReturnPct = returnBase !== 0 ? (netInvestmentGain / returnBase) * 100 : 0

  return { currentNav: data.currentNav, totalRealizedPL, totalUnrealizedPL, totalPL, totalReturnPct, twr: data.twr }
}
