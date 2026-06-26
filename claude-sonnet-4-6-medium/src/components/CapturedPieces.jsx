import { getSymbol } from '../engine/pieces.js'

export default function CapturedPieces({ pieces, label }) {
  // Sort captured pieces for display: Q, R, B, N, P order
  const order = { Q: 0, R: 1, B: 2, N: 3, P: 4 }
  const sorted = [...pieces].sort((a, b) => (order[a.type] ?? 5) - (order[b.type] ?? 5))

  return (
    <div className="captured-pieces">
      <span className="captured-label">{label}:</span>
      <span className="captured-symbols">
        {sorted.length === 0
          ? <span className="captured-empty">—</span>
          : sorted.map((p, i) => (
            <span key={i} className={`captured-piece piece-${p.color}`}>
              {getSymbol(p)}
            </span>
          ))
        }
      </span>
    </div>
  )
}
