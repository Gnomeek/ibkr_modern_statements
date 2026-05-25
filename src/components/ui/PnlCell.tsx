// src/components/ui/PnlCell.tsx
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
  const color = value >= 0 ? 'text-green-400' : 'text-red-400'
  return <span className={`font-mono ${color} ${className}`}>{fmt(value, format)}</span>
}
