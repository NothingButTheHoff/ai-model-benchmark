import { useState, useEffect } from 'react'
import './App.css'
import Board from './components/Board'
import { Game } from './chess/game'
import { PIECE_TYPES, COLORS } from './chess/piece'

function App() {
  const [game, setGame] = useState(null)
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [validMoves, setValidMoves] = useState([])
  const [promotionPending, setPromotionPending] = useState(null)

  // Initialize game
  useEffect(() => {
    const saved = localStorage.getItem('chessGame')
    if (saved) {
      const gameData = JSON.parse(saved)
      const newGame = new Game()
      newGame.fromJSON(gameData)
      setGame(newGame)
    } else {
      setGame(new Game())
    }
  }, [])

  // Persist game
  useEffect(() => {
    if (game) {
      localStorage.setItem('chessGame', JSON.stringify(game.toJSON()))
    }
  }, [game])

  const getPieceEmoji = (type, color) => {
    const pieces = {
      [COLORS.WHITE]: {
        [PIECE_TYPES.PAWN]: '♙',
        [PIECE_TYPES.KNIGHT]: '♘',
        [PIECE_TYPES.BISHOP]: '♗',
        [PIECE_TYPES.ROOK]: '♖',
        [PIECE_TYPES.QUEEN]: '♕',
        [PIECE_TYPES.KING]: '♔'
      },
      [COLORS.BLACK]: {
        [PIECE_TYPES.PAWN]: '♟',
        [PIECE_TYPES.KNIGHT]: '♞',
        [PIECE_TYPES.BISHOP]: '♝',
        [PIECE_TYPES.ROOK]: '♜',
        [PIECE_TYPES.QUEEN]: '♛',
        [PIECE_TYPES.KING]: '♚'
      }
    }
    return pieces[color][type]
  }

  const handleSquareClick = (row, col) => {
    if (!game || promotionPending) return

    const piece = game.board.getSquare(row, col)

    if (selectedSquare && validMoves.some(m => m.row === row && m.col === col)) {
      const fromPiece = game.board.getSquare(selectedSquare.row, selectedSquare.col)

      if (fromPiece.type === PIECE_TYPES.PAWN && (row === 0 || row === 7)) {
        setPromotionPending({ row, col })
      } else {
        const newGame = game.toJSON()
        game.makeMove(selectedSquare.row, selectedSquare.col, row, col)
        setGame({ ...game })
        setSelectedSquare(null)
        setValidMoves([])
      }
    } else if (piece && piece.color === game.turn) {
      setSelectedSquare({ row, col })
      setValidMoves(game.getValidMoves(row, col))
    } else {
      setSelectedSquare(null)
      setValidMoves([])
    }
  }

  const handlePromotion = (promotionType) => {
    if (!promotionPending || !selectedSquare) return
    game.makeMove(selectedSquare.row, selectedSquare.col, promotionPending.row, promotionPending.col, promotionType)
    setGame({ ...game })
    setSelectedSquare(null)
    setValidMoves([])
    setPromotionPending(null)
  }

  const resetGame = () => {
    const newGame = new Game()
    setGame(newGame)
    setSelectedSquare(null)
    setValidMoves([])
  }

  const getCapturedPieces = (color) => {
    const captured = []
    const startCount = {
      [PIECE_TYPES.PAWN]: 8,
      [PIECE_TYPES.KNIGHT]: 2,
      [PIECE_TYPES.BISHOP]: 2,
      [PIECE_TYPES.ROOK]: 2,
      [PIECE_TYPES.QUEEN]: 1,
      [PIECE_TYPES.KING]: 0
    }

    for (const move of game.moveHistory) {
      if (move.captured && move.captured.color === color) {
        captured.push(move.captured)
      }
    }

    return captured
  }

  if (!game) return <div className="app">Loading...</div>

  const status = game.getGameStatus()
  const isGameOver = status === 'checkmate' || status === 'stalemate'

  const statusClass = status === 'checkmate' ? 'checkmate' : status === 'stalemate' ? 'stalemate' : status === 'check' ? 'check' : game.turn

  return (
    <div className="app">
      <h1>Chess</h1>
      <div className="container">
        <div className="board-section">
          <div className={`status ${statusClass}`}>
            {status === 'checkmate' ? `Checkmate! ${game.turn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE} wins` : status === 'stalemate' ? 'Stalemate - Draw!' : status === 'check' ? `Check! ${game.turn}'s turn` : `${game.turn}'s turn`}
          </div>
          <Board
            game={game}
            selectedSquare={selectedSquare}
            validMoves={validMoves}
            onSquareClick={handleSquareClick}
            getPieceEmoji={getPieceEmoji}
          />
        </div>
        <div className="info-panel">
          <div className="captured">
            <h3>White Captured</h3>
            <div className="captured-pieces">
              {getCapturedPieces(COLORS.WHITE).map((p, i) => (
                <div key={i} className="captured-piece">{getPieceEmoji(p.type, COLORS.BLACK)}</div>
              ))}
            </div>
          </div>
          <div className="captured">
            <h3>Black Captured</h3>
            <div className="captured-pieces">
              {getCapturedPieces(COLORS.BLACK).map((p, i) => (
                <div key={i} className="captured-piece">{getPieceEmoji(p.type, COLORS.WHITE)}</div>
              ))}
            </div>
          </div>
          <div className="button-group">
            <button onClick={resetGame} disabled={!isGameOver && game.moveHistory.length === 0}>
              {isGameOver ? 'New Game' : 'Reset'}
            </button>
          </div>
          <div className="move-history">
            <h3>Move History</h3>
            <ul className="move-list">
              {game.moveHistory.map((move, i) => {
                const fromSquare = String.fromCharCode(97 + move.fromCol) + (8 - move.fromRow)
                const toSquare = String.fromCharCode(97 + move.toCol) + (8 - move.toRow)
                return <li key={i}>{i + 1}. {fromSquare} → {toSquare}</li>
              })}
            </ul>
          </div>
        </div>
      </div>

      {promotionPending && (
        <div className="promotion-modal">
          <div className="promotion-content">
            <h2>Promote Pawn</h2>
            <div className="promotion-options">
              <button className="promotion-button" onClick={() => handlePromotion(PIECE_TYPES.QUEEN)}>♕</button>
              <button className="promotion-button" onClick={() => handlePromotion(PIECE_TYPES.ROOK)}>♖</button>
              <button className="promotion-button" onClick={() => handlePromotion(PIECE_TYPES.BISHOP)}>♗</button>
              <button className="promotion-button" onClick={() => handlePromotion(PIECE_TYPES.KNIGHT)}>♘</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
