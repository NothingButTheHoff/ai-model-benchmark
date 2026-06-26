// Chess engine — written from scratch, no external libraries.
//
// Board representation: an 8x8 array `board[r][c]`.
//   - row 0 is rank 8 (black's back rank, top of the screen)
//   - row 7 is rank 1 (white's back rank, bottom of the screen)
//   - col 0 is file 'a', col 7 is file 'h'
// White pieces move toward smaller row indices (up), black toward larger.
//
// A piece is { type, color } where:
//   type  ∈ 'p','n','b','r','q','k'
//   color ∈ 'w','b'

export const WHITE = 'w'
export const BLACK = 'b'

const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8

export function opposite(color) {
  return color === WHITE ? BLACK : WHITE
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export function initialBoard() {
  const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
  const board = Array.from({ length: 8 }, () => Array(8).fill(null))
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: back[c], color: BLACK }
    board[1][c] = { type: 'p', color: BLACK }
    board[6][c] = { type: 'p', color: WHITE }
    board[7][c] = { type: back[c], color: WHITE }
  }
  return board
}

export function initialState() {
  return {
    board: initialBoard(),
    turn: WHITE,
    // Castling availability flags.
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    // En passant target square {r,c} that can be captured this turn, else null.
    enPassant: null,
    halfmove: 0, // for fifty-move rule
    fullmove: 1,
    // Move history of SAN-ish entries for the UI; not used by the engine logic.
    history: [],
    // Captured pieces, grouped by the color that lost them.
    captured: { w: [], b: [] },
    status: 'ongoing', // 'ongoing' | 'check' | 'checkmate' | 'stalemate' | 'draw'
    winner: null, // 'w' | 'b' | null
  }
}

// ---------------------------------------------------------------------------
// Cloning helpers
// ---------------------------------------------------------------------------

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)))
}

export function cloneState(state) {
  return {
    board: cloneBoard(state.board),
    turn: state.turn,
    castling: { ...state.castling },
    enPassant: state.enPassant ? { ...state.enPassant } : null,
    halfmove: state.halfmove,
    fullmove: state.fullmove,
    history: [...state.history],
    captured: { w: [...state.captured.w], b: [...state.captured.b] },
    status: state.status,
    winner: state.winner,
  }
}

// ---------------------------------------------------------------------------
// Attack detection
// ---------------------------------------------------------------------------

const KNIGHT_DELTAS = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
]
const KING_DELTAS = [
  [-1, -1], [-1, 0], [-1, 1], [0, -1],
  [0, 1], [1, -1], [1, 0], [1, 1],
]
const BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
const ROOK_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]]

// Is square (r,c) attacked by any piece of `byColor`?
export function isSquareAttacked(board, r, c, byColor) {
  // Pawn attacks. A `byColor` pawn attacks diagonally "forward".
  // White pawns move up (−row), so they attack from row r+1.
  const pawnRow = byColor === WHITE ? r + 1 : r - 1
  for (const dc of [-1, 1]) {
    const pc = c + dc
    if (inBounds(pawnRow, pc)) {
      const p = board[pawnRow][pc]
      if (p && p.color === byColor && p.type === 'p') return true
    }
  }

  // Knight attacks.
  for (const [dr, dc] of KNIGHT_DELTAS) {
    const nr = r + dr
    const nc = c + dc
    if (inBounds(nr, nc)) {
      const p = board[nr][nc]
      if (p && p.color === byColor && p.type === 'n') return true
    }
  }

  // King attacks (adjacent).
  for (const [dr, dc] of KING_DELTAS) {
    const nr = r + dr
    const nc = c + dc
    if (inBounds(nr, nc)) {
      const p = board[nr][nc]
      if (p && p.color === byColor && p.type === 'k') return true
    }
  }

  // Sliding attacks: bishop/queen on diagonals.
  for (const [dr, dc] of BISHOP_DIRS) {
    let nr = r + dr
    let nc = c + dc
    while (inBounds(nr, nc)) {
      const p = board[nr][nc]
      if (p) {
        if (p.color === byColor && (p.type === 'b' || p.type === 'q')) return true
        break
      }
      nr += dr
      nc += dc
    }
  }

  // Sliding attacks: rook/queen on ranks/files.
  for (const [dr, dc] of ROOK_DIRS) {
    let nr = r + dr
    let nc = c + dc
    while (inBounds(nr, nc)) {
      const p = board[nr][nc]
      if (p) {
        if (p.color === byColor && (p.type === 'r' || p.type === 'q')) return true
        break
      }
      nr += dr
      nc += dc
    }
  }

  return false
}

