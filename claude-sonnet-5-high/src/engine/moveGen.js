import { isOnBoard, cloneBoard, opponent, findKing } from './board.js';
import { getAttackSquares, isSquareAttacked } from './attacks.js';

const PAWN_START_ROW = { w: 6, b: 1 };
const PROMOTION_ROW = { w: 0, b: 7 };
const CASTLE_ROW = { w: 7, b: 0 };

// Pseudo-legal moves for the piece at `square`, ignoring whether the move
// would leave the mover's own king in check. Includes pawn double-push,
// en passant, and marks squares that require promotion. Does not include
// castling (handled separately since it needs check-state awareness).
export function generatePseudoLegalMoves(state, square) {
  const { board, enPassantTarget } = state;
  const piece = board[square.row][square.col];
  if (!piece) return [];

  const moves = [];
  const { row, col } = square;

  if (piece.type === 'p') {
    const dir = piece.color === 'w' ? -1 : 1;
    const startRow = PAWN_START_ROW[piece.color];
    const promoRow = PROMOTION_ROW[piece.color];

    const oneStep = { row: row + dir, col };
    if (isOnBoard(oneStep.row, oneStep.col) && !board[oneStep.row][oneStep.col]) {
      moves.push(makePawnMove(square, oneStep, piece, null, oneStep.row === promoRow));

      const twoStep = { row: row + dir * 2, col };
      if (row === startRow && !board[twoStep.row][twoStep.col]) {
        moves.push(makePawnMove(square, twoStep, piece, null, false, true));
      }
    }

    for (const dc of [-1, 1]) {
      const target = { row: row + dir, col: col + dc };
      if (!isOnBoard(target.row, target.col)) continue;
      const occupant = board[target.row][target.col];
      if (occupant && occupant.color !== piece.color) {
        moves.push(makePawnMove(square, target, piece, occupant, target.row === promoRow));
      } else if (
        !occupant &&
        enPassantTarget &&
        enPassantTarget.row === target.row &&
        enPassantTarget.col === target.col
      ) {
        moves.push(makePawnMove(square, target, piece, null, false, false, true));
      }
    }
  } else {
    const attackSquares = getAttackSquares(board, square);
    for (const target of attackSquares) {
      const occupant = board[target.row][target.col];
      if (!occupant || occupant.color !== piece.color) {
        moves.push({
          from: square,
          to: target,
          piece,
          captured: occupant,
          isEnPassant: false,
          isCastle: null,
          promotion: null,
          isDoublePush: false,
        });
      }
    }
  }

  return moves;
}

function makePawnMove(from, to, piece, captured, isPromotion, isDoublePush = false, isEnPassant = false) {
  return {
    from,
    to,
    piece,
    captured,
    isEnPassant,
    isCastle: null,
    promotion: isPromotion ? 'q' : null,
    isDoublePush,
  };
}

function getCastlingMoves(state, square) {
  const { board, castlingRights, turn } = state;
  const piece = board[square.row][square.col];
  if (!piece || piece.type !== 'k') return [];

  const row = CASTLE_ROW[turn];
  if (square.row !== row || square.col !== 4) return [];

  const opp = opponent(turn);
  if (isSquareAttacked(board, square, opp)) return [];

  const moves = [];
  const rights = castlingRights[turn];

  if (rights.kingSide && !board[row][5] && !board[row][6] && board[row][7]?.type === 'r') {
    if (!isSquareAttacked(board, { row, col: 5 }, opp) && !isSquareAttacked(board, { row, col: 6 }, opp)) {
      moves.push({
        from: square,
        to: { row, col: 6 },
        piece,
        captured: null,
        isEnPassant: false,
        isCastle: 'K',
        promotion: null,
        isDoublePush: false,
      });
    }
  }

  if (
    rights.queenSide &&
    !board[row][3] && !board[row][2] && !board[row][1] &&
    board[row][0]?.type === 'r'
  ) {
    if (!isSquareAttacked(board, { row, col: 3 }, opp) && !isSquareAttacked(board, { row, col: 2 }, opp)) {
      moves.push({
        from: square,
        to: { row, col: 2 },
        piece,
        captured: null,
        isEnPassant: false,
        isCastle: 'Q',
        promotion: null,
        isDoublePush: false,
      });
    }
  }

  return moves;
}

// Applies a move to a cloned board, returning the resulting board. Handles
// en passant capture and castling rook movement. Does not touch turn,
// castling rights, or en passant target bookkeeping (see game.js).
export function applyMoveToBoard(board, move) {
  const next = cloneBoard(board);
  const { from, to, piece, isEnPassant, isCastle, promotion } = move;

  next[from.row][from.col] = null;
  next[to.row][to.col] = promotion ? { type: promotion, color: piece.color } : { ...piece };

  if (isEnPassant) {
    next[from.row][to.col] = null;
  }

  if (isCastle === 'K') {
    const row = from.row;
    next[row][5] = next[row][7];
    next[row][7] = null;
  } else if (isCastle === 'Q') {
    const row = from.row;
    next[row][3] = next[row][0];
    next[row][0] = null;
  }

  return next;
}

function isMoveSafe(state, move) {
  const boardAfter = applyMoveToBoard(state.board, move);
  const kingSquare = move.piece.type === 'k' ? move.to : findKing(boardAfter, move.piece.color);
  return !isSquareAttacked(boardAfter, kingSquare, opponent(move.piece.color));
}

export function generateLegalMoves(state, square) {
  const piece = state.board[square.row][square.col];
  if (!piece || piece.color !== state.turn) return [];

  const pseudoMoves = generatePseudoLegalMoves(state, square);
  const castleMoves = piece.type === 'k' ? getCastlingMoves(state, square) : [];

  return [...pseudoMoves, ...castleMoves].filter((move) => isMoveSafe(state, move));
}

export function getAllLegalMoves(state) {
  const moves = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      if (piece && piece.color === state.turn) {
        moves.push(...generateLegalMoves(state, { row, col }));
      }
    }
  }
  return moves;
}
