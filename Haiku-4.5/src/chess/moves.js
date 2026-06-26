import { PIECE_TYPES, COLORS } from './piece';

export function getPseudoLegalMoves(board, row, col, enPassantTarget = null) {
  const piece = board.getSquare(row, col);
  if (!piece) return [];

  switch (piece.type) {
    case PIECE_TYPES.PAWN:
      return getPawnMoves(board, row, col, piece.color, enPassantTarget);
    case PIECE_TYPES.KNIGHT:
      return getKnightMoves(board, row, col, piece.color);
    case PIECE_TYPES.BISHOP:
      return getBishopMoves(board, row, col, piece.color);
    case PIECE_TYPES.ROOK:
      return getRookMoves(board, row, col, piece.color);
    case PIECE_TYPES.QUEEN:
      return getQueenMoves(board, row, col, piece.color);
    case PIECE_TYPES.KING:
      return getKingMoves(board, row, col, piece.color);
    default:
      return [];
  }
}

function getPawnMoves(board, row, col, color, enPassantTarget = null) {
  const moves = [];
  const direction = color === COLORS.WHITE ? -1 : 1;
  const startRow = color === COLORS.WHITE ? 6 : 1;
  const captureRow = color === COLORS.WHITE ? 4 : 3;

  // Single forward
  const nextRow = row + direction;
  if (nextRow >= 0 && nextRow <= 7 && !board.getSquare(nextRow, col)) {
    moves.push({ row: nextRow, col, isPromotion: nextRow === (color === COLORS.WHITE ? 0 : 7) });

    // Double forward from start
    if (row === startRow && !board.getSquare(row + 2 * direction, col)) {
      moves.push({ row: row + 2 * direction, col, enPassantTarget: col });
    }
  }

  // Captures
  for (let dcol of [-1, 1]) {
    const captureCol = col + dcol;
    const captureRowTarget = nextRow;
    if (captureRowTarget >= 0 && captureRowTarget <= 7 && captureCol >= 0 && captureCol <= 7) {
      const target = board.getSquare(captureRowTarget, captureCol);
      if (target && target.color !== color) {
        moves.push({ row: captureRowTarget, col: captureCol, isPromotion: captureRowTarget === (color === COLORS.WHITE ? 0 : 7) });
      } else if (row === captureRow && enPassantTarget === captureCol) {
        // En passant
        moves.push({ row: captureRowTarget, col: captureCol, isEnPassant: true });
      }
    }
  }

  return moves;
}

function getKnightMoves(board, row, col, color) {
  const moves = [];
  const deltas = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];

  for (const [dr, dc] of deltas) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
      const target = board.getSquare(newRow, newCol);
      if (!target || target.color !== color) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }

  return moves;
}

function getBishopMoves(board, row, col, color) {
  return getSlidingMoves(board, row, col, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
}

function getRookMoves(board, row, col, color) {
  return getSlidingMoves(board, row, col, color, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
}

function getQueenMoves(board, row, col, color) {
  return getSlidingMoves(board, row, col, color, [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1]
  ]);
}

function getSlidingMoves(board, row, col, color, directions) {
  const moves = [];

  for (const [dr, dc] of directions) {
    let newRow = row + dr;
    let newCol = col + dc;

    while (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
      const target = board.getSquare(newRow, newCol);

      if (!target) {
        moves.push({ row: newRow, col: newCol });
      } else {
        if (target.color !== color) {
          moves.push({ row: newRow, col: newCol });
        }
        break;
      }

      newRow += dr;
      newCol += dc;
    }
  }

  return moves;
}

function getKingMoves(board, row, col, color) {
  const moves = [];

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;

      const newRow = row + dr;
      const newCol = col + dc;

      if (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
        const target = board.getSquare(newRow, newCol);
        if (!target || target.color !== color) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }
  }

  return moves;
}

export function getKingMovesWithCastling(board, row, col, color, castlingRights) {
  const moves = getKingMoves(board, row, col, color);
  const rights = castlingRights[color];

  // Kingside castling
  if (rights.kingside && board.getSquare(row, 7)?.type === PIECE_TYPES.ROOK) {
    if (!board.getSquare(row, 5) && !board.getSquare(row, 6)) {
      moves.push({ row, col: 6 });
    }
  }

  // Queenside castling
  if (rights.queenside && board.getSquare(row, 0)?.type === PIECE_TYPES.ROOK) {
    if (!board.getSquare(row, 1) && !board.getSquare(row, 2) && !board.getSquare(row, 3)) {
      moves.push({ row, col: 2 });
    }
  }

  return moves;
}
