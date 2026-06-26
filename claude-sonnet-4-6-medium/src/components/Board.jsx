import { useState, useCallback } from 'react'
import Square from './Square.jsx'
import { getValidMoves } from '../engine/moves.js'
import { findKing } from '../engine/board.js'
import { PIECES } from '../engine/pieces.js'

const { KING } = PIECES

export default function Board({ gameState, onMove, onPromotion }) {
  const [selected, setSelected] = useState(null) // { row, col } or null
  const [validMoves, setValidMoves] = useState([]) // [{ toRow, toCol, special? }]

  const { board, turn, isCheck, isCheckmate, isStalemate, promotionPending } = gameState

  // Find king in check position for highlighting
  const kingInCheckPos = isCheck ? findKing(board, turn) : null

  const handleSquareClick = useCallback((row, col) => {
    // Don't allow moves if game over or promotion pending
    if (isCheckmate || isStalemate || promotionPending) return

    const piece = board[row][col]

    // If a piece is already selected
    if (selected) {
      // Check if clicked square is a valid move target
      const move = validMoves.find(m => m.toRow === row && m.toCol === col)

      if (move) {
        // Execute the move
        onMove({ row: selected.row, col: selected.col }, move)
        setSelected(null)
        setValidMoves([])
        return
      }

      // Clicked own piece — switch selection
      if (piece && piece.color === turn) {
        if (selected.row === row && selected.col === col) {
          // Deselect
          setSelected(null)
          setValidMoves([])
        } else {
          // Select new piece
          setSelected({ row, col })
          setValidMoves(getValidMoves(board, row, col, gameState))
        }
        return
      }

      // Clicked empty or enemy square that isn't a valid move — deselect
      setSelected(null)
      setValidMoves([])
      return
    }

    // No piece selected yet — select if it's the current player's piece
    if (piece && piece.color === turn) {
      setSelected({ row, col })
      setValidMoves(getValidMoves(board, row, col, gameState))
    }
  }, [board, selected, validMoves, turn, isCheckmate, isStalemate, promotionPending, gameState, onMove])

  const validMoveSet = new Set(validMoves.map(m => `${m.toRow},${m.toCol}`))

  return (
    <div className="board" role="grid" aria-label="Chess board">
      {board.map((rowArr, row) =>
        rowArr.map((piece, col) => {
          const isSelected = selected?.row === row && selected?.col === col
          const isValidMove = validMoveSet.has(`${row},${col}`)
          const isCapture = isValidMove && (
            board[row][col] !== null ||
            validMoves.find(m => m.toRow === row && m.toCol === col)?.special === 'enPassant'
          )
          const isCheckSquare = kingInCheckPos?.row === row && kingInCheckPos?.col === col

          return (
            <Square
              key={`${row}-${col}`}
              row={row}
              col={col}
              piece={piece}
              isSelected={isSelected}
              isValidMove={isValidMove}
              isCapture={isCapture}
              isCheck={isCheckSquare}
              onClick={() => handleSquareClick(row, col)}
            />
          )
        })
      )}
    </div>
  )
}
