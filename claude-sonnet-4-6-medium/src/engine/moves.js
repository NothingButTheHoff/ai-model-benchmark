import { PIECES, COLORS } from './pieces.js'
import { cloneBoard, inBounds, findKing } from './board.js'

const { PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING } = PIECES
const { WHITE, BLACK } = COLORS

/**
 * Get raw moves (ignoring check) for a piece at (row, col).
 */
function getRawMoves(board, row, col, gameState) {
  const piece = board[row][col]
  if (!piece) return []

  const moves = []
  const { color, type } = piece
  const enemy = color === WHITE ? BLACK : WHITE

  const addMove = (toRow, toCol, special) => {
    if (!inBounds(toRow, toCol)) return false
    const target = board[toRow][toCol]
    if (target && target.color === color) return false // blocked by own piece
    moves.push({ toRow, toCol, ...(special ? { special } : {}) })
    return !target // return true if square was empty (for sliding pieces to continue)
  }

  switch (type) {
    case PAWN: {
      const dir = color === WHITE ? -1 : 1
      const startRow = color === WHITE ? 6 : 1
      const promotionRow = color === WHITE ? 0 : 7

      // Forward one square
      const oneForward = row + dir
      if (inBounds(oneForward, col) && !board[oneForward][col]) {
        const isPromotion = oneForward === promotionRow
        moves.push({ toRow: oneForward, toCol: col, ...(isPromotion ? { special: 'promotion' } : {}) })

        // Forward two squares from start
        if (row === startRow) {
          const twoForward = row + 2 * dir
          if (inBounds(twoForward, col) && !board[twoForward][col]) {
            moves.push({ toRow: twoForward, toCol: col })
          }
        }
      }

      // Diagonal captures
      for (const dc of [-1, 1]) {
        const captureRow = row + dir
        const captureCol = col + dc
        if (!inBounds(captureRow, captureCol)) continue

        const target = board[captureRow][captureCol]
        if (target && target.color === enemy) {
          const isPromotion = captureRow === promotionRow
          moves.push({ toRow: captureRow, toCol: captureCol, ...(isPromotion ? { special: 'promotion' } : {}) })
        }

        // En passant
        const ep = gameState?.enPassantTarget
        if (ep && ep.row === captureRow && ep.col === captureCol) {
          moves.push({ toRow: captureRow, toCol: captureCol, special: 'enPassant' })
        }
      }
      break
    }

    case KNIGHT: {
      const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ]
      for (const [dr, dc] of knightMoves) {
        addMove(row + dr, col + dc)
      }
      break
    }

    case BISHOP: {
      const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      for (const [dr, dc] of dirs) {
        let r = row + dr, c = col + dc
        while (inBounds(r, c)) {
          const canContinue = addMove(r, c)
          if (!canContinue) break
          r += dr
          c += dc
        }
      }
      break
    }

    case ROOK: {
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
      for (const [dr, dc] of dirs) {
        let r = row + dr, c = col + dc
        while (inBounds(r, c)) {
          const canContinue = addMove(r, c)
          if (!canContinue) break
          r += dr
          c += dc
        }
      }
      break
    }

    case QUEEN: {
      const dirs = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ]
      for (const [dr, dc] of dirs) {
        let r = row + dr, c = col + dc
        while (inBounds(r, c)) {
          const canContinue = addMove(r, c)
          if (!canContinue) break
          r += dr
          c += dc
        }
      }
      break
    }

    case KING: {
      const dirs = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ]
      for (const [dr, dc] of dirs) {
        addMove(row + dr, col + dc)
      }

      // Castling
      if (gameState) {
        const rights = gameState.castlingRights?.[color]
        const backRow = color === WHITE ? 7 : 0

        if (rights?.kingside) {
          const f = board[backRow][5]
          const g = board[backRow][6]
          if (!f && !g) {
            moves.push({ toRow: backRow, toCol: 6, special: 'castleKingside' })
          }
        }

        if (rights?.queenside) {
          const b = board[backRow][1]
          const c = board[backRow][2]
          const d = board[backRow][3]
          if (!b && !c && !d) {
            moves.push({ toRow: backRow, toCol: 2, special: 'castleQueenside' })
          }
        }
      }
      break
    }
  }

  return moves
}

/**
 * Check if a square is attacked by any enemy piece.
 */
export function isSquareAttacked(board, row, col, byColor) {
  // Check all enemy pieces to see if they attack (row, col)
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (!piece || piece.color !== byColor) continue

      // Get raw attacks from this piece (without gameState to avoid infinite recursion)
      const attacks = getRawMoves(board, r, c, null)
      if (attacks.some(m => m.toRow === row && m.toCol === col)) {
        return true
      }
    }
  }
  return false
}

/**
 * Apply a move to the board and return the new board (does not mutate).
 * This is used for check-testing only.
 */
function applyMoveToBoard(board, fromRow, fromCol, move) {
  const newBoard = cloneBoard(board)
  const piece = newBoard[fromRow][fromCol]

  newBoard[move.toRow][move.toCol] = piece
  newBoard[fromRow][fromCol] = null

  if (move.special === 'enPassant') {
    const capturedPawnRow = fromRow // same row as moving pawn
    newBoard[capturedPawnRow][move.toCol] = null
  }

  if (move.special === 'castleKingside') {
    const backRow = move.toRow
    newBoard[backRow][5] = newBoard[backRow][7]
    newBoard[backRow][7] = null
  }

  if (move.special === 'castleQueenside') {
    const backRow = move.toRow
    newBoard[backRow][3] = newBoard[backRow][0]
    newBoard[backRow][0] = null
  }

  return newBoard
}

/**
 * Get valid moves for a piece at (row, col), filtering out moves that leave own king in check.
 * Also validates castling (can't castle through check).
 */
export function getValidMoves(board, row, col, gameState) {
  const piece = board[row][col]
  if (!piece) return []

  const { color } = piece
  const enemy = color === WHITE ? BLACK : WHITE
  const rawMoves = getRawMoves(board, row, col, gameState)
  const validMoves = []

  for (const move of rawMoves) {
    // For castling, additional check restrictions apply
    if (move.special === 'castleKingside' || move.special === 'castleQueenside') {
      // King must not currently be in check
      const kingPos = findKing(board, color)
      if (!kingPos) continue
      if (isSquareAttacked(board, kingPos.row, kingPos.col, enemy)) continue

      // King must not pass through check
      const backRow = move.toRow
      const passThroughCol = move.special === 'castleKingside' ? 5 : 3
      if (isSquareAttacked(board, backRow, passThroughCol, enemy)) continue

      // King must not land in check
      const afterBoard = applyMoveToBoard(board, row, col, move)
      const newKingPos = findKing(afterBoard, color)
      if (!newKingPos) continue
      if (isSquareAttacked(afterBoard, newKingPos.row, newKingPos.col, enemy)) continue

      validMoves.push(move)
      continue
    }

    // For all other moves: apply move and check if own king is in check
    const afterBoard = applyMoveToBoard(board, row, col, move)
    const kingPos = findKing(afterBoard, color)
    if (!kingPos) continue

    if (!isSquareAttacked(afterBoard, kingPos.row, kingPos.col, enemy)) {
      validMoves.push(move)
    }
  }

  return validMoves
}

/**
 * Get all valid moves for a color (used for checkmate/stalemate detection).
 */
export function getAllValidMoves(board, color, gameState) {
  const allMoves = []
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (!piece || piece.color !== color) continue
      const moves = getValidMoves(board, r, c, gameState)
      for (const move of moves) {
        allMoves.push({ fromRow: r, fromCol: c, ...move })
      }
    }
  }
  return allMoves
}
