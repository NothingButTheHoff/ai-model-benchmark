// Board representation: 8x8 array of {type, color} | null.
// row 0 = rank 8 (black back rank), row 7 = rank 1 (white back rank).
// col 0 = file a, col 7 = file h.

export const FILES = 'abcdefgh';

const BACK_RANK = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

export function createInitialBoard() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));

  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: BACK_RANK[col], color: 'b' };
    board[1][col] = { type: 'p', color: 'b' };
    board[6][col] = { type: 'p', color: 'w' };
    board[7][col] = { type: BACK_RANK[col], color: 'w' };
  }

  return board;
}

export function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function isOnBoard(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

export function squareToAlgebraic({ row, col }) {
  return `${FILES[col]}${8 - row}`;
}

export function algebraicToSquare(alg) {
  const col = FILES.indexOf(alg[0]);
  const row = 8 - Number(alg.slice(1));
  return { row, col };
}

export function sameSquare(a, b) {
  return !!a && !!b && a.row === b.row && a.col === b.col;
}

export function opponent(color) {
  return color === 'w' ? 'b' : 'w';
}

export function findKing(board, color) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'k' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}
