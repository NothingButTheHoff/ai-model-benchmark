// Chess engine — built from scratch, no external libs.
// Board: 8x8 array of rows. row 0 = rank 8 (top, black back rank).
// Square = {r, c}. Piece = { type: 'p|n|b|r|q|k', color: 'w|b' }.

export const WHITE = 'w'
export const BLACK = 'b'

export function initialState() {
  const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
  const board = Array.from({ length: 8 }, () => Array(8).fill(null))
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: back[c], color: BLACK }
    board[1][c] = { type: 'p', color: BLACK }
    board[6][c] = { type: 'p', color: WHITE }
    board[7][c] = { type: back[c], color: WHITE }
  }
  return {
    board,
    turn: WHITE,
    // castling rights
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    enPassant: null, // {r, c} square that can be captured onto, or null
    halfmove: 0,
    status: 'playing', // playing | check | checkmate | stalemate
    winner: null,
    captured: { w: [], b: [] }, // pieces captured BY that color
    history: [],
  }
}

const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8
const opp = (color) => (color === WHITE ? BLACK : WHITE)

function cloneBoard(board) {
  return board.map((row) => row.map((p) => (p ? { ...p } : null)))
}

// Find king square for a color.
function findKing(board, color) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c]
      if (p && p.type === 'k' && p.color === color) return { r, c }
    }
  return null
}

// Is square {r,c} attacked by `byColor`? (used for check / castling)
export function isAttacked(board, r, c, byColor) {
  const dir = byColor === WHITE ? -1 : 1 // pawns move up if white (toward row 0)
  // pawn attacks: a white pawn at (r+1, c±1) attacks (r,c)
  for (const dc of [-1, 1]) {
    const pr = r - dir // attacker pawn row
    const pc = c + dc
    if (inBounds(pr, pc)) {
      const p = board[pr][pc]
      if (p && p.color === byColor && p.type === 'p') return true
    }
  }
  // knight
  const kn = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
  for (const [dr, dc] of kn) {
    const pr = r + dr, pc = c + dc
    if (inBounds(pr, pc)) {
      const p = board[pr][pc]
      if (p && p.color === byColor && p.type === 'n') return true
    }
  }
  // king
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const pr = r + dr, pc = c + dc
      if (inBounds(pr, pc)) {
        const p = board[pr][pc]
        if (p && p.color === byColor && p.type === 'k') return true
      }
    }
  // sliding: bishop/queen diagonals, rook/queen orthogonals
  const diag = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  const orth = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  for (const [dr, dc] of diag) {
    let pr = r + dr, pc = c + dc
    while (inBounds(pr, pc)) {
      const p = board[pr][pc]
      if (p) {
        if (p.color === byColor && (p.type === 'b' || p.type === 'q')) return true
        break
      }
      pr += dr; pc += dc
    }
  }
  for (const [dr, dc] of orth) {
    let pr = r + dr, pc = c + dc
    while (inBounds(pr, pc)) {
      const p = board[pr][pc]
      if (p) {
        if (p.color === byColor && (p.type === 'r' || p.type === 'q')) return true
        break
      }
      pr += dr; pc += dc
    }
  }
  return false
}

export function inCheck(board, color) {
  const k = findKing(board, color)
  if (!k) return false
  return isAttacked(board, k.r, k.c, opp(color))
}

// Generate pseudo-legal moves for piece at (r,c). Does not check for self-check.
function pseudoMoves(state, r, c) {
  const { board, castling, enPassant } = state
  const p = board[r][c]
  if (!p) return []
  const moves = []
  const color = p.color
  const add = (tr, tc, extra = {}) => moves.push({ from: { r, c }, to: { r: tr, c: tc }, ...extra })

  if (p.type === 'p') {
    const dir = color === WHITE ? -1 : 1
    const startRow = color === WHITE ? 6 : 1
    const promoRow = color === WHITE ? 0 : 7
    // forward 1
    if (inBounds(r + dir, c) && !board[r + dir][c]) {
      if (r + dir === promoRow) add(r + dir, c, { promotion: true })
      else add(r + dir, c)
      // forward 2
      if (r === startRow && !board[r + 2 * dir][c]) add(r + 2 * dir, c, { double: true })
    }
    // captures
    for (const dc of [-1, 1]) {
      const tr = r + dir, tc = c + dc
      if (!inBounds(tr, tc)) continue
      const target = board[tr][tc]
      if (target && target.color !== color) {
        if (tr === promoRow) add(tr, tc, { promotion: true })
        else add(tr, tc)
      } else if (enPassant && enPassant.r === tr && enPassant.c === tc) {
        add(tr, tc, { enPassant: true })
      }
    }
  } else if (p.type === 'n') {
    const kn = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
    for (const [dr, dc] of kn) {
      const tr = r + dr, tc = c + dc
      if (!inBounds(tr, tc)) continue
      const t = board[tr][tc]
      if (!t || t.color !== color) add(tr, tc)
    }
  } else if (p.type === 'k') {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue
        const tr = r + dr, tc = c + dc
        if (!inBounds(tr, tc)) continue
        const t = board[tr][tc]
        if (!t || t.color !== color) add(tr, tc)
      }
    // castling
    const row = color === WHITE ? 7 : 0
    if (r === row && c === 4 && !inCheck(board, color)) {
      const kSide = color === WHITE ? castling.wK : castling.bK
      const qSide = color === WHITE ? castling.wQ : castling.bQ
      // kingside: squares f,g empty; e,f,g not attacked; rook present
      if (kSide && !board[row][5] && !board[row][6] &&
        board[row][7] && board[row][7].type === 'r' && board[row][7].color === color &&
        !isAttacked(board, row, 5, opp(color)) && !isAttacked(board, row, 6, opp(color))) {
        add(row, 6, { castle: 'k' })
      }
      // queenside: b,c,d empty; e,d,c not attacked; rook present
      if (qSide && !board[row][1] && !board[row][2] && !board[row][3] &&
        board[row][0] && board[row][0].type === 'r' && board[row][0].color === color &&
        !isAttacked(board, row, 3, opp(color)) && !isAttacked(board, row, 2, opp(color))) {
        add(row, 2, { castle: 'q' })
      }
    }
  } else {
    // sliding pieces
    let dirs = []
    if (p.type === 'b') dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    else if (p.type === 'r') dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
    else dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]
    for (const [dr, dc] of dirs) {
      let tr = r + dr, tc = c + dc
      while (inBounds(tr, tc)) {
        const t = board[tr][tc]
        if (!t) add(tr, tc)
        else {
          if (t.color !== color) add(tr, tc)
          break
        }
        tr += dr; tc += dc
      }
    }
  }
  return moves
}

