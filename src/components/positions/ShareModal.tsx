// src/components/positions/ShareModal.tsx
import { useRef, useState } from 'react'
import type { TickerSummary } from '../../types/statement'
import { useStatement } from '../../hooks/useStatement'
import { createT } from '../../i18n'
import ShareCard from './ShareCard'
import { exportCardAsPng } from '../../lib/shareCard'

interface Props {
  ticker: TickerSummary
  onClose: () => void
}

export default function ShareModal({ ticker, onClose }: Props) {
  const { merged, lang, darkMode } = useStatement()
  const t = createT(lang)
  const [variant, setVariant] = useState<'rate' | 'amount'>('rate')
  const [cardDark, setCardDark] = useState(darkMode)
  const cardRef = useRef<HTMLDivElement>(null)

  if (!merged) return null

  const period = `${merged.periodStart.toISOString().slice(0, 7)} ~ ${merged.periodEnd.toISOString().slice(0, 7)}`

  async function download() {
    if (!cardRef.current) return
    await exportCardAsPng(cardRef.current, `${ticker.symbol}-${variant}-${cardDark ? 'dark' : 'light'}.png`)
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`rounded-2xl p-6 w-full max-w-md ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {ticker.symbol} — {t('share')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Variant + theme toggles */}
        <div className="flex gap-2 mb-4">
          {(['rate', 'amount'] as const).map(v => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                variant === v
                  ? 'bg-green-500 text-black font-semibold'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {v === 'rate' ? t('totalReturnCard') : t('totalPLCard')}
            </button>
          ))}
          <button
            onClick={() => setCardDark(v => !v)}
            className="px-3 py-2 text-sm rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          >
            {cardDark ? '☀' : '☾'}
          </button>
        </div>

        {/* Card preview — scaled to fit modal */}
        <div className="flex justify-center mb-4 overflow-hidden" style={{ height: 267 }}>
          <div style={{ transform: 'scale(0.712)', transformOrigin: 'top center' }}>
            <ShareCard
              ref={cardRef}
              ticker={ticker}
              variant={variant}
              dark={cardDark}
              lang={lang}
              period={period}
            />
          </div>
        </div>

        {/* Download button */}
        <button
          onClick={download}
          className="w-full py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-colors"
        >
          ↓ Download PNG
        </button>
      </div>
    </div>
  )
}
