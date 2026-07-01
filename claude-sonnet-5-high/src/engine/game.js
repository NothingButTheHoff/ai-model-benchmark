import { createInitialBoard, opponent, findKing } from './board.js';
import { isSquareAttacked } from './attacks.js';
import { applyMoveToBoard, generateLegalMoves, getAllLegalMoves } from './moveGen.js';

export function createGame() {
  return {
    board: createInitialBoard(),
    turn: 'w',
    castlingRights: {
      w: { kingSide: true, queenSide: true },
      b: { kingSide: true, queenSide: true },
    },
    enPassantTarget: null,
    capturedPieces: { w: [], b: [] },
    status: 'ongoing',
    winner: null,
    lastMove: null,
  };
}

export function getLegalMovesForSquare(state, square) {
  if (state.status === 'checkmate' || state.status === 'stalemate') return [];
  return generateLegalMoves(state, square);
}

function updateCastlingRights(rights, move) {
  const next = { w: { ...rights.w }, b: { ...rights.b } };
  const { piece, from, to, captured, isEnPassant } = move;

  if (piece.type === 'k') {
    next[piece.color].kingSide = false;
    next[piece.color].queenSide = false;
  }

  if (piece.type === 'r') {
    if (piece.color === 'w' && from.row === 7 && from.col === 0) next.w.queenSide = false;
    if (piece.color === 'w' && from.row === 7 && from.col === 7) next.w.kingSide = false;
    if (piece.color === 'b' && from.row === 0 && from.col === 0) next.b.queenSide = false;
    if (piece.color === 'b' && from.row === 0 && from.col === 7) next.b.kingSide = false;
  }

  if (captured && captured.type === 'r' && !isEnPassant) {
    if (captured.color === 'w' && to.row === 7 && to.col === 0) next.w.queenSide = false;
    if (captured.color === 'w' && to.row === 7 && to.col === 7) next.w.kingSide = false;
    if (captured.color === 'b' && to.row === 0 && to.col === 0) next.b.queenSide = false;
    if (captured.color === 'b' && to.row === 0 && to.col === 7) next.b.kingSide = false;
  }

  return next;
}

// Applies a fully-specified move (promotion type already chosen, if any) and
// returns the resulting game state, including updated check/checkmate/
// stalemate status for the side to move next.
export function applyMove(state, move) {
  const board = applyMoveToBoard(state.board, move);
  const capturedPiece = move.isEnPassant
    ? state.board[move.from.row][move.to.col]
    : move.captured;

  const castlingRights = updateCastlingRights(state.castlingRights, move);
  const enPassantTarget = move.isDoublePush
    ? { row: (move.from.row + move.to.row) / 2, col: move.from.col }
    : null;

  const capturedPieces = {
    w: [...state.capturedPieces.w],
    b: [...state.capturedPieces.b],
  };
  if (capturedPiece) {
    capturedPieces[capturedPiece.color] = [...capturedPieces[capturedPiece.color], capturedPiece.type];
  }

  const turn = opponent(state.turn);

  const nextState = {
    board,
    turn,
    castlingRights,
    enPassantTarget,
    capturedPieces,
    status: 'ongoing',
    winner: null,
    lastMove: move,
  };

  const { status, winner } = computeStatus(nextState, state.turn);
  nextState.status = status;
  nextState.winner = winner;

  return nextState;
}

// Determines check/checkmate/stalemate/ongoing status for the side to move
// in `state`. `movingColor` (the side that just moved) is credited as the
// winner on checkmate.
export function computeStatus(state, movingColor) {
  const { board, turn } = state;
  const kingSquare = findKing(board, turn);
  const inCheck = kingSquare ? isSquareAttacked(board, kingSquare, opponent(turn)) : false;
  const hasLegalMoves = getAllLegalMoves(state).length > 0;

  if (!hasLegalMoves) {
    return {
      status: inCheck ? 'checkmate' : 'stalemate',
      winner: inCheck ? (movingColor ?? opponent(turn)) : null,
    };
  }

  return { status: inCheck ? 'check' : 'ongoing', winner: null };
}
