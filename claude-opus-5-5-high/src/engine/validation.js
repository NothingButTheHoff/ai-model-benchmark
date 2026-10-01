import { BOARD_SIZE, COLORS, KING, PIECE_TYPES } from './constants.js';
import { isInsideBoard } from './board.js';

const isObject = (value) => typeof value === 'object' && value !== null;

const isValidSquare = (square) =>
  isObject(square) && Number.isInteger(square.row) && Number.isInteger(square.col) &&
  isInsideBoard(square.row, square.col);

const isValidPiece = (piece) =>
  piece === null ||
  (isObject(piece) && PIECE_TYPES.includes(piece.type) && COLORS.includes(piece.color));

function isValidBoard(board) {
  if (!Array.isArray(board) || board.length !== BOARD_SIZE) return false;
  const rowsValid = board.every(
    (row) => Array.isArray(row) && row.length === BOARD_SIZE && row.every(isValidPiece),
  );
  if (!rowsValid) return false;

  const pieces = board.flat().filter(Boolean);
  return COLORS.every(
    (color) => pieces.filter((piece) => piece.type === KING && piece.color === color).length === 1,
  );
}

const isValidCastlingRights = (rights) =>
  isObject(rights) &&
  COLORS.every(
    (color) =>
      isObject(rights[color]) &&
      typeof rights[color].kingSide === 'boolean' &&
      typeof rights[color].queenSide === 'boolean',
  );

const isValidCapturedBy = (capturedBy) =>
  isObject(capturedBy) &&
  COLORS.every(
    (color) => Array.isArray(capturedBy[color]) && capturedBy[color].every((type) => PIECE_TYPES.includes(type)),
  );

const isValidLastMove = (lastMove) =>
  lastMove === null || (isObject(lastMove) && isValidSquare(lastMove.from) && isValidSquare(lastMove.to));

export function isValidGameState(state) {
  return (
    isObject(state) &&
    isValidBoard(state.board) &&
    COLORS.includes(state.turn) &&
    isValidCastlingRights(state.castlingRights) &&
    (state.enPassantTarget === null || isValidSquare(state.enPassantTarget)) &&
    isValidCapturedBy(state.capturedBy) &&
    isValidLastMove(state.lastMove)
  );
}
