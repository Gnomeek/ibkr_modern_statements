import Papa from 'papaparse'
import type { StatementData, Trade, OpenPosition, RealizedUnrealizedSummary } from '../types/statement'

type Row = string[]

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
    cashBalance: 0,
    startingNav: 0,
    depositsWithdrawals: 0,
    endingNav: 0,
  }

  let navHeaderCols: string[] = []
  let tradeHeaderCols: string[] = []
  let openPosHeaderCols: string[] = []
  let ruHeaderCols: string[] = []
  let currentSection = ''

  for (const row of data) {
    const [sectionName, rowType, ...rest] = row
    if (!sectionName) continue

    if (rowType === 'Header') {
      currentSection = sectionName
      switch (sectionName) {
        // The TWR header row has only one column — skip to avoid overwriting the asset-class header
        case 'Net Asset Value':
          if (rest.length > 1) navHeaderCols = rest
          break
        // IBKR emits separate Trades headers for Stocks and Forex; Stocks header includes 'Realized P/L'
        case 'Trades':
          if (rest.includes('Realized P/L')) tradeHeaderCols = rest
          break
        case 'Open Positions':                            openPosHeaderCols = rest; break
        case 'Realized & Unrealized Performance Summary': ruHeaderCols = rest;      break
      }
      continue
    }

    if (rowType !== 'Data') continue

    currentSection = sectionName

    switch (currentSection) {

      case 'Statement': {
        const [fieldName, fieldValue] = rest
        if (fieldName === 'Period') {
          // Normalize em/en-dashes that IBKR sometimes uses as the range separator
          const normalized = fieldValue.replace(/\s[–—]\s/g, ' - ')
          const parts = normalized.split(' - ')
          result.periodStart = parsePeriodDate(parts[0].trim())
          result.periodEnd   = parsePeriodDate(parts[1].trim())
        }
        break
      }

      case 'Account Information': {
        const [fieldName, fieldValue] = rest
        if (fieldName === 'Name')          result.accountName  = fieldValue
        if (fieldName === 'Account')       result.accountId    = fieldValue
        if (fieldName === 'Base Currency') result.baseCurrency = fieldValue
        break
      }

      case 'Net Asset Value': {
        // TWR row has a single value like "9.988250429%"
        if (rest.length === 1 && rest[0].endsWith('%')) {
          result.twr = parseFloat(rest[0]) / 100
          break
        }
        const col = (name: string) => rest[navHeaderCols.indexOf(name)]
        const assetClass = rest[0].trim()
        if (assetClass === 'Cash')  result.cashBalance = parseFloat(col('Current Total')) || 0
        if (assetClass === 'Total') {
          result.currentNav = parseFloat(col('Current Total')) || 0
          result.priorNav   = parseFloat(col('Prior Total'))   || 0
        }
        break
      }

      case 'Change in NAV': {
        const [fieldName, fieldValue] = rest
        const v = parseFloat(fieldValue) || 0
        if (fieldName === 'Starting Value')         result.startingNav          = v
        if (fieldName === 'Deposits & Withdrawals') result.depositsWithdrawals = v
        if (fieldName === 'Ending Value')           result.endingNav           = v
        break
      }

      case 'Realized & Unrealized Performance Summary': {
        const col = (name: string) => rest[ruHeaderCols.indexOf(name)]
        // Skip Forex rows and aggregate Total rows
        if (col('Asset Category') !== 'Stocks') break
        const symbol = col('Symbol')
        if (!symbol || symbol === 'Total') break
        result.realizedUnrealized.push({
          symbol,
          realizedTotal:   parseFloat(col('Realized Total'))   || 0,
          unrealizedTotal: parseFloat(col('Unrealized Total')) || 0,
        })
        break
      }

      case 'Open Positions': {
        const col = (name: string) => rest[openPosHeaderCols.indexOf(name)]
        if (col('DataDiscriminator') !== 'Summary') break
        const symbol = col('Symbol')
        if (!symbol) break
        result.openPositions.push({
          symbol,
          quantity:     parseFloat(col('Quantity'))       || 0,
          costPrice:    parseFloat(col('Cost Price'))     || 0,
          costBasis:    parseFloat(col('Cost Basis'))     || 0,
          closePrice:   parseFloat(col('Close Price'))    || 0,
          marketValue:  parseFloat(col('Value'))          || 0,
          unrealizedPL: parseFloat(col('Unrealized P/L')) || 0,
        })
        break
      }

      case 'Trades': {
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

function parsePeriodDate(s: string): Date {
  const date = new Date(s)
  if (isNaN(date.getTime())) throw new Error(`Cannot parse date: "${s}"`)
  return date
}
