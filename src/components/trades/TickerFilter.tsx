// src/components/trades/TickerFilter.tsx
interface Props {
  symbols: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  dark: boolean
}

export default function TickerFilter({ symbols, selected, onChange, dark }: Props) {
  function toggle(sym: string) {
    onChange(selected.includes(sym) ? selected.filter((s) => s !== sym) : [...selected, sym])
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {symbols.map((sym) => (
        <button
          key={sym}
          onClick={() => toggle(sym)}
          className={`text-xs px-2 py-1 rounded font-mono transition-colors ${
            selected.includes(sym)
              ? 'bg-green-500 text-black'
              : dark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {sym}
        </button>
      ))}
    </div>
  )
}
