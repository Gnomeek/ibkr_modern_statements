// src/components/overview/PortfolioPieChart.tsx
import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useStatement } from '@/hooks/useStatement'

const COLORS = [
  '#00ff88',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#ec4899',
]

export default function PortfolioPieChart() {
  const { merged, darkMode, masked } = useStatement()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [animationDone, setAnimationDone] = useState(false)
  if (!merged) return null

  const stockData = merged.openPositions
    .filter((p) => p.marketValue > 0)
    .map((p) => ({ name: p.symbol, value: parseFloat(p.marketValue.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)

  const cashValue = parseFloat((merged.cashBalance ?? 0).toFixed(2))
  const data = cashValue > 0 ? [...stockData, { name: 'Cash', value: cashValue }] : stockData

  if (data.length === 0) return null

  const total = data.reduce((s, d) => s + d.value, 0)
  const active = activeIndex !== null ? data[activeIndex] : null
  const textColor = darkMode ? '#fff' : '#111827'
  const mutedColor = darkMode ? '#9ca3af' : '#6b7280'

  return (
    <div
      className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}
    >
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
        Portfolio Allocation
      </h3>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="relative shrink-0" style={{ width: 240, height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={108}
                paddingAngle={2}
                dataKey="value"
                isAnimationActive={true}
                onAnimationEnd={() => setAnimationDone(true)}
                onMouseEnter={animationDone ? (_, i) => setActiveIndex(i) : undefined}
                onMouseLeave={animationDone ? () => setActiveIndex(null) : undefined}
              >
                {data.map((_, i) => {
                  const isActive = activeIndex === i
                  const hasHover = activeIndex !== null
                  return (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                      opacity={hasHover && !isActive ? 0.4 : 1}
                      stroke={isActive ? COLORS[i % COLORS.length] : 'none'}
                      strokeWidth={isActive ? 2 : 0}
                      strokeOpacity={0.6}
                      style={{ outline: 'none', transition: 'opacity 0.15s' }}
                    />
                  )
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {active ? (
              <>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: COLORS[activeIndex! % COLORS.length],
                    fontFamily: 'monospace',
                  }}
                >
                  {((active.value / total) * 100).toFixed(1)}%
                </span>
                <span style={{ fontSize: 11, color: mutedColor, marginTop: 2 }}>{active.name}</span>
                <span style={{ fontSize: 11, color: mutedColor }}>
                  {masked ? '$***' : `$${active.value.toLocaleString()}`}
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 11, color: mutedColor }}>Total</span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: textColor,
                    fontFamily: 'monospace',
                  }}
                >
                  {masked
                    ? '$***'
                    : `$${total.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 flex-1 w-full">
          {data.map((item, i) => {
            const pct = ((item.value / total) * 100).toFixed(1)
            const isActive = activeIndex === i
            return (
              <div
                key={item.name}
                className="flex items-center gap-2 cursor-default"
                onMouseEnter={animationDone ? () => setActiveIndex(i) : undefined}
                onMouseLeave={animationDone ? () => setActiveIndex(null) : undefined}
                style={{
                  opacity: activeIndex !== null && !isActive ? 0.45 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: COLORS[i % COLORS.length],
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: textColor,
                    fontFamily: 'monospace',
                    minWidth: 44,
                  }}
                >
                  {item.name}
                </span>
                <span style={{ fontSize: 11, color: mutedColor }}>{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
