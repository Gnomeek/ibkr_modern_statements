// src/components/trades/TradesTable.tsx
import { useState } from 'react'
import { useStatement } from '../../hooks/useStatement'
import { createT } from '../../i18n'
import TickerFilter from './TickerFilter'
import PnlCell from '../ui/PnlCell'

function formatDateTime(s: string) {
  return s.replace(', ', ' ')
}

export default function TradesTable() {
  const { merged, lang, darkMode } = useStatement()
  const t = createT(lang)
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([])

  if (!merged) return null

  const allSymbols = [...new Set(merged.trades.map(tr => tr.symbol))].sort()
  const filtered = selectedSymbols.length === 0
    ? merged.trades
    : merged.trades.filter(tr => selectedSymbols.includes(tr.symbol))

  return (
    <div>
      <TickerFilter
        symbols={allSymbols}
        selected={selectedSymbols}
        onChange={setSelectedSymbols}
        dark={darkMode}
      />
      <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
            <tr>
              {[t('date'), t('ticker'), t('side'), t('qty'), t('price'), t('proceeds'), t('commission'), t('realizedPL')].map(h => (
                <th key={h} className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {filtered.map((tr, i) => (
              <tr key={i} className={`${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                <td className="px-3 py-2 font-mono text-xs text-gray-400">{formatDateTime(tr.dateTime)}</td>
                <td className="px-3 py-2 font-mono font-semibold">{tr.symbol}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${tr.quantity > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {tr.quantity > 0 ? t('buy') : t('sell')}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono">{Math.abs(tr.quantity)}</td>
                <td className="px-3 py-2 font-mono">${tr.price.toFixed(3)}</td>
                <td className="px-3 py-2 font-mono">${Math.abs(tr.proceeds).toFixed(2)}</td>
                <td className="px-3 py-2 font-mono text-gray-400">${Math.abs(tr.commission).toFixed(4)}</td>
                <td className="px-3 py-2"><PnlCell value={tr.realizedPL} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
