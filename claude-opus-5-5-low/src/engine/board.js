import { BACK_RANK, BLACK, PAWN, WHITE } from './constants.js';

export const isOnBoard = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

export const createPiece = (type, color) => ({ type, color });

export function createInitialBoard() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let col = 0; col < 8; col++) {
    board[0][col] = createPiece(BACK_RANK[col], BLACK);
    board[1][col] = createPiece(PAWN, BLACK);
    board[6][col] = createPiece(PAWN, WHITE);
    board[7][col] = createPiece(BACK_RANK[col], WHITE);
  }
  return board;
}

export const cloneBoard = (board) => board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));

export function findKing(board, color) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'k' && piece.color === color) return { row, col };
    }
  }
  return null;
}

const FILES = 'abcdefgh';

export const toAlgebraic = ({ row, col }) => `${FILES[col]}${8 - row}`;