// Apply a move to a state, returning a NEW state. promotionPiece used if move.promotion.
export function applyMove(state, move, promotionPiece = 'q') {
  const board = cloneBoard(state.board)
  const piece = board[move.from.r][move.from.c]
  const color = piece.color
  const captured = { w: [...state.captured.w], b: [...state.captured.b] }
  const castling = { ...state.castling }

  let capturedPiece = board[move.to.r][move.to.c]

  // en passant capture removes pawn behind target
  if (move.enPassant) {
    const dir = color === WHITE ? -1 : 1
    capturedPiece = board[move.to.r - dir][move.to.c]
    board[move.to.r - dir][move.to.c] = null
  }
  if (capturedPiece) captured[color].push(capturedPiece.type)

  // move piece
  board[move.to.r][move.to.c] = piece
  board[move.from.r][move.from.c] = null

  // promotion
  if (move.promotion) board[move.to.r][move.to.c] = { type: promotionPiece, color }

  // castling: move rook
  if (move.castle) {
    const row = move.from.r
    if (move.castle === 'k') {
      board[row][5] = board[row][7]
      board[row][7] = null
    } else {
      board[row][3] = board[row][0]
      board[row][0] = null
    }
  }

  // update castling rights
  if (piece.type === 'k') {
    if (color === WHITE) { castling.wK = false; castling.wQ = false }
    else { castling.bK = false; castling.bQ = false }
  }
  // rook moved or captured
  const touch = (r, c) => {
    if (r === 7 && c === 0) castling.wQ = false
    if (r === 7 && c === 7) castling.wK = false
    if (r === 0 && c === 0) castling.bQ = false
    if (r === 0 && c === 7) castling.bK = false
  }
  touch(move.from.r, move.from.c)
  touch(move.to.r, move.to.c)

  // en passant target
  let enPassant = null
  if (move.double) {
    const dir = color === WHITE ? -1 : 1
    enPassant = { r: move.from.r + dir, c: move.from.c }
  }

  const next = opp(color)
  const newState = {
    ...state,
    board,
    turn: next,
    castling,
    enPassant,
    captured,
    halfmove: capturedPiece || piece.type === 'p' ? 0 : state.halfmove + 1,
  }

  // compute status for the side to move
  const moves = allLegalMoves(newState)
  const checked = inCheck(board, next)
  if (moves.length === 0) {
    newState.status = checked ? 'checkmate' : 'stalemate'
    newState.winner = checked ? color : null
  } else {
    newState.status = checked ? 'check' : 'playing'
    newState.winner = null
  }
  return newState
}

// Legal moves for a single piece (filters self-check).
export function legalMovesFor(state, r, c) {
  const p = state.board[r][c]
  if (!p || p.color !== state.turn) return []
  const out = []
  for (const m of pseudoMoves(state, r, c)) {
    const b = cloneBoard(state.board)
    const piece = b[m.from.r][m.from.c]
    if (m.enPassant) {
      const dir = piece.color === WHITE ? -1 : 1
      b[m.to.r - dir][m.to.c] = null
    }
    b[m.to.r][m.to.c] = piece
    b[m.from.r][m.from.c] = null
    if (m.promotion) b[m.to.r][m.to.c] = { type: 'q', color: piece.color }
    if (m.castle) {
      const row = m.from.r
      if (m.castle === 'k') { b[row][5] = b[row][7]; b[row][7] = null }
      else { b[row][3] = b[row][0]; b[row][0] = null }
    }
    if (!inCheck(b, piece.color)) out.push(m)
  }
  return out
}

export function allLegalMoves(state) {
  const out = []
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c]
      if (p && p.color === state.turn) out.push(...legalMovesFor(state, r, c))
    }
  return out
}
