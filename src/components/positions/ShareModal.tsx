// src/components/positions/ShareModal.tsx
import type { TickerSummary } from '../../types/statement'

interface Props {
  ticker: TickerSummary
  onClose: () => void
}

export default function ShareModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl p-6" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="text-white">✕ Close</button>
      </div>
    </div>
  )
}
