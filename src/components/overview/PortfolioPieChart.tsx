// src/components/overview/PortfolioPieChart.tsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useStatement } from '../../hooks/useStatement'

const COLORS = ['#00ff88', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

export default function PortfolioPieChart() {
  const { merged, darkMode } = useStatement()
  if (!merged) return null

  const data = merged.openPositions
    .filter(p => p.marketValue > 0)
    .map(p => ({ name: p.symbol, value: parseFloat(p.marketValue.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) return null

  return (
    <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Portfolio Allocation</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value">
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => [`$${Number(v).toLocaleString()}`, '']}
            contentStyle={{ background: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: 8 }}
          />
          <Legend formatter={(name: string) => <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{name}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
