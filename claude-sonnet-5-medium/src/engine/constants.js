// Board coordinates: row 0 = rank 8 (top/black back rank), row 7 = rank 1 (bottom/white back rank)
// col 0 = file a, col 7 = file h

export const WHITE = 'white';
export const BLACK = 'black';

export const PAWN = 'p';
export const KNIGHT = 'n';
export const BISHOP = 'b';
export const ROOK = 'r';
export const QUEEN = 'q';
export const KING = 'k';

export function opponent(color) {
  return color === WHITE ? BLACK : WHITE;
}

const BACK_RANK = [ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK];

export function createInitialBoard() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));

  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: BACK_RANK[col], color: BLACK };
    board[1][col] = { type: PAWN, color: BLACK };
    board[6][col] = { type: PAWN, color: WHITE };
    board[7][col] = { type: BACK_RANK[col], color: WHITE };
  }

  return board;
}

export function squareToAlgebraic(row, col) {
  const file = String.fromCharCode('a'.charCodeAt(0) + col);
  const rank = 8 - row;
  return `${file}${rank}`;
}

export function isOnBoard(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}