export function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c]
      if (p && p.type === 'k' && p.color === color) return { r, c }
    }
  }
  return null
}

export function isInCheck(board, color) {
  const king = findKing(board, color)
  if (!king) return false
  return isSquareAttacked(board, king.r, king.c, opposite(color))
}

// ---------------------------------------------------------------------------
// Pseudo-legal move generation (ignores leaving own king in check)
// ---------------------------------------------------------------------------

// A move: { from:{r,c}, to:{r,c}, piece, captured?, flags }
// flags: { enPassant?, castle?:'K'|'Q', double?, promotion?:'q'|'r'|'b'|'n' }

function addSlidingMoves(board, r, c, color, dirs, moves) {
  for (const [dr, dc] of dirs) {
    let nr = r + dr
    let nc = c + dc
    while (inBounds(nr, nc)) {
      const target = board[nr][nc]
      if (!target) {
        moves.push({ from: { r, c }, to: { r: nr, c: nc } })
      } else {
        if (target.color !== color) moves.push({ from: { r, c }, to: { r: nr, c: nc } })
        break
      }
      nr += dr
      nc += dc
    }
  }
}

// Generate pseudo-legal moves for the piece at (r,c).
export function pseudoMovesForPiece(state, r, c) {
  const { board } = state
  const piece = board[r][c]
  if (!piece) return []
  const color = piece.color
  const moves = []

  switch (piece.type) {
    case 'p': {
      const dir = color === WHITE ? -1 : 1
      const startRow = color === WHITE ? 6 : 1
      const promoRow = color === WHITE ? 0 : 7

      // Single push.
      const one = r + dir
      if (inBounds(one, c) && !board[one][c]) {
        pushPawnMove(moves, r, c, one, c, one === promoRow)
        // Double push from start.
        const two = r + 2 * dir
        if (r === startRow && !board[two][c]) {
          moves.push({ from: { r, c }, to: { r: two, c }, flags: { double: true } })
        }
      }

      // Captures (including en passant).
      for (const dc of [-1, 1]) {
        const nc = c + dc
        if (!inBounds(one, nc)) continue
        const target = board[one][nc]
        if (target && target.color !== color) {
          pushPawnMove(moves, r, c, one, nc, one === promoRow)
        } else if (
          state.enPassant &&
          state.enPassant.r === one &&
          state.enPassant.c === nc
        ) {
          moves.push({
            from: { r, c },
            to: { r: one, c: nc },
            flags: { enPassant: true },
          })
        }
      }
      break
    }

    case 'n': {
      for (const [dr, dc] of KNIGHT_DELTAS) {
        const nr = r + dr
        const nc = c + dc
        if (!inBounds(nr, nc)) continue
        const target = board[nr][nc]
        if (!target || target.color !== color) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc } })
        }
      }
      break
    }

    case 'b':
      addSlidingMoves(board, r, c, color, BISHOP_DIRS, moves)
      break
    case 'r':
      addSlidingMoves(board, r, c, color, ROOK_DIRS, moves)
      break
    case 'q':
      addSlidingMoves(board, r, c, color, [...BISHOP_DIRS, ...ROOK_DIRS], moves)
      break

    case 'k': {
      for (const [dr, dc] of KING_DELTAS) {
        const nr = r + dr
        const nc = c + dc
        if (!inBounds(nr, nc)) continue
        const target = board[nr][nc]
        if (!target || target.color !== color) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc } })
        }
      }
      addCastlingMoves(state, r, c, color, moves)
      break
    }
    default:
      break
  }

  return moves
}

function pushPawnMove(moves, r, c, nr, nc, isPromotion) {
  if (isPromotion) {
    for (const promo of ['q', 'r', 'b', 'n']) {
      moves.push({ from: { r, c }, to: { r: nr, c: nc }, flags: { promotion: promo } })
    }
  } else {
    moves.push({ from: { r, c }, to: { r: nr, c: nc } })
  }
}

