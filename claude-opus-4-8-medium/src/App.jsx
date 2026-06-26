import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Board from './components/Board.jsx'
import Sidebar from './components/Sidebar.jsx'
import PromotionDialog from './components/PromotionDialog.jsx'
import {
  initialState,
  getLegalMoves,
  applyMove,
  findKing,
  isInCheck,
  deserialize,
  serialize,
} from './engine/chess.js'

const STORAGE_KEY = 'browser-chess-state-v1'

// Load persisted game from localStorage, falling back to a fresh game.
function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = deserialize(raw)
      if (parsed) return parsed
    }
  } catch {
    // ignore corrupt/unavailable storage
  }
  return initialState()
}

export default function App() {
  const [state, setState] = useState(loadInitial)
  const [selected, setSelected] = useState(null) // {r,c} of selected piece
  const [legalMoves, setLegalMoves] = useState([])
  const [lastMove, setLastMove] = useState(null)
  const [promotion, setPromotion] = useState(null) // { from, to, color }

  // Persist on every state change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serialize(state))
    } catch {
      // storage may be full or disabled — non-fatal
    }
  }, [state])

  const gameOver =
    state.status === 'checkmate' ||
    state.status === 'stalemate' ||
    state.status === 'draw'

  // Square of the king in check (for highlighting).
  const checkSquare = useMemo(() => {
    if (state.status !== 'check' && state.status !== 'checkmate') return null
    if (!isInCheck(state.board, state.turn)) return null
    return findKing(state.board, state.turn)
  }, [state])

  const commitMove = useCallback(
    (move) => {
      setState((prev) => applyMove(prev, move))
      setLastMove({ from: move.from, to: move.to })
      setSelected(null)
      setLegalMoves([])
    },
    []
  )

  const handleSquareClick = useCallback(
    (r, c) => {
      if (gameOver || promotion) return
      const piece = state.board[r][c]

      // If a piece is already selected, try to move it to the clicked square.
      if (selected) {
        const move = legalMoves.find((m) => m.to.r === r && m.to.c === c)
        if (move) {
          // Promotion: collect the four candidate moves for this target.
          if (move.flags?.promotion) {
            setPromotion({
              from: move.from,
              to: move.to,
              color: state.turn,
            })
            return
          }
          commitMove(move)
          return
        }
        // Clicking own another piece reselects it.
        if (piece && piece.color === state.turn) {
          selectSquare(r, c)
          return
        }
        // Otherwise deselect.
        setSelected(null)
        setLegalMoves([])
        return
      }

      // No selection yet: select if it's the player's own piece.
      if (piece && piece.color === state.turn) selectSquare(r, c)
    },
    [state, selected, legalMoves, gameOver, promotion, commitMove]
  )

  function selectSquare(r, c) {
    setSelected({ r, c })
    setLegalMoves(getLegalMoves(state, r, c))
  }

  function handlePromotionSelect(type) {
    const move = legalMoves.find(
      (m) =>
        m.to.r === promotion.to.r &&
        m.to.c === promotion.to.c &&
        m.flags?.promotion === type
    )
    setPromotion(null)
    if (move) commitMove(move)
  }

  function handleReset() {
    const fresh = initialState()
    setState(fresh)
    setSelected(null)
    setLegalMoves([])
    setLastMove(null)
    setPromotion(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>♞ Browser Chess</h1>
        <p className="subtitle">Two-player · custom engine · no chess libraries</p>
      </header>

      <main className="layout">
        <div className="board-wrap">
          <Board
            board={state.board}
            selected={selected}
            legalTargets={legalMoves}
            checkSquare={checkSquare}
            lastMove={lastMove}
            onSquareClick={handleSquareClick}
          />
        </div>

        <Sidebar state={state} onReset={handleReset} />
      </main>

      {promotion && (
        <PromotionDialog
          color={promotion.color}
          onSelect={handlePromotionSelect}
          onCancel={() => setPromotion(null)}
        />
      )}
    </div>
  )
}
