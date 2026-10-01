import { BLACK, COLORS, GAME_STATUS, KING, PAWN, PROMOTION_TYPES, WHITE } from './constants.js';
import { createInitialBoard, homeRow, isSameSquare, opponentOf } from './board.js';
import { applyMoveToBoard, CASTLING_ROOK_COLUMNS, getAllLegalMoves, getLegalMoves, isInCheck } from './moves.js';

const createFullCastlingRights = () => ({
  [WHITE]: { kingSide: true, queenSide: true },
  [BLACK]: { kingSide: true, queenSide: true },
});

export function computeStatus(state) {
  const hasLegalMoves = getAllLegalMoves(state).length > 0;
  const inCheck = isInCheck(state.board, state.turn);

  if (!hasLegalMoves) return inCheck ? GAME_STATUS.CHECKMATE : GAME_STATUS.STALEMATE;
  return inCheck ? GAME_STATUS.CHECK : GAME_STATUS.PLAYING;
}

export function createInitialState() {
  const state = {
    board: createInitialBoard(),
    turn: WHITE,
    castlingRights: createFullCastlingRights(),
    enPassantTarget: null,
    capturedBy: { [WHITE]: [], [BLACK]: [] },
    lastMove: null,
  };
  return { ...state, status: computeStatus(state) };
}

export const isGameOver = (status) =>
  status === GAME_STATUS.CHECKMATE || status === GAME_STATUS.STALEMATE;

function updateCastlingRights(castlingRights, piece, move) {
  const rights = {
    [WHITE]: { ...castlingRights[WHITE] },
    [BLACK]: { ...castlingRights[BLACK] },
  };

  if (piece.type === KING) {
    rights[piece.color] = { kingSide: false, queenSide: false };
  }

  COLORS.forEach((color) => {
    Object.entries(CASTLING_ROOK_COLUMNS).forEach(([side, col]) => {
      const corner = { row: homeRow(color), col };
      if (isSameSquare(move.from, corner) || isSameSquare(move.to, corner)) {
        rights[color][side] = false;
      }
    });
  });

  return rights;
}

function getEnPassantTarget(piece, move) {
  const isDoubleStep = piece.type === PAWN && Math.abs(move.to.row - move.from.row) === 2;
  return isDoubleStep ? { row: (move.from.row + move.to.row) / 2, col: move.from.col } : null;
}

function getCapturedPiece(board, move) {
  if (move.isEnPassant) return board[move.from.row][move.to.col];
  return board[move.to.row][move.to.col];
}

/**
 * Applies a move if it is legal. Returns the next game state, or null when the move is rejected.
 */
export function makeMove(state, from, to, promotionType) {
  if (isGameOver(state.status)) return null;

  const move = getLegalMoves(state, from).find((candidate) => isSameSquare(candidate.to, to));
  if (!move) return null;
  if (move.isPromotion && !PROMOTION_TYPES.includes(promotionType)) return null;

  const piece = state.board[from.row][from.col];
  const captured = getCapturedPiece(state.board, move);
  const capturedBy = captured
    ? { ...state.capturedBy, [piece.color]: [...state.capturedBy[piece.color], captured.type] }
    : state.capturedBy;

  const nextState = {
    board: applyMoveToBoard(state.board, move, promotionType),
    turn: opponentOf(state.turn),
    castlingRights: updateCastlingRights(state.castlingRights, piece, move),
    enPassantTarget: getEnPassantTarget(piece, move),
    capturedBy,
    lastMove: { from: move.from, to: move.to },
  };

  return { ...nextState, status: computeStatus(nextState) };
}
