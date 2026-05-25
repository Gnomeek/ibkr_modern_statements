// src/components/trades/TradesTable.tsx
import { useState } from 'react'
import { useStatement } from '@/hooks/useStatement'
import { createT } from '@/i18n'
import type { Trade } from '@/types/statement'
import TickerFilter from './TickerFilter'
import PnlCell from '@/components/ui/PnlCell'

type SortKey =
  | 'dateTime'
  | 'symbol'
  | 'quantity'
  | 'price'
  | 'proceeds'
  | 'commission'
  | 'realizedPL'

interface ThProps {
  label: string
  sk: SortKey
  sortKey: SortKey
  sortAsc?: boolean
  onSort: (key: SortKey) => void
}

function Th({ label, sk, sortKey, sortAsc, onSort }: ThProps) {
  const active = sortKey === sk
  return (
    <th
      onClick={() => onSort(sk)}
      className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-300 transition-colors"
    >
      {label} {active ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  )
}

function formatDateTime(s: string) {
  return s.replace(', ', ' ')
}

function sortTrades(trades: Trade[], key: SortKey, asc: boolean): Trade[] {
  return [...trades].sort((a, b) => {
    let cmp: number
    if (key === 'dateTime' || key === 'symbol') {
      cmp = a[key].localeCompare(b[key])
    } else {
      cmp = Math.abs(a[key] as number) - Math.abs(b[key] as number)
    }
    return asc ? cmp : -cmp
  })
}

export default function TradesTable() {
  const { merged, lang, darkMode, masked } = useStatement()
  const t = createT(lang)
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('dateTime')
  const [sortAsc, setSortAsc] = useState(false)

  if (!merged) return null

  const allSymbols = [...new Set(merged.trades.map((tr) => tr.symbol))].sort()

  const filtered =
    selectedSymbols.length === 0
      ? merged.trades
      : merged.trades.filter((tr) => selectedSymbols.includes(tr.symbol))

  const sorted = sortTrades(filtered, sortKey, sortAsc)

  function onSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v)
    else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  return (
    <div>
      <TickerFilter
        symbols={allSymbols}
        selected={selectedSymbols}
        onChange={setSelectedSymbols}
        dark={darkMode}
      />
      <div
        className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className={darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
              <tr>
                <Th
                  label={t('date')}
                  sk="dateTime"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={onSort}
                />
                <Th
                  label={t('ticker')}
                  sk="symbol"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={onSort}
                />
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('side')}
                </th>
                <Th
                  label={t('qty')}
                  sk="quantity"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={onSort}
                />
                <Th
                  label={t('price')}
                  sk="price"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={onSort}
                />
                <Th
                  label={t('proceeds')}
                  sk="proceeds"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={onSort}
                />
                <Th
                  label={t('commission')}
                  sk="commission"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={onSort}
                />
                <Th
                  label={t('realizedPL')}
                  sk="realizedPL"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={onSort}
                />
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {sorted.map((tr, i) => (
                <tr
                  key={`${tr.symbol}|${tr.dateTime}|${i}`}
                  className={`${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}
                >
                  <td className="px-3 py-2 font-mono text-xs text-gray-400">
                    {formatDateTime(tr.dateTime)}
                  </td>
                  <td className="px-3 py-2 font-mono font-semibold">{tr.symbol}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${tr.quantity > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
                    >
                      {tr.quantity > 0 ? t('buy') : t('sell')}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono">{Math.abs(tr.quantity)}</td>
                  <td className="px-3 py-2 font-mono">${tr.price.toFixed(3)}</td>
                  <td className="px-3 py-2 font-mono">
                    {masked ? '$***' : `$${Math.abs(tr.proceeds).toFixed(2)}`}
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-400">
                    {masked ? '$***' : `$${Math.abs(tr.commission).toFixed(4)}`}
                  </td>
                  <td className="px-3 py-2">
                    <PnlCell value={tr.realizedPL} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
