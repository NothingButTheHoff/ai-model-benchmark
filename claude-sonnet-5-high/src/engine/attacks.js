import { isOnBoard } from './board.js';

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

// Squares a piece on `square` attacks/defends, ignoring whose turn it is and
// ignoring non-capturing pawn pushes. Sliding pieces stop at the first
// occupied square (that square is included as attacked either way).
export function getAttackSquares(board, square) {
  const piece = board[square.row][square.col];
  if (!piece) return [];

  const attacks = [];
  const { row, col } = square;

  switch (piece.type) {
    case 'p': {
      const dir = piece.color === 'w' ? -1 : 1;
      for (const dc of [-1, 1]) {
        const r = row + dir;
        const c = col + dc;
        if (isOnBoard(r, c)) attacks.push({ row: r, col: c });
      }
      break;
    }
    case 'n': {
      for (const [dr, dc] of KNIGHT_OFFSETS) {
        const r = row + dr;
        const c = col + dc;
        if (isOnBoard(r, c)) attacks.push({ row: r, col: c });
      }
      break;
    }
    case 'k': {
      for (const [dr, dc] of KING_OFFSETS) {
        const r = row + dr;
        const c = col + dc;
        if (isOnBoard(r, c)) attacks.push({ row: r, col: c });
      }
      break;
    }
    case 'b':
    case 'r':
    case 'q': {
      const directions = piece.type === 'b'
        ? BISHOP_DIRECTIONS
        : piece.type === 'r'
          ? ROOK_DIRECTIONS
          : [...BISHOP_DIRECTIONS, ...ROOK_DIRECTIONS];

      for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        while (isOnBoard(r, c)) {
          attacks.push({ row: r, col: c });
          if (board[r][c]) break;
          r += dr;
          c += dc;
        }
      }
      break;
    }
    default:
      break;
  }

  return attacks;
}

export function isSquareAttacked(board, target, byColor) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece.color !== byColor) continue;
      const attacks = getAttackSquares(board, { row, col });
      if (attacks.some((sq) => sq.row === target.row && sq.col === target.col)) {
        return true;
      }
    }
  }
  return false;
}
