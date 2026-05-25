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
    // 多文件时链式复合：(1+r1)×(1+r2)×…−1，与 IBKR 首页的跨期 TWR 一致
    // 单文件时退化为该文件的 TWR
    twr: sorted.reduce((acc, s) => (1 + acc) * (1 + s.twr) - 1, 0),
    cashBalance: latest.cashBalance,
    // 多文件时：起始 NAV 取最早文件，出入金累加所有文件（去重逻辑由 dedup trades 保证），ending 取最新
    startingNav: sorted[0].startingNav,
    depositsWithdrawals: statements.reduce((s, st) => s + st.depositsWithdrawals, 0),
    endingNav: latest.endingNav,
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