function addCastlingMoves(state, r, c, color, moves) {
  const { board, castling } = state
  const enemy = opposite(color)
  const homeRow = color === WHITE ? 7 : 0
  if (r !== homeRow || c !== 4) return // king must be on its original square
  if (isSquareAttacked(board, r, 4, enemy)) return // can't castle out of check

  const kSide = color === WHITE ? castling.wK : castling.bK
  const qSide = color === WHITE ? castling.wQ : castling.bQ

  // Kingside: squares f,g (5,6) empty; king passes through f and lands g.
  if (kSide) {
    const rook = board[homeRow][7]
    if (
      rook && rook.type === 'r' && rook.color === color &&
      !board[homeRow][5] && !board[homeRow][6] &&
      !isSquareAttacked(board, homeRow, 5, enemy) &&
      !isSquareAttacked(board, homeRow, 6, enemy)
    ) {
      moves.push({ from: { r, c }, to: { r: homeRow, c: 6 }, flags: { castle: 'K' } })
    }
  }

  // Queenside: squares b,c,d (1,2,3) empty; king passes through d and lands c.
  if (qSide) {
    const rook = board[homeRow][0]
    if (
      rook && rook.type === 'r' && rook.color === color &&
      !board[homeRow][1] && !board[homeRow][2] && !board[homeRow][3] &&
      !isSquareAttacked(board, homeRow, 3, enemy) &&
      !isSquareAttacked(board, homeRow, 2, enemy)
    ) {
      moves.push({ from: { r, c }, to: { r: homeRow, c: 2 }, flags: { castle: 'Q' } })
    }
  }
}

// ---------------------------------------------------------------------------
// Applying a move (low level — assumes the move is legal)
// ---------------------------------------------------------------------------

// Returns a new state with the move applied. Does NOT validate legality;
// use getLegalMoves to obtain legal moves first.
export function applyMove(state, move) {
  const next = cloneState(state)
  const { board } = next
  const piece = board[move.from.r][move.from.c]
  const color = piece.color
  const flags = move.flags || {}
  let capturedPiece = null

  next.enPassant = null // reset; may be set again for a double push

  // En passant capture removes the pawn behind the destination.
  if (flags.enPassant) {
    const capRow = move.from.r // captured pawn shares the mover's starting row
    capturedPiece = board[capRow][move.to.c]
    board[capRow][move.to.c] = null
  } else if (board[move.to.r][move.to.c]) {
    capturedPiece = board[move.to.r][move.to.c]
  }

  // Move the piece.
  board[move.to.r][move.to.c] = piece
  board[move.from.r][move.from.c] = null

  // Promotion.
  if (flags.promotion) {
    board[move.to.r][move.to.c] = { type: flags.promotion, color }
  }

  // Castling: move the rook too.
  if (flags.castle) {
    const homeRow = move.from.r
    if (flags.castle === 'K') {
      board[homeRow][5] = board[homeRow][7]
      board[homeRow][7] = null
    } else {
      board[homeRow][3] = board[homeRow][0]
      board[homeRow][0] = null
    }
  }

  // Double pawn push sets the en passant target square.
  if (flags.double) {
    next.enPassant = { r: (move.from.r + move.to.r) / 2, c: move.from.c }
  }

  // Update castling rights.
  updateCastlingRights(next, color, piece, move, capturedPiece)

  // Track captured piece (stored under the color that lost it).
  if (capturedPiece) next.captured[capturedPiece.color].push(capturedPiece.type)

  // Move counters.
  if (piece.type === 'p' || capturedPiece) next.halfmove = 0
  else next.halfmove = state.halfmove + 1
  if (color === BLACK) next.fullmove = state.fullmove + 1

  // Switch turn.
  next.turn = opposite(color)

  // Record history (algebraic-ish).
  next.history.push(moveToSAN(state, move, piece, capturedPiece))

  // Recompute status for the side to move.
  updateStatus(next)

  return next
}

