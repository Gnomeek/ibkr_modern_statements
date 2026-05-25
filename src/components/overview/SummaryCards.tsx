// src/components/overview/SummaryCards.tsx
import { useStatement } from '../../hooks/useStatement'
import { createT } from '../../i18n'
import { buildPortfolioMetrics } from '../../lib/calculations'
import PnlCell from '../ui/PnlCell'

function MetricCard({ label, children, dark }: { label: string; children: React.ReactNode; dark: boolean }) {
  return (
    <div className={`rounded-xl p-5 ${dark ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="text-2xl font-bold">{children}</div>
    </div>
  )
}

export default function SummaryCards() {
  const { merged, lang, darkMode } = useStatement()
  const t = createT(lang)
  if (!merged) return null

  const m = buildPortfolioMetrics(merged)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard label={t('totalNav')} dark={darkMode}>
        <span className="font-mono">${m.currentNav.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </MetricCard>
      <MetricCard label={t('totalPL')} dark={darkMode}>
        <PnlCell value={m.totalPL} />
      </MetricCard>
      <MetricCard label={t('totalReturn')} dark={darkMode}>
        <PnlCell value={m.totalReturnPct} format="percent" />
      </MetricCard>
      <MetricCard label={t('twr')} dark={darkMode}>
        <PnlCell value={m.twr * 100} format="percent" />
      </MetricCard>
    </div>
  )
}
