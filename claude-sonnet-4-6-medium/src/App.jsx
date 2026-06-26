import { useState, useEffect } from 'react'
import Board from './components/Board.jsx'
import TurnIndicator from './components/TurnIndicator.jsx'
import CapturedPieces from './components/CapturedPieces.jsx'
import PromotionModal from './components/PromotionModal.jsx'
import {
  initialGameState,
  applyMove,
  applyPromotion,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from './engine/gameState.js'
import './App.css'

export default function App() {
  const [gameState, setGameState] = useState(() => {
    const saved = loadFromLocalStorage()
    return saved || initialGameState()
  })

  // Persist state on every change
  useEffect(() => {
    saveToLocalStorage(gameState)
  }, [gameState])

  function handleMove(from, move) {
    setGameState(prev => applyMove(prev, from, move))
  }

  function handlePromotion(pieceType) {
    setGameState(prev => applyPromotion(prev, pieceType))
  }

  function handleReset() {
    clearLocalStorage()
    setGameState(initialGameState())
  }

  const promotionColor = gameState.promotionPending
    ? gameState.board[gameState.promotionPending.row][gameState.promotionPending.col]?.color
    : null

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Chess</h1>
        <button className="reset-button" onClick={handleReset}>
          New Game
        </button>
      </header>

      <main className="app-main">
        <div className="game-layout">
          {/* Black player info at top */}
          <div className="player-section player-black">
            <span className="player-name">
              <span className="player-dot dot-black" /> Black
            </span>
            <CapturedPieces
              pieces={gameState.capturedByBlack}
              label="Captured"
            />
          </div>

          <div className="board-wrapper">
            <TurnIndicator
              turn={gameState.turn}
              isCheck={gameState.isCheck}
              isCheckmate={gameState.isCheckmate}
              isStalemate={gameState.isStalemate}
            />
            <Board
              gameState={gameState}
              onMove={handleMove}
              onPromotion={handlePromotion}
            />
          </div>

          {/* White player info at bottom */}
          <div className="player-section player-white">
            <span className="player-name">
              <span className="player-dot dot-white" /> White
            </span>
            <CapturedPieces
              pieces={gameState.capturedByWhite}
              label="Captured"
            />
          </div>
        </div>
      </main>

      {gameState.promotionPending && promotionColor && (
        <PromotionModal
          color={promotionColor}
          onChoose={handlePromotion}
        />
      )}
    </div>
  )
}
