import React from 'react'
import { GLYPHS } from '../pieces.js'

// Right-hand panel: turn indicator, status, captured pieces, move list, reset.
export default function Sidebar({ state, onReset }) {
  const { turn, status, winner, captured, history } = state

  let statusText
  if (status === 'checkmate') statusText = `Checkmate — ${winner === 'w' ? 'White' : 'Black'} wins`
  else if (status === 'stalemate') statusText = 'Stalemate — draw'
  else if (status === 'draw') statusText = 'Draw (fifty-move rule)'
  else if (status === 'check') statusText = 'Check!'
  else statusText = 'In progress'

  const gameOver = status === 'checkmate' || status === 'stalemate' || status === 'draw'

  // Pair history into numbered moves (white, black).
  const rows = []
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ n: i / 2 + 1, w: history[i], b: history[i + 1] })
  }

  return (
    <aside className="sidebar">
      <div className={`turn-indicator ${turn === 'w' ? 'white-turn' : 'black-turn'}`}>
        {gameOver ? (
          <span>Game over</span>
        ) : (
          <span>
            <span className="turn-dot" /> {turn === 'w' ? 'White' : 'Black'} to move
          </span>
        )}
      </div>

      <div className={`status ${status}`}>{statusText}</div>

      <CapturedRow label="Black captured" pieces={captured.b} color="b" />
      <CapturedRow label="White captured" pieces={captured.w} color="w" />

      <div className="moves">
        <h4>Moves</h4>
        <ol className="move-list">
          {rows.map((row) => (
            <li key={row.n}>
              <span className="move-num">{row.n}.</span>
              <span className="move-w">{row.w}</span>
              <span className="move-b">{row.b || ''}</span>
            </li>
          ))}
          {rows.length === 0 && <li className="empty">No moves yet</li>}
        </ol>
      </div>

      <button className="reset-btn" onClick={onReset}>
        Reset Game
      </button>
    </aside>
  )
}

function CapturedRow({ label, pieces, color }) {
  // Show captured pieces sorted by value, heaviest first.
  const order = { q: 0, r: 1, b: 2, n: 3, p: 4 }
  const sorted = [...pieces].sort((a, b) => order[a] - order[b])
  return (
    <div className="captured">
      <span className="captured-label">{label}</span>
      <span className="captured-pieces">
        {sorted.length === 0
          ? '—'
          : sorted.map((t, i) => (
              <span key={i} className={color === 'w' ? 'white-piece' : 'black-piece'}>
                {GLYPHS[color + t]}
              </span>
            ))}
      </span>
    </div>
  )
}