function updateCastlingRights(next, color, piece, move, capturedPiece) {
  const c = next.castling
  if (piece.type === 'k') {
    if (color === WHITE) { c.wK = false; c.wQ = false }
    else { c.bK = false; c.bQ = false }
  }
  // Rook moved from its corner.
  if (piece.type === 'r') {
    if (move.from.r === 7 && move.from.c === 0) c.wQ = false
    if (move.from.r === 7 && move.from.c === 7) c.wK = false
    if (move.from.r === 0 && move.from.c === 0) c.bQ = false
    if (move.from.r === 0 && move.from.c === 7) c.bK = false
  }
  // Rook captured on its corner.
  if (capturedPiece && capturedPiece.type === 'r') {
    if (move.to.r === 7 && move.to.c === 0) c.wQ = false
    if (move.to.r === 7 && move.to.c === 7) c.wK = false
    if (move.to.r === 0 && move.to.c === 0) c.bQ = false
    if (move.to.r === 0 && move.to.c === 7) c.bK = false
  }
}

// ---------------------------------------------------------------------------
// Legal move generation (filters out moves leaving own king in check)
// ---------------------------------------------------------------------------

export function getLegalMoves(state, r, c) {
  const piece = state.board[r][c]
  if (!piece || piece.color !== state.turn) return []
  const pseudo = pseudoMovesForPiece(state, r, c)
  const legal = []
  for (const move of pseudo) {
    const test = applyMoveRaw(state, move)
    if (!isInCheck(test.board, piece.color)) legal.push(move)
  }
  return legal
}

// A lighter apply used only for legality testing (no status/history work).
function applyMoveRaw(state, move) {
  const board = cloneBoard(state.board)
  const piece = board[move.from.r][move.from.c]
  const flags = move.flags || {}

  if (flags.enPassant) {
    board[move.from.r][move.to.c] = null
  }
  board[move.to.r][move.to.c] = flags.promotion
    ? { type: flags.promotion, color: piece.color }
    : piece
  board[move.from.r][move.from.c] = null

  if (flags.castle) {
    const homeRow = move.from.r
    if (flags.castle === 'K') {
      board[homeRow][5] = board[homeRow][7]
      board[homeRow][7] = null
    } else {
      board[homeRow][3] = board[homeRow][0]
      board[homeRow][0] = null
    }
  }
  return { board }
}

// All legal moves for the side to move.
export function getAllLegalMoves(state) {
  const all = []
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c]
      if (p && p.color === state.turn) all.push(...getLegalMoves(state, r, c))
    }
  }
  return all
}

function updateStatus(state) {
  const moves = getAllLegalMoves(state)
  const inCheck = isInCheck(state.board, state.turn)
  if (moves.length === 0) {
    if (inCheck) {
      state.status = 'checkmate'
      state.winner = opposite(state.turn)
    } else {
      state.status = 'stalemate'
      state.winner = null
    }
  } else if (state.halfmove >= 100) {
    state.status = 'draw' // fifty-move rule
    state.winner = null
  } else if (inCheck) {
    state.status = 'check'
    state.winner = null
  } else {
    state.status = 'ongoing'
    state.winner = null
  }
}

// ---------------------------------------------------------------------------
// Notation helpers
// ---------------------------------------------------------------------------

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

export function squareName(r, c) {
  return FILES[c] + (8 - r)
}

function moveToSAN(state, move, piece, captured) {
  const flags = move.flags || {}
  if (flags.castle === 'K') return 'O-O'
  if (flags.castle === 'Q') return 'O-O-O'
  const letter = piece.type === 'p' ? '' : piece.type.toUpperCase()
  const capture = captured || flags.enPassant
  const fromFile = piece.type === 'p' && capture ? FILES[move.from.c] : ''
  const promo = flags.promotion ? '=' + flags.promotion.toUpperCase() : ''
  return `${letter}${fromFile}${capture ? 'x' : ''}${squareName(move.to.r, move.to.c)}${promo}`
}

// ---------------------------------------------------------------------------
// Serialization for persistence
// ---------------------------------------------------------------------------

export function serialize(state) {
  return JSON.stringify(state)
}

export function deserialize(json) {
  try {
    const parsed = JSON.parse(json)
    if (!parsed || !Array.isArray(parsed.board)) return null
    return parsed
  } catch {
    return null
  }
}
