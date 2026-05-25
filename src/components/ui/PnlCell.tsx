// src/components/ui/PnlCell.tsx
import { useStatement } from '@/hooks/useStatement'

interface Props {
  value: number
  format?: 'currency' | 'percent'
  className?: string
}

function fmt(value: number, format: 'currency' | 'percent') {
  if (format === 'percent') {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }
  return `${value >= 0 ? '+' : ''}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function PnlCell({ value, format = 'currency', className = '' }: Props) {
  const { masked } = useStatement()
  const color = value >= 0 ? 'text-green-400' : 'text-red-400'
  // Percentages are never masked — return rates reveal no absolute amounts
  const display =
    masked && format === 'currency' ? (value >= 0 ? '+***' : '-***') : fmt(value, format)
  return <span className={`font-mono ${color} ${className}`}>{display}</span>
}
