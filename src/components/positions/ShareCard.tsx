// src/components/positions/ShareCard.tsx
import { forwardRef } from 'react'
import type { TickerSummary } from '../../types/statement'
import type { Lang } from '../../i18n'
import { createT } from '../../i18n'

interface Props {
  ticker: TickerSummary
  variant: 'rate' | 'amount'
  dark: boolean
  lang: Lang
  period: string
}

function fmtPct(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

function fmtUsd(v: number) {
  return `${v >= 0 ? '+' : '-'}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const ShareCard = forwardRef<HTMLDivElement, Props>(({ ticker, variant, dark, lang, period }, ref) => {
  const t = createT(lang)
  const positive = variant === 'rate' ? ticker.returnPct >= 0 : ticker.totalPL >= 0

  const bg = dark ? '#0a0a0a' : '#ffffff'
  const primary = positive
    ? (dark ? '#00ff88' : '#16a34a')
    : (dark ? '#ff4444' : '#dc2626')
  const text = dark ? '#ffffff' : '#111827'
  const muted = dark ? '#6b7280' : '#9ca3af'
  const surface = dark ? '#1a1a1a' : '#f3f4f6'

  return (
    <div
      ref={ref}
      style={{
        width: 375,
        height: 500,
        background: bg,
        color: text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 16,
        border: dark ? '1px solid #1f2937' : '1px solid #e5e7eb',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: muted }}>IBKR</span>
        <span style={{ fontSize: 12, color: muted }}>{period}</span>
      </div>

      {/* Ticker name + label */}
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: text }}>{ticker.symbol}</div>
        <div style={{ fontSize: 13, color: muted, marginTop: 4 }}>
          {variant === 'rate' ? t('totalReturnCard') : t('totalPLCard')}
        </div>
      </div>

      {/* Big number */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 52, fontWeight: 900, color: primary, lineHeight: 1 }}>
          {variant === 'rate' ? fmtPct(ticker.returnPct) : fmtUsd(ticker.totalPL)}
        </span>
        <span style={{ fontSize: 40 }}>{variant === 'rate' ? '🚀' : '📈'}</span>
      </div>

      {/* Detail rows */}
      <div style={{ background: surface, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {variant === 'rate' ? (
          <>
            <CardRow label={t('cost')} value={`$${ticker.costPrice.toFixed(2)}`} muted={muted} text={text} />
            <CardRow label={t('currentPrice')} value={`$${ticker.currentPrice.toFixed(2)}`} muted={muted} text={text} />
          </>
        ) : (
          <>
            <CardRow label={t('realized')} value={fmtUsd(ticker.realizedPL)} muted={muted} text={primary} />
            <CardRow label={t('unrealized')} value={fmtUsd(ticker.unrealizedPL)} muted={muted} text={primary} />
            <CardRow label={t('mktValue')} value={ticker.marketValue > 0 ? `$${ticker.marketValue.toLocaleString()}` : '—'} muted={muted} text={text} />
          </>
        )}
      </div>

      {/* Footer watermark */}
      <div style={{ fontSize: 11, color: muted, textAlign: 'center' }}>{t('generatedBy')}</div>
    </div>
  )
})

ShareCard.displayName = 'ShareCard'
export default ShareCard

function CardRow({ label, value, muted, text }: { label: string; value: string; muted: string; text: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
      <span style={{ color: muted }}>{label}</span>
      <span style={{ fontWeight: 600, color: text, fontFamily: 'monospace' }}>{value}</span>
    </div>
  )
}
