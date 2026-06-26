import { COLORS, PIECES } from './constants.js';

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function opponent(color) {
  return color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
}

function cloneBoard(board) {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

function slidingMoves(board, row, col, directions, color) {
  const moves = [];
  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c)) {
      const target = board[r][c];
      if (!target) {
        moves.push([r, c]);
      } else {
        if (target.color !== color) moves.push([r, c]);
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return moves;
}

function getPawnMoves(board, row, col, color, enPassantTarget) {
  const moves = [];
  const dir = color === COLORS.WHITE ? -1 : 1;
  const startRow = color === COLORS.WHITE ? 6 : 1;

  const fwd = row + dir;
  if (inBounds(fwd, col) && !board[fwd][col]) {
    moves.push([fwd, col]);
    const fwd2 = row + 2 * dir;
    if (row === startRow && !board[fwd2][col]) {
      moves.push([fwd2, col]);
    }
  }

  for (const dc of [-1, 1]) {
    const nc = col + dc;
    if (!inBounds(fwd, nc)) continue;
    const target = board[fwd][nc];
    if (target && target.color !== color) {
      moves.push([fwd, nc]);
    }
    if (enPassantTarget && enPassantTarget[0] === fwd && enPassantTarget[1] === nc) {
      moves.push([fwd, nc]);
    }
  }

  return moves;
}

function getKnightMoves(board, row, col, color) {
  const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  return offsets
    .map(([dr, dc]) => [row + dr, col + dc])
    .filter(([r, c]) => inBounds(r, c) && (!board[r][c] || board[r][c].color !== color));
}

function getBishopMoves(board, row, col, color) {
  return slidingMoves(board, row, col, [[-1,-1],[-1,1],[1,-1],[1,1]], color);
}

function getRookMoves(board, row, col, color) {
  return slidingMoves(board, row, col, [[-1,0],[1,0],[0,-1],[0,1]], color);
}

function getQueenMoves(board, row, col, color) {
  return [
    ...getBishopMoves(board, row, col, color),
    ...getRookMoves(board, row, col, color),
  ];
}

function getKingBasicMoves(board, row, col, color) {
  const moves = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (inBounds(r, c) && (!board[r][c] || board[r][c].color !== color)) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

export function getRawMoves(board, row, col, enPassantTarget) {
  const piece = board[row][col];
  if (!piece) return [];
  const { type, color } = piece;
  switch (type) {
    case PIECES.PAWN: return getPawnMoves(board, row, col, color, enPassantTarget);
    case PIECES.KNIGHT: return getKnightMoves(board, row, col, color);
    case PIECES.BISHOP: return getBishopMoves(board, row, col, color);
    case PIECES.ROOK: return getRookMoves(board, row, col, color);
    case PIECES.QUEEN: return getQueenMoves(board, row, col, color);
    case PIECES.KING: return getKingBasicMoves(board, row, col, color);
    default: return [];
  }
}

export function isSquareAttacked(board, row, col, byColor) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== byColor) continue;
      const moves = getRawMoves(board, r, c, null);
      if (moves.some(([mr, mc]) => mr === row && mc === col)) return true;
    }
  }
  return false;
}

export function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === PIECES.KING && p.color === color) return [r, c];
    }
  }
  return null;
}

export function isInCheck(board, color) {
  const king = findKing(board, color);
  if (!king) return false;
  return isSquareAttacked(board, king[0], king[1], opponent(color));
}

function wouldBeInCheck(board, fromRow, fromCol, toRow, toCol, color, enPassantTarget) {
  const newBoard = cloneBoard(board);
  const piece = newBoard[fromRow][fromCol];

  // en passant capture
  if (piece.type === PIECES.PAWN && enPassantTarget &&
      toRow === enPassantTarget[0] && toCol === enPassantTarget[1] &&
      !board[toRow][toCol]) {
    const capturedRow = fromRow;
    newBoard[capturedRow][toCol] = null;
  }

  newBoard[toRow][toCol] = piece;
  newBoard[fromRow][fromCol] = null;
  return isInCheck(newBoard, color);
}

function getCastlingMoves(board, row, col, color, castlingRights) {
  const moves = [];
  if (isInCheck(board, color)) return moves;

  const rights = castlingRights[color];
  const backRank = color === COLORS.WHITE ? 7 : 0;
  if (row !== backRank || col !== 4) return moves;
  const opp = opponent(color);

  // Kingside
  if (rights.kingSide) {
    const rookPiece = board[backRank][7];
    if (rookPiece && rookPiece.type === PIECES.ROOK && rookPiece.color === color &&
        !board[backRank][5] && !board[backRank][6] &&
        !isSquareAttacked(board, backRank, 5, opp) &&
        !isSquareAttacked(board, backRank, 6, opp)) {
      moves.push([backRank, 6]);
    }
  }

  // Queenside
  if (rights.queenSide) {
    const rookPiece = board[backRank][0];
    if (rookPiece && rookPiece.type === PIECES.ROOK && rookPiece.color === color &&
        !board[backRank][1] && !board[backRank][2] && !board[backRank][3] &&
        !isSquareAttacked(board, backRank, 2, opp) &&
        !isSquareAttacked(board, backRank, 3, opp)) {
      moves.push([backRank, 2]);
    }
  }

  return moves;
}

export function getLegalMoves(board, row, col, enPassantTarget, castlingRights) {
  const piece = board[row][col];
  if (!piece) return [];
  const { color } = piece;

  let candidates = getRawMoves(board, row, col, enPassantTarget);

  if (piece.type === PIECES.KING) {
    candidates = [...candidates, ...getCastlingMoves(board, row, col, color, castlingRights)];
  }

  return candidates.filter(([r, c]) => !wouldBeInCheck(board, row, col, r, c, color, enPassantTarget));
}

export function hasAnyLegalMove(board, color, enPassantTarget, castlingRights) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color) {
        if (getLegalMoves(board, r, c, enPassantTarget, castlingRights).length > 0) return true;
      }
    }
  }
  return false;
}

export { cloneBoard, opponent };
