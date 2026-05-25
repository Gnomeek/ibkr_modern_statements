// src/components/positions/PositionsTable.tsx
import { useState } from 'react'
import { useStatement } from '../../hooks/useStatement'
import { createT } from '../../i18n'
import { buildTickerSummaries } from '../../lib/calculations'
import type { TickerSummary } from '../../types/statement'
import PnlCell from '../ui/PnlCell'
import ShareModal from './ShareModal'

type SortKey = keyof Pick<TickerSummary, 'symbol' | 'marketValue' | 'realizedPL' | 'unrealizedPL' | 'totalPL' | 'returnPct'>

export default function PositionsTable() {
  const { merged, lang, darkMode } = useStatement()
  const t = createT(lang)
  const [sortKey, setSortKey] = useState<SortKey>('totalPL')
  const [sortAsc, setSortAsc] = useState(false)
  const [shareSymbol, setShareSymbol] = useState<string | null>(null)

  if (!merged) return null

  const summaries = buildTickerSummaries(merged)

  const sorted = [...summaries].sort((a, b) => {
    const av = a[sortKey]
    const bv = b[sortKey]
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
    return sortAsc ? cmp : -cmp
  })

  function onSort(key: SortKey) {
    if (sortKey === key) setSortAsc(v => !v)
    else { setSortKey(key); setSortAsc(false) }
  }

  const th = (label: string, key: SortKey) => (
    <th
      key={key}
      onClick={() => onSort(key)}
      className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-300 transition-colors"
    >
      {label} {sortKey === key ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  )

  const shareTarget = shareSymbol ? summaries.find(s => s.symbol === shareSymbol) ?? null : null

  return (
    <>
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead className={darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
            <tr>
              {th(t('ticker'), 'symbol')}
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('qty')}</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('costPrice')}</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('currentPrice')}</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('marketValue')}</th>
              {th(t('realizedPL'), 'realizedPL')}
              {th(t('unrealizedPL'), 'unrealizedPL')}
              {th('Total P/L', 'totalPL')}
              {th(t('returnPct'), 'returnPct')}
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('action')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {sorted.map(row => (
              <tr key={row.symbol} className={`${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                <td className="px-3 py-3 font-mono font-semibold">{row.symbol}</td>
                <td className="px-3 py-3 text-right font-mono text-gray-400">{row.quantity || '—'}</td>
                <td className="px-3 py-3 text-right font-mono">{row.costPrice > 0 ? `$${row.costPrice.toFixed(2)}` : '—'}</td>
                <td className="px-3 py-3 text-right font-mono">{row.currentPrice > 0 ? `$${row.currentPrice.toFixed(2)}` : '—'}</td>
                <td className="px-3 py-3 text-right font-mono">{row.marketValue > 0 ? `$${row.marketValue.toLocaleString()}` : '—'}</td>
                <td className="px-3 py-3 text-right"><PnlCell value={row.realizedPL} /></td>
                <td className="px-3 py-3 text-right"><PnlCell value={row.unrealizedPL} /></td>
                <td className="px-3 py-3 text-right"><PnlCell value={row.totalPL} /></td>
                <td className="px-3 py-3 text-right"><PnlCell value={row.returnPct} format="percent" /></td>
                <td className="px-3 py-3 text-right">
                  <button
                    onClick={() => setShareSymbol(row.symbol)}
                    className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                  >
                    {t('share')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {shareTarget && (
        <ShareModal ticker={shareTarget} onClose={() => setShareSymbol(null)} />
      )}
    </>
  )
}
