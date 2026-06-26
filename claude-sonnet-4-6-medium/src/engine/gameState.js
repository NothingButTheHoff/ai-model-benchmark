import { PIECES, COLORS } from './pieces.js'
import { initialBoard, cloneBoard } from './board.js'
import { isInCheck, isCheckmate, isStalemate } from './rules.js'

const { PAWN, ROOK, KING } = PIECES
const { WHITE, BLACK } = COLORS

const STORAGE_KEY = 'chess-game-state'

export function initialGameState() {
  return {
    board: initialBoard(),
    turn: WHITE,
    capturedByWhite: [], // black pieces captured by white
    capturedByBlack: [], // white pieces captured by black
    enPassantTarget: null, // { row, col } of the capturable en passant square
    castlingRights: {
      w: { kingside: true, queenside: true },
      b: { kingside: true, queenside: true },
    },
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    moveHistory: [],
    promotionPending: null, // { row, col } if pawn reached last rank
  }
}

export function saveToLocalStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Failed to save chess state to localStorage:', e)
  }
}

export function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Basic validation
    if (!parsed.board || !parsed.turn || !parsed.castlingRights) return null
    return parsed
  } catch (e) {
    console.warn('Failed to load chess state from localStorage:', e)
    return null
  }
}

export function clearLocalStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    // ignore
  }
}

/**
 * Apply a move to the game state. Returns a new state (immutable).
 * from: { row, col }
 * move: { toRow, toCol, special? }
 */
export function applyMove(state, from, move) {
  const board = cloneBoard(state.board)
  const piece = board[from.row][from.col]
  if (!piece) return state

  const { color } = piece
  const enemy = color === WHITE ? BLACK : WHITE

  const newCapturedByWhite = [...state.capturedByWhite]
  const newCapturedByBlack = [...state.capturedByBlack]
  const newCastlingRights = {
    w: { ...state.castlingRights.w },
    b: { ...state.castlingRights.b },
  }

  // Track captured piece (normal capture)
  const captured = board[move.toRow][move.toCol]
  if (captured) {
    if (color === WHITE) {
      newCapturedByWhite.push(captured)
    } else {
      newCapturedByBlack.push(captured)
    }
  }

  // Move piece
  board[move.toRow][move.toCol] = piece
  board[from.row][from.col] = null

  // En passant capture
  let enPassantCaptured = null
  if (move.special === 'enPassant') {
    // The captured pawn is on the same row as the moving pawn, in the destination column
    const capturedPawnRow = from.row
    enPassantCaptured = board[capturedPawnRow][move.toCol]
    board[capturedPawnRow][move.toCol] = null
    if (enPassantCaptured) {
      if (color === WHITE) {
        newCapturedByWhite.push(enPassantCaptured)
      } else {
        newCapturedByBlack.push(enPassantCaptured)
      }
    }
  }

  // Castling: move rook too
  if (move.special === 'castleKingside') {
    const backRow = move.toRow
    board[backRow][5] = board[backRow][7]
    board[backRow][7] = null
  }
  if (move.special === 'castleQueenside') {
    const backRow = move.toRow
    board[backRow][3] = board[backRow][0]
    board[backRow][0] = null
  }

  // Update castling rights
  if (piece.type === KING) {
    newCastlingRights[color].kingside = false
    newCastlingRights[color].queenside = false
  }
  if (piece.type === ROOK) {
    const backRow = color === WHITE ? 7 : 0
    if (from.row === backRow) {
      if (from.col === 7) newCastlingRights[color].kingside = false
      if (from.col === 0) newCastlingRights[color].queenside = false
    }
  }
  // If a rook is captured, revoke castling right for that rook
  if (captured && captured.type === ROOK) {
    const enemyBackRow = enemy === WHITE ? 7 : 0
    if (move.toRow === enemyBackRow) {
      if (move.toCol === 7) newCastlingRights[enemy].kingside = false
      if (move.toCol === 0) newCastlingRights[enemy].queenside = false
    }
  }

  // Update en passant target
  let newEnPassantTarget = null
  if (piece.type === PAWN && Math.abs(move.toRow - from.row) === 2) {
    // Pawn double push — set en passant target to the square behind the pawn
    const epRow = (from.row + move.toRow) / 2
    newEnPassantTarget = { row: epRow, col: from.col }
  }

  // Promotion pending?
  let promotionPending = null
  const promotionRow = color === WHITE ? 0 : 7
  if (piece.type === PAWN && move.toRow === promotionRow) {
    promotionPending = { row: move.toRow, col: move.toCol }
  }

  // Build move history entry
  const historyEntry = {
    from: { row: from.row, col: from.col },
    to: { row: move.toRow, col: move.toCol },
    piece: { ...piece },
    captured: captured || enPassantCaptured || null,
    special: move.special || null,
  }

  // Compute next turn (don't switch if promotion pending — wait for choice)
  const nextTurn = promotionPending ? color : enemy

  // Compute new state for check/checkmate/stalemate (only after promotion is resolved)
  let newIsCheck = false
  let newIsCheckmate = false
  let newIsStalemate = false

  if (!promotionPending) {
    const tempState = {
      enPassantTarget: newEnPassantTarget,
      castlingRights: newCastlingRights,
    }
    newIsCheck = isInCheck(board, nextTurn)
    newIsCheckmate = isCheckmate(board, nextTurn, tempState)
    newIsStalemate = isStalemate(board, nextTurn, tempState)
  }

  return {
    ...state,
    board,
    turn: nextTurn,
    capturedByWhite: newCapturedByWhite,
    capturedByBlack: newCapturedByBlack,
    enPassantTarget: newEnPassantTarget,
    castlingRights: newCastlingRights,
    isCheck: newIsCheck,
    isCheckmate: newIsCheckmate,
    isStalemate: newIsStalemate,
    moveHistory: [...state.moveHistory, historyEntry],
    promotionPending,
  }
}

/**
 * Complete a pawn promotion. Returns new state with promotion applied.
 * pieceType: one of 'Q', 'R', 'B', 'N'
 */
export function applyPromotion(state, pieceType) {
  if (!state.promotionPending) return state

  const { row, col } = state.promotionPending
  const board = cloneBoard(state.board)
  const piece = board[row][col]
  if (!piece) return state

  board[row][col] = { type: pieceType, color: piece.color }

  const color = piece.color
  const enemy = color === WHITE ? BLACK : WHITE

  const tempState = {
    enPassantTarget: state.enPassantTarget,
    castlingRights: state.castlingRights,
  }

  const nextTurn = enemy
  const newIsCheck = isInCheck(board, nextTurn)
  const newIsCheckmate = isCheckmate(board, nextTurn, tempState)
  const newIsStalemate = isStalemate(board, nextTurn, tempState)

  return {
    ...state,
    board,
    turn: nextTurn,
    isCheck: newIsCheck,
    isCheckmate: newIsCheckmate,
    isStalemate: newIsStalemate,
    promotionPending: null,
  }
}
