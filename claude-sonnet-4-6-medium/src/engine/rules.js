import { COLORS } from './pieces.js'
import { findKing } from './board.js'
import { isSquareAttacked, getAllValidMoves } from './moves.js'

const { WHITE, BLACK } = COLORS

/**
 * Returns true if the given color's king is currently in check.
 */
export function isInCheck(board, color) {
  const kingPos = findKing(board, color)
  if (!kingPos) return false
  const enemy = color === WHITE ? BLACK : WHITE
  return isSquareAttacked(board, kingPos.row, kingPos.col, enemy)
}

/**
 * Returns true if the given color has no valid moves AND is in check.
 */
export function isCheckmate(board, color, gameState) {
  if (!isInCheck(board, color)) return false
  const moves = getAllValidMoves(board, color, gameState)
  return moves.length === 0
}

/**
 * Returns true if the given color has no valid moves AND is NOT in check.
 */
export function isStalemate(board, color, gameState) {
  if (isInCheck(board, color)) return false
  const moves = getAllValidMoves(board, color, gameState)
  return moves.length === 0
}
