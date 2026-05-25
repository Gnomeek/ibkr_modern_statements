// src/lib/parser.ts
import Papa from 'papaparse'
import type { StatementData, Trade, OpenPosition, RealizedUnrealizedSummary } from '../types/statement'

// ─────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────
type Row = string[]

// ─────────────────────────────────────────────
// 主解析函数
// ─────────────────────────────────────────────
export function parseStatement(csvText: string): StatementData {
  const { data } = Papa.parse<Row>(csvText, { skipEmptyLines: true })

  const result: Partial<StatementData> & {
    trades: Trade[]
    openPositions: OpenPosition[]
    realizedUnrealized: RealizedUnrealizedSummary[]
  } = {
    trades: [],
    openPositions: [],
    realizedUnrealized: [],
    twr: 0,
    currentNav: 0,
    priorNav: 0,
  }

  // 各 section 的 header 列名（不含 sectionName 和 rowType）
  let navHeaderCols: string[] = []
  let tradeHeaderCols: string[] = []
  let openPosHeaderCols: string[] = []
  let ruHeaderCols: string[] = []
  let currentSection = ''

  for (const row of data) {
    // 每行格式: [sectionName, rowType, ...rest]
    const [sectionName, rowType, ...rest] = row
    if (!sectionName) continue

    // ── Header 行: 记录列名 ──────────────────
    if (rowType === 'Header') {
      currentSection = sectionName
      switch (sectionName) {
        // Bug 3 修复: TWR header 只有一列，跳过避免覆盖资产类别 header
        case 'Net Asset Value':
          if (rest.length > 1) navHeaderCols = rest
          break
        // Bug 1 修复: 只记录 Stocks trades 的 header
        // Stocks header 含 'Realized P/L' 列，Forex header 不含
        case 'Trades':
          if (rest.includes('Realized P/L')) tradeHeaderCols = rest
          break
        case 'Open Positions':                          openPosHeaderCols = rest; break
        case 'Realized & Unrealized Performance Summary': ruHeaderCols = rest; break
      }
      continue
    }

    // ── 只处理 Data 行 ───────────────────────
    if (rowType !== 'Data') continue

    // section 可能在 Header 之后发生变化
    currentSection = sectionName

    switch (currentSection) {

      // ── 报表元数据 ──────────────────────────
      case 'Statement': {
        const [fieldName, fieldValue] = rest
        if (fieldName === 'Period') {
          // Bug 4 修复: 统一 em-dash/en-dash/hyphen 为标准 ASCII 连字符再切割
          const normalized = fieldValue.replace(/\s[–—]\s/g, ' - ')
          const parts = normalized.split(' - ')
          result.periodStart = parsePeriodDate(parts[0].trim())
          result.periodEnd   = parsePeriodDate(parts[1].trim())
        }
        break
      }

      // ── 账户信息 ───────────────────────────
      case 'Account Information': {
        const [fieldName, fieldValue] = rest
        if (fieldName === 'Name')          result.accountName  = fieldValue
        if (fieldName === 'Account')       result.accountId    = fieldValue
        if (fieldName === 'Base Currency') result.baseCurrency = fieldValue
        break
      }

      // ── 净资产值（两种子格式） ───────────────
      case 'Net Asset Value': {
        // TWR 行: rest 长度为 1，值形如 "9.988250429%"
        if (rest.length === 1 && rest[0].endsWith('%')) {
          result.twr = parseFloat(rest[0]) / 100
          break
        }

        // 资产类别行: 用 navHeaderCols 定位列
        // navHeaderCols = ['Asset Class','Prior Total','Current Long','Current Short','Current Total','Change']
        // rest[0] = Asset Class 的值
        const col = (name: string) => rest[navHeaderCols.indexOf(name)]
        const assetClass = rest[0]
        if (assetClass === 'Total') {
          result.currentNav = parseFloat(col('Current Total')) || 0
          result.priorNav   = parseFloat(col('Prior Total'))   || 0
        }
        break
      }

      // ── 盈亏汇总 ───────────────────────────
      case 'Realized & Unrealized Performance Summary': {
        // ruHeaderCols = ['Asset Category','Symbol','Cost Adj.','Realized S/T Profit','Realized S/T Loss',
        //                 'Realized L/T Profit','Realized L/T Loss','Realized Total',
        //                 'Unrealized S/T Profit','Unrealized S/T Loss','Unrealized L/T Profit',
        //                 'Unrealized L/T Loss','Unrealized Total','Total','Code']
        // Bug 2 修复: 跳过 Forex 行和各类 Total 汇总行，只保留 Stocks 标的
        const col = (name: string) => rest[ruHeaderCols.indexOf(name)]
        const assetCategory = col('Asset Category')
        if (assetCategory !== 'Stocks') break
        const symbol = col('Symbol')
        if (!symbol || symbol === 'Total') break
        result.realizedUnrealized.push({
          symbol,
          realizedTotal:   parseFloat(col('Realized Total'))   || 0,
          unrealizedTotal: parseFloat(col('Unrealized Total')) || 0,
        })
        break
      }

      // ── 持仓 ────────────────────────────────
      case 'Open Positions': {
        // openPosHeaderCols = ['DataDiscriminator','Asset Category','Currency','Symbol','Open',
        //                      'Quantity','Mult','Cost Price','Cost Basis','Close Price','Value',
        //                      'Unrealized P/L','Code']
        // 只取 Summary 行
        const col = (name: string) => rest[openPosHeaderCols.indexOf(name)]
        if (col('DataDiscriminator') !== 'Summary') break

        const symbol = col('Symbol')
        if (!symbol) break

        result.openPositions.push({
          symbol,
          quantity:    parseFloat(col('Quantity'))       || 0,
          costPrice:   parseFloat(col('Cost Price'))     || 0,
          costBasis:   parseFloat(col('Cost Basis'))     || 0,
          closePrice:  parseFloat(col('Close Price'))    || 0,
          marketValue: parseFloat(col('Value'))          || 0,
          unrealizedPL: parseFloat(col('Unrealized P/L')) || 0,
        })
        break
      }

      // ── 交易记录 ────────────────────────────
      case 'Trades': {
        // tradeHeaderCols = ['DataDiscriminator','Asset Category','Currency','Symbol','Date/Time',
        //                    'Quantity','T. Price','C. Price','Proceeds','Comm/Fee','Basis',
        //                    'Realized P/L','MTM P/L','Code']
        // Bug 1 修复: 只取 Stocks Order 行，跳过 Forex
        const col = (name: string) => rest[tradeHeaderCols.indexOf(name)]
        if (col('DataDiscriminator') !== 'Order') break
        if (col('Asset Category') !== 'Stocks') break

        const symbol = col('Symbol')
        if (!symbol) break

        result.trades.push({
          symbol,
          dateTime:   col('Date/Time') ?? '',
          quantity:   parseFloat(col('Quantity'))     || 0,
          price:      parseFloat(col('T. Price'))     || 0,
          proceeds:   parseFloat(col('Proceeds'))     || 0,
          commission: parseFloat(col('Comm/Fee'))     || 0,
          basis:      parseFloat(col('Basis'))        || 0,
          realizedPL: parseFloat(col('Realized P/L')) || 0,
          mtmPL:      parseFloat(col('MTM P/L'))      || 0,
          code:       col('Code') ?? '',
        })
        break
      }
    }
  }

  if (!result.periodStart || !result.periodEnd) {
    throw new Error('Could not parse period from CSV — is this an IBKR Activity Statement?')
  }

  return result as StatementData
}

// ─────────────────────────────────────────────
// 日期解析: "January 1, 2026" 或 "May 22, 2026"
// ─────────────────────────────────────────────
function parsePeriodDate(s: string): Date {
  const date = new Date(s)
  if (isNaN(date.getTime())) throw new Error(`Cannot parse date: "${s}"`)
  return date
}
