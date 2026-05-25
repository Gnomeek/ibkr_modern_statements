// src/components/overview/PeriodInfo.tsx
import { useStatement } from '../../hooks/useStatement'
import { createT } from '../../i18n'

function mask(id: string) {
  return id.slice(0, 2) + '****' + id.slice(-3)
}

export default function PeriodInfo() {
  const { merged, lang, darkMode } = useStatement()
  const t = createT(lang)
  if (!merged) return null

  return (
    <div className={`rounded-xl p-5 flex flex-wrap gap-6 text-sm ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
      <div>
        <span className="text-gray-500 mr-2">{t('period')}:</span>
        <span>{merged.periodStart.toISOString().slice(0, 10)} → {merged.periodEnd.toISOString().slice(0, 10)}</span>
      </div>
      <div>
        <span className="text-gray-500 mr-2">{t('account')}:</span>
        <span>{mask(merged.accountId)}</span>
      </div>
      <div>
        <span className="text-gray-500 mr-2">{t('currency')}:</span>
        <span>{merged.baseCurrency}</span>
      </div>
      {merged.fileCount > 1 && (
        <div className="text-yellow-400">
          {merged.fileCount} files merged
        </div>
      )}
    </div>
  )
}
