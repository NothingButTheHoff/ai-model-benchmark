// High-level game wrapper: status (check/checkmate/stalemate/draw), captured
// pieces, move history, and serialization for persistence.

import { WHITE, BLACK, opponent } from './constants.js';
import { createInitialBoard, toAlgebraic } from './board.js';
import { isInCheck } from './attacks.js';
import { applyMove, legalMoves } from './moves.js';

export const STATUS = {
  PLAYING: 'playing',
  CHECK: 'check',
  CHECKMATE: 'checkmate',
  STALEMATE: 'stalemate',
  DRAW: 'draw',
};

// Schema version for persisted games; bump when the shape changes so old
// saves are discarded gracefully.
export const SAVE_VERSION = 1;

export function createGame() {
  const state = {
    board: createInitialBoard(),
    turn: WHITE,
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    enPassant: null,
    halfmove: 0,
    fullmove: 1,
  };
  return {
    version: SAVE_VERSION,
    state,
    status: STATUS.PLAYING,
    winner: null,
    captured: { w: [], b: [] }, // pieces captured BY white / BY black
    history: [],
  };
}

// Determine the status for the side whose turn it now is.
export function computeStatus(state) {
  const moves = legalMoves(state);
  const inCheck = isInCheck(state.board, state.turn);

  if (moves.length === 0) {
    return inCheck
      ? { status: STATUS.CHECKMATE, winner: opponent(state.turn) }
      : { status: STATUS.STALEMATE, winner: null };
  }
  // 50-move rule: 100 half-moves without a pawn move or capture.
  if (state.halfmove >= 100) {
    return { status: STATUS.DRAW, winner: null };
  }
  return {
    status: inCheck ? STATUS.CHECK : STATUS.PLAYING,
    winner: null,
  };
}

// Apply a fully-specified move object and return a new game. The caller is
// responsible for passing a legal move (the UI sources moves from
// `legalMovesForSquare`).
export function makeMove(game, move) {
  const nextState = applyMove(game.state, move);

  // Track captured pieces by the capturing color.
  const captured = {
    w: [...game.captured.w],
    b: [...game.captured.b],
  };
  if (move.captured) {
    captured[game.state.turn].push(move.captured.type);
  }

  const { status, winner } = computeStatus(nextState);

  const historyEntry = {
    from: toAlgebraic(move.from.row, move.from.col),
    to: toAlgebraic(move.to.row, move.to.col),
    piece: move.piece,
    color: move.color,
    capture: move.capture,
    promotion: move.isPromotion ? move.promotion : null,
    castle: move.castle,
    enPassant: move.enPassant,
  };

  return {
    version: SAVE_VERSION,
    state: nextState,
    status,
    winner,
    captured,
    history: [...game.history, historyEntry],
  };
}

export function isGameOver(game) {
  return (
    game.status === STATUS.CHECKMATE ||
    game.status === STATUS.STALEMATE ||
    game.status === STATUS.DRAW
  );
}

// --- Persistence helpers -------------------------------------------------

export function serializeGame(game) {
  return JSON.stringify(game);
}

// Parse a persisted game, validating the shape. Returns null on any problem so
// the caller can fall back to a fresh game rather than crashing.
export function deserializeGame(raw) {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (
      !data ||
      data.version !== SAVE_VERSION ||
      !data.state ||
      !Array.isArray(data.state.board) ||
      data.state.board.length !== 8
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export { WHITE, BLACK };
