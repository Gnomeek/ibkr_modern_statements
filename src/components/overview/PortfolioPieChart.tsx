// src/components/overview/PortfolioPieChart.tsx
import { useState } from 'react'
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from 'recharts'
import { useStatement } from '../../hooks/useStatement'

const COLORS = ['#00ff88', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

interface SliceProps {
  cx: number; cy: number
  innerRadius: number; outerRadius: number
  startAngle: number; endAngle: number
  fill: string
  active: boolean
}

function ActiveSlice(props: SliceProps) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, active } = props
  return (
    <Sector
      cx={cx} cy={cy}
      innerRadius={innerRadius}
      outerRadius={active ? outerRadius + 8 : outerRadius}
      startAngle={startAngle} endAngle={endAngle}
      fill={fill}
      opacity={active ? 1 : 0.75}
      style={{ transition: 'all 0.15s ease', cursor: 'pointer' }}
    />
  )
}

export default function PortfolioPieChart() {
  const { merged, darkMode, masked } = useStatement()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  if (!merged) return null

  const stockData = merged.openPositions
    .filter(p => p.marketValue > 0)
    .map(p => ({ name: p.symbol, value: parseFloat(p.marketValue.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)

  // 把 Cash 作为一个条目加入（若存在）
  const cashValue = parseFloat((merged.cashBalance ?? 0).toFixed(2))
  const data = cashValue > 0
    ? [...stockData, { name: 'Cash', value: cashValue }]
    : stockData

  if (data.length === 0) return null

  const total = data.reduce((s, d) => s + d.value, 0)
  const active = activeIndex !== null ? data[activeIndex] : null
  const textColor = darkMode ? '#fff' : '#111827'
  const mutedColor = darkMode ? '#9ca3af' : '#6b7280'

  return (
    <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Portfolio Allocation</h3>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* 饼图 + 中心文字 */}
        <div className="relative shrink-0" style={{ width: 240, height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={68} outerRadius={108}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={(_, i) => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                activeShape={(props: any) => <ActiveSlice {...props} active={props.index === activeIndex} />}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* 中心信息：悬停时显示选中项，否则显示总市值 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {active ? (
              <>
                <span style={{ fontSize: 18, fontWeight: 800, color: COLORS[activeIndex! % COLORS.length], fontFamily: 'monospace' }}>
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
                <span style={{ fontSize: 14, fontWeight: 700, color: textColor, fontFamily: 'monospace' }}>
                  {masked ? '$***' : `$${total.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 图例：两列，含占比 */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 flex-1 w-full">
          {data.map((item, i) => {
            const pct = ((item.value / total) * 100).toFixed(1)
            const isActive = activeIndex === i
            return (
              <div
                key={item.name}
                className="flex items-center gap-2 cursor-default"
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                style={{ opacity: activeIndex !== null && !isActive ? 0.45 : 1, transition: 'opacity 0.15s' }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: textColor, fontFamily: 'monospace', minWidth: 44 }}>{item.name}</span>
                <span style={{ fontSize: 11, color: mutedColor }}>{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
