import { inBounds } from './utils.js';
import { PIECES, COLORS } from './constants.js';

// Returns pseudo-legal moves (doesn't check if king left in check)
export const getPseudoLegalMoves = (board, row, col, enPassantTarget, castlingRights) => {
  const piece = board[row][col];
  if (!piece) return [];

  const moves = [];
  const { type, color } = piece;
  const opp = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;

  const addIfValid = (r, c) => {
    if (inBounds(r, c)) {
      const target = board[r][c];
      if (!target || target.color === opp) {
        moves.push({ row: r, col: c });
        return !target; // return true if can continue sliding
      }
    }
    return false;
  };

  const slide = (dr, dc) => {
    let r = row + dr, c = col + dc;
    while (inBounds(r, c)) {
      const target = board[r][c];
      if (!target) {
        moves.push({ row: r, col: c });
      } else {
        if (target.color === opp) moves.push({ row: r, col: c });
        break;
      }
      r += dr;
      c += dc;
    }
  };

  switch (type) {
    case PIECES.PAWN: {
      const dir = color === COLORS.WHITE ? -1 : 1;
      const startRow = color === COLORS.WHITE ? 6 : 1;

      // Forward
      if (inBounds(row + dir, col) && !board[row + dir][col]) {
        moves.push({ row: row + dir, col });
        // Double push from start
        if (row === startRow && !board[row + 2 * dir][col]) {
          moves.push({ row: row + 2 * dir, col });
        }
      }

      // Captures
      for (const dc of [-1, 1]) {
        const r = row + dir, c = col + dc;
        if (inBounds(r, c)) {
          if (board[r][c] && board[r][c].color === opp) {
            moves.push({ row: r, col: c });
          }
          // En passant
          if (enPassantTarget && enPassantTarget.row === r && enPassantTarget.col === c) {
            moves.push({ row: r, col: c, enPassant: true });
          }
        }
      }
      break;
    }

    case PIECES.KNIGHT: {
      const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr, dc] of knightMoves) addIfValid(row + dr, col + dc);
      break;
    }

    case PIECES.BISHOP:
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr, dc);
      break;

    case PIECES.ROOK:
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr, dc);
      break;

    case PIECES.QUEEN:
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) slide(dr, dc);
      break;

    case PIECES.KING: {
      const kingMoves = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      for (const [dr, dc] of kingMoves) addIfValid(row + dr, col + dc);

      // Castling
      const rights = castlingRights[color];
      const backRow = color === COLORS.WHITE ? 7 : 0;
      if (row === backRow && col === 4) {
        // Kingside
        if (rights.kingside &&
            !board[backRow][5] && !board[backRow][6] &&
            board[backRow][7]?.type === PIECES.ROOK && board[backRow][7]?.color === color) {
          moves.push({ row: backRow, col: 6, castling: 'kingside' });
        }
        // Queenside
        if (rights.queenside &&
            !board[backRow][3] && !board[backRow][2] && !board[backRow][1] &&
            board[backRow][0]?.type === PIECES.ROOK && board[backRow][0]?.color === color) {
          moves.push({ row: backRow, col: 2, castling: 'queenside' });
        }
      }
      break;
    }
  }

  return moves;
};
