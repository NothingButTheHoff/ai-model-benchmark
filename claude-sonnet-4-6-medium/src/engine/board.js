import { PIECES, COLORS } from './pieces.js'

const { PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING } = PIECES
const { WHITE, BLACK } = COLORS

/**
 * Create the initial board state.
 * Row 0 = rank 8 (black pieces), Row 7 = rank 1 (white pieces)
 * Each cell: null or { type, color }
 */
export function initialBoard() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null))

  // Black pieces on row 0
  const backRank = [ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK]
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRank[col], color: BLACK }
    board[1][col] = { type: PAWN, color: BLACK }
  }

  // White pieces on row 7
  for (let col = 0; col < 8; col++) {
    board[6][col] = { type: PAWN, color: WHITE }
    board[7][col] = { type: backRank[col], color: WHITE }
  }

  return board
}

/**
 * Deep-clone a board so mutations don't affect the original.
 */
export function cloneBoard(board) {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)))
}

/**
 * Check if a position is within board bounds.
 */
export function inBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8
}

/**
 * Find king position for a given color.
 * Returns { row, col } or null.
 */
export function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece && piece.type === KING && piece.color === color) {
        return { row: r, col: c }
      }
    }
  }
  return null
}
