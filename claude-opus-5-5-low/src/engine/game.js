import { createInitialBoard, isOnBoard } from './board.js';
import { BLACK, GAME_STATUS, KING, PROMOTION_PIECES, ROOK, WHITE, opponent } from './constants.js';
import { applyMoveToBoard, getAllLegalMoves, getLegalMoves, isInCheck } from './moves.js';

export function createInitialState() {
  return {
    board: createInitialBoard(),
    turn: WHITE,
    castlingRights: {
      [WHITE]: { kingSide: true, queenSide: true },
      [BLACK]: { kingSide: true, queenSide: true },
    },
    enPassantTarget: null,
    captured: { [WHITE]: [], [BLACK]: [] },
    status: GAME_STATUS.ACTIVE,
    lastMove: null,
  };
}

export function computeStatus(state) {
  const hasMoves = getAllLegalMoves(state).length > 0;
  const inCheck = isInCheck(state.board, state.turn);
  if (!hasMoves) return inCheck ? GAME_STATUS.CHECKMATE : GAME_STATUS.STALEMATE;
  return inCheck ? GAME_STATUS.CHECK : GAME_STATUS.ACTIVE;
}

export const isGameOver = (state) =>
  state.status === GAME_STATUS.CHECKMATE || state.status === GAME_STATUS.STALEMATE;

function updateCastlingRights(rights, move, piece, capturedSquarePiece) {
  const next = { [WHITE]: { ...rights[WHITE] }, [BLACK]: { ...rights[BLACK] } };
  const revokeRookSide = (color, row, col) => {
    const home = color === WHITE ? 7 : 0;
    if (row !== home) return;
    if (col === 0) next[color].queenSide = false;
    if (col === 7) next[color].kingSide = false;
  };

  if (piece.type === KING) {
    next[piece.color] = { kingSide: false, queenSide: false };
  } else if (piece.type === ROOK) {
    revokeRookSide(piece.color, move.from.row, move.from.col);
  }
  if (capturedSquarePiece?.type === ROOK) {
    revokeRookSide(capturedSquarePiece.color, move.to.row, move.to.col);
  }
  return next;
}

const sameSquare = (a, b) => a.row === b.row && a.col === b.col;

export function findLegalMove(state, from, to) {
  if (!isOnBoard(from?.row, from?.col) || !isOnBoard(to?.row, to?.col)) return null;
  return getLegalMoves(state, from).find((move) => sameSquare(move.to, to)) ?? null;
}

export function makeMove(state, from, to, promotionType) {
  if (isGameOver(state)) throw new Error('Game is over');
  const move = findLegalMove(state, from, to);
  if (!move) throw new Error('Illegal move');
  if (move.promotion && !PROMOTION_PIECES.includes(promotionType)) {
    throw new Error('Invalid promotion piece');
  }

  const piece = state.board[from.row][from.col];
  const capturedSquarePiece = state.board[to.row][to.col];
  const { board, captured } = applyMoveToBoard(state.board, move, promotionType);

  const nextCaptured = {
    [WHITE]: [...state.captured[WHITE]],
    [BLACK]: [...state.captured[BLACK]],
  };
  if (captured) nextCaptured[piece.color].push(captured.type);

  const nextState = {
    board,
    turn: opponent(state.turn),
    castlingRights: updateCastlingRights(state.castlingRights, move, piece, capturedSquarePiece),
    enPassantTarget: move.doublePush ? { row: (from.row + to.row) / 2, col: from.col } : null,
    captured: nextCaptured,
    lastMove: { from, to },
    status: GAME_STATUS.ACTIVE,
  };
  nextState.status = computeStatus(nextState);
  return nextState;
}
