import { useEffect, useState } from 'react'
import { initialState, legalMovesFor, applyMove, WHITE } from './engine.js'

const GLYPH = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
}
const STORAGE_KEY = 'browser-chess-state-v1'
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore corrupt storage */
  }
  return initialState()
}

export default function App() {
  const [state, setState] = useState(loadState)
  const [selected, setSelected] = useState(null) // {r,c}
  const [moves, setMoves] = useState([]) // legal moves for selected
  const [promo, setPromo] = useState(null) // pending promotion move

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore quota errors */
    }
  }, [state])

  const gameOver = state.status === 'checkmate' || state.status === 'stalemate'

  function selectSquare(r, c) {
    if (gameOver || promo) return
    const piece = state.board[r][c]
    // clicking a legal destination -> move
    const target = moves.find((m) => m.to.r === r && m.to.c === c)
    if (selected && target) {
      if (target.promotion) {
        setPromo(target)
        return
      }
      doMove(target)
      return
    }
    // select own piece
    if (piece && piece.color === state.turn) {
      setSelected({ r, c })
      setMoves(legalMovesFor(state, r, c))
    } else {
      setSelected(null)
      setMoves([])
    }
  }

  function doMove(move, promotionPiece = 'q') {
    setState(applyMove(state, move, promotionPiece))
    setSelected(null)
    setMoves([])
    setPromo(null)
  }

  function reset() {
    setState(initialState())
    setSelected(null)
    setMoves([])
    setPromo(null)
  }

  const turnName = state.turn === WHITE ? 'White' : 'Black'
  let statusText
  if (state.status === 'checkmate') statusText = `Checkmate — ${state.winner === WHITE ? 'White' : 'Black'} wins`
  else if (state.status === 'stalemate') statusText = 'Stalemate — draw'
  else if (state.status === 'check') statusText = `${turnName} to move — Check!`
  else statusText = `${turnName} to move`

  return (
    <div className="app">
      <h1>Browser Chess</h1>
      <div className={`status ${state.status}`}>{statusText}</div>

      <div className="captured">
        <span>Black captured: {state.captured.b.map((t) => GLYPH.w[t]).join(' ') || '—'}</span>
        <span>White captured: {state.captured.w.map((t) => GLYPH.b[t]).join(' ') || '—'}</span>
      </div>

      <div className="board">
        {state.board.map((row, r) =>
          row.map((piece, c) => {
            const light = (r + c) % 2 === 0
            const isSel = selected && selected.r === r && selected.c === c
            const move = moves.find((m) => m.to.r === r && m.to.c === c)
            const cls = [
              'square',
              light ? 'light' : 'dark',
              isSel ? 'selected' : '',
              move ? (piece ? 'capture' : 'movehint') : '',
            ].join(' ')
            return (
              <div key={`${r}-${c}`} className={cls} onClick={() => selectSquare(r, c)}>
                {piece && <span className="piece">{GLYPH[piece.color][piece.type]}</span>}
                {c === 0 && <span className="coord rank">{8 - r}</span>}
                {r === 7 && <span className="coord file">{FILES[c]}</span>}
              </div>
            )
          }),
        )}
      </div>

      <button className="reset" onClick={reset}>Reset Game</button>

      {promo && (
        <div className="promo-overlay" onClick={() => setPromo(null)}>
          <div className="promo" onClick={(e) => e.stopPropagation()}>
            <p>Promote to:</p>
            <div className="promo-choices">
              {['q', 'r', 'b', 'n'].map((t) => (
                <button key={t} onClick={() => doMove(promo, t)}>
                  {GLYPH[state.turn][t]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
