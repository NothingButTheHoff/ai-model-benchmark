import { PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING, WHITE, opponent, isOnBoard } from './constants';

const KNIGHT_OFFSETS = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
];

const KING_OFFSETS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

const BISHOP_DIRECTIONS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ROOK_DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const QUEEN_DIRECTIONS = [...BISHOP_DIRECTIONS, ...ROOK_DIRECTIONS];

function slideMoves(board, row, col, color, directions) {
  const moves = [];
  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;
    while (isOnBoard(r, c)) {
      const target = board[r][c];
      if (!target) {
        moves.push({ row: r, col: c });
      } else {
        if (target.color !== color) moves.push({ row: r, col: c });
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return moves;
}

function stepMoves(board, row, col, color, offsets) {
  const moves = [];
  for (const [dr, dc] of offsets) {
    const r = row + dr;
    const c = col + dc;
    if (!isOnBoard(r, c)) continue;
    const target = board[r][c];
    if (!target || target.color !== color) moves.push({ row: r, col: c });
  }
  return moves;
}

function pawnMoves(board, row, col, color, state) {
  const moves = [];
  const dir = color === WHITE ? -1 : 1;
  const startRow = color === WHITE ? 6 : 1;
  const promotionRow = color === WHITE ? 0 : 7;

  const oneStep = row + dir;
  if (isOnBoard(oneStep, col) && !board[oneStep][col]) {
    moves.push({ row: oneStep, col, promotion: oneStep === promotionRow });
    const twoStep = row + dir * 2;
    if (row === startRow && !board[twoStep][col]) {
      moves.push({ row: twoStep, col, isDoublePawn: true });
    }
  }

  for (const dc of [-1, 1]) {
    const r = row + dir;
    const c = col + dc;
    if (!isOnBoard(r, c)) continue;
    const target = board[r][c];
    if (target && target.color !== color) {
      moves.push({ row: r, col: c, isCapture: true, promotion: r === promotionRow });
    } else if (
      state.enPassantTarget &&
      state.enPassantTarget.row === r &&
      state.enPassantTarget.col === c
    ) {
      moves.push({ row: r, col: c, isCapture: true, isEnPassant: true });
    }
  }

  return moves;
}

// Pseudo-legal moves: obey piece movement rules but do not check for leaving own king in check.
export function getPseudoLegalMoves(board, row, col, state) {
  const piece = board[row][col];
  if (!piece) return [];
  const { type, color } = piece;

  switch (type) {
    case PAWN:
      return pawnMoves(board, row, col, color, state);
    case KNIGHT:
      return stepMoves(board, row, col, color, KNIGHT_OFFSETS);
    case BISHOP:
      return slideMoves(board, row, col, color, BISHOP_DIRECTIONS);
    case ROOK:
      return slideMoves(board, row, col, color, ROOK_DIRECTIONS);
    case QUEEN:
      return slideMoves(board, row, col, color, QUEEN_DIRECTIONS);
    case KING:
      return stepMoves(board, row, col, color, KING_OFFSETS);
    default:
      return [];
  }
}

export function isSquareAttacked(board, row, col, byColor) {
  // Pawn attacks
  const pawnDir = byColor === WHITE ? 1 : -1; // attacking pawn sits one row "behind" from target's perspective
  for (const dc of [-1, 1]) {
    const r = row + pawnDir;
    const c = col + dc;
    if (isOnBoard(r, c)) {
      const p = board[r][c];
      if (p && p.color === byColor && p.type === PAWN) return true;
    }
  }

  for (const [dr, dc] of KNIGHT_OFFSETS) {
    const r = row + dr;
    const c = col + dc;
    if (isOnBoard(r, c)) {
      const p = board[r][c];
      if (p && p.color === byColor && p.type === KNIGHT) return true;
    }
  }

  for (const [dr, dc] of KING_OFFSETS) {
    const r = row + dr;
    const c = col + dc;
    if (isOnBoard(r, c)) {
      const p = board[r][c];
      if (p && p.color === byColor && p.type === KING) return true;
    }
  }

  for (const [dr, dc] of BISHOP_DIRECTIONS) {
    let r = row + dr;
    let c = col + dc;
    while (isOnBoard(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.color === byColor && (p.type === BISHOP || p.type === QUEEN)) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }

  for (const [dr, dc] of ROOK_DIRECTIONS) {
    let r = row + dr;
    let c = col + dc;
    while (isOnBoard(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.color === byColor && (p.type === ROOK || p.type === QUEEN)) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }

  return false;
}

export function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === KING && p.color === color) return { row: r, col: c };
    }
  }
  return null;
}

export function isInCheck(board, color) {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  return isSquareAttacked(board, kingPos.row, kingPos.col, opponent(color));
}

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

// Applies a move to a cloned board for the purpose of check-detection only.
// Handles en passant capture and castling rook movement, but not state bookkeeping.
function simulateMove(board, from, to, move) {
  const next = cloneBoard(board);
  const piece = next[from.row][from.col];
  next[from.row][from.col] = null;

  if (move.isEnPassant) {
    next[from.row][to.col] = null; // captured pawn sits on the same row as the mover, target column
  }

  if (move.castle === 'K') {
    next[from.row][5] = next[from.row][7];
    next[from.row][7] = null;
  } else if (move.castle === 'Q') {
    next[from.row][3] = next[from.row][0];
    next[from.row][0] = null;
  }

  next[to.row][to.col] = move.promotion ? { type: move.promotion, color: piece.color } : piece;
  return next;
}

function getCastlingMoves(board, row, col, color, state) {
  const moves = [];
  if (isInCheck(board, color)) return moves;
  const rights = state.castlingRights[color];
  const opp = opponent(color);

  if (rights.kingSide) {
    if (!board[row][5] && !board[row][6] && board[row][7]?.type === ROOK) {
      const safe = !isSquareAttacked(board, row, 5, opp) && !isSquareAttacked(board, row, 6, opp);
      if (safe) moves.push({ row, col: 6, castle: 'K' });
    }
  }
  if (rights.queenSide) {
    if (!board[row][1] && !board[row][2] && !board[row][3] && board[row][0]?.type === ROOK) {
      const safe = !isSquareAttacked(board, row, 3, opp) && !isSquareAttacked(board, row, 2, opp);
      if (safe) moves.push({ row, col: 2, castle: 'Q' });
    }
  }
  return moves;
}

// Fully legal moves for the piece at (row, col): pseudo-legal moves filtered so the
// mover's own king is never left in check, plus castling.
export function getLegalMovesForSquare(board, row, col, state) {
  const piece = board[row][col];
  if (!piece) return [];
  const { color, type } = piece;

  let candidates = getPseudoLegalMoves(board, row, col, state).map((m) => ({ ...m }));

  if (type === PAWN) {
    const expanded = [];
    for (const m of candidates) {
      if (m.promotion) {
        for (const promo of [QUEEN, ROOK, BISHOP, KNIGHT]) {
          expanded.push({ ...m, promotion: promo });
        }
      } else {
        expanded.push(m);
      }
    }
    candidates = expanded;
  }

  if (type === KING) {
    candidates = candidates.concat(getCastlingMoves(board, row, col, color, state));
  }

  const from = { row, col };
  return candidates.filter((move) => {
    const simulated = simulateMove(board, from, move, move);
    return !isInCheck(simulated, color);
  });
}

export function getAllLegalMoves(board, color, state) {
  const results = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const moves = getLegalMovesForSquare(board, r, c, state);
        for (const move of moves) {
          results.push({ from: { row: r, col: c }, to: { row: move.row, col: move.col }, ...move });
        }
      }
    }
  }
  return results;
}
