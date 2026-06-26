// Board representation and small helpers.
//
// A board is an 8x8 array of rows. Each cell is either `null` (empty) or a
// piece object: { type, color }.

import {
  WHITE,
  BLACK,
  PAWN,
  KNIGHT,
  BISHOP,
  ROOK,
  QUEEN,
  KING,
  BOARD_SIZE,
} from './constants.js';

export function createPiece(type, color) {
  return { type, color };
}

// Standard starting position.
export function createInitialBoard() {
  const empty = () => Array(BOARD_SIZE).fill(null);
  const board = Array.from({ length: BOARD_SIZE }, empty);

  const backRank = [ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK];

  for (let col = 0; col < BOARD_SIZE; col++) {
    // Black back rank + pawns at the top (rows 0 and 1).
    board[0][col] = createPiece(backRank[col], BLACK);
    board[1][col] = createPiece(PAWN, BLACK);
    // White pawns + back rank at the bottom (rows 6 and 7).
    board[6][col] = createPiece(PAWN, WHITE);
    board[7][col] = createPiece(backRank[col], WHITE);
  }

  return board;
}

export function inBounds(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function pieceAt(board, row, col) {
  if (!inBounds(row, col)) return null;
  return board[row][col];
}

// Deep clone (pieces are simple objects, so a shallow per-cell copy suffices).
export function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

// Convert between { row, col } and algebraic squares like "e4".
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export function toAlgebraic(row, col) {
  return `${FILES[col]}${BOARD_SIZE - row}`;
}

export function fromAlgebraic(square) {
  const col = FILES.indexOf(square[0]);
  const row = BOARD_SIZE - Number(square[1]);
  return { row, col };
}
