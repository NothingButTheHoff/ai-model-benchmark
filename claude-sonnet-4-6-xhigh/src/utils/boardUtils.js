import { PIECES } from '../engine/chess';

export function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === PIECES.KING && p.color === color) return [r, c];
    }
  }
  return null;
}
