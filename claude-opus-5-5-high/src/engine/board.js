import { BACK_RANK_ORDER, BLACK, BOARD_SIZE, KING, PAWN, WHITE } from './constants.js';

export const opponentOf = (color) => (color === WHITE ? BLACK : WHITE);

export const isInsideBoard = (row, col) =>
  row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

export const isSameSquare = (a, b) => Boolean(a && b) && a.row === b.row && a.col === b.col;

export const pawnDirection = (color) => (color === WHITE ? -1 : 1);

export const pawnStartRow = (color) => (color === WHITE ? BOARD_SIZE - 2 : 1);

export const promotionRow = (color) => (color === WHITE ? 0 : BOARD_SIZE - 1);

export const homeRow = (color) => (color === WHITE ? BOARD_SIZE - 1 : 0);

export const createEmptyBoard = () =>
  Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

export const cloneBoard = (board) => board.map((row) => [...row]);

export function createInitialBoard() {
  const board = createEmptyBoard();
  BACK_RANK_ORDER.forEach((type, col) => {
    board[homeRow(BLACK)][col] = { type, color: BLACK };
    board[pawnStartRow(BLACK)][col] = { type: PAWN, color: BLACK };
    board[pawnStartRow(WHITE)][col] = { type: PAWN, color: WHITE };
    board[homeRow(WHITE)][col] = { type, color: WHITE };
  });
  return board;
}

export function findKing(board, color) {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece?.type === KING && piece.color === color) return { row, col };
    }
  }
  return null;
}

export const squareName = ({ row, col }) =>
  `${String.fromCharCode(97 + col)}${BOARD_SIZE - row}`;
