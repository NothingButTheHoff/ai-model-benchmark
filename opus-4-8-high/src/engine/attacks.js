// Square attack detection.
//
// `isSquareAttacked` is computed directly (not via move generation) so it has
// no dependency on castling/en-passant state and cannot recurse into legality
// checks. This keeps check detection cheap and self-contained.

import {
  WHITE,
  PAWN,
  KNIGHT,
  BISHOP,
  ROOK,
  QUEEN,
  KING,
} from './constants.js';
import { inBounds, pieceAt } from './board.js';

const KNIGHT_OFFSETS = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
];

const KING_OFFSETS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

const BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ROOK_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Is the square (row, col) attacked by any piece of color `byColor`?
export function isSquareAttacked(board, row, col, byColor) {
  // Pawn attacks. A pawn of `byColor` attacks `row,col` if it sits one row
  // "behind" (relative to its own forward direction) and one column to the
  // side. White pawns attack toward smaller rows, so a white attacker sits at
  // row+1; a black attacker sits at row-1.
  const pawnRow = byColor === WHITE ? row + 1 : row - 1;
  for (const dc of [-1, 1]) {
    const p = pieceAt(board, pawnRow, col + dc);
    if (p && p.color === byColor && p.type === PAWN) return true;
  }

  // Knight attacks.
  for (const [dr, dc] of KNIGHT_OFFSETS) {
    const p = pieceAt(board, row + dr, col + dc);
    if (p && p.color === byColor && p.type === KNIGHT) return true;
  }

  // King attacks (adjacent squares).
  for (const [dr, dc] of KING_OFFSETS) {
    const p = pieceAt(board, row + dr, col + dc);
    if (p && p.color === byColor && p.type === KING) return true;
  }

  // Sliding attacks along diagonals (bishop / queen).
  for (const [dr, dc] of BISHOP_DIRS) {
    if (slideHits(board, row, col, dr, dc, byColor, [BISHOP, QUEEN])) return true;
  }

  // Sliding attacks along ranks/files (rook / queen).
  for (const [dr, dc] of ROOK_DIRS) {
    if (slideHits(board, row, col, dr, dc, byColor, [ROOK, QUEEN])) return true;
  }

  return false;
}

function slideHits(board, row, col, dr, dc, byColor, types) {
  let r = row + dr;
  let c = col + dc;
  while (inBounds(r, c)) {
    const p = board[r][c];
    if (p) {
      return p.color === byColor && types.includes(p.type);
    }
    r += dr;
    c += dc;
  }
  return false;
}

export function findKing(board, color) {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const p = board[r][c];
      if (p && p.type === KING && p.color === color) return { row: r, col: c };
    }
  }
  return null;
}

export function isInCheck(board, color) {
  const king = findKing(board, color);
  if (!king) return false; // Defensive: no king on board.
  return isSquareAttacked(board, king.row, king.col, color === WHITE ? 'b' : 'w');
}
