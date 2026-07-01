import {
  WHITE, BLACK, KING, ROOK, opponent, createInitialBoard,
} from './constants';
import { getAllLegalMoves, getLegalMovesForSquare, isInCheck } from './moveGenerator';

export function createInitialState() {
  return {
    board: createInitialBoard(),
    turn: WHITE,
    castlingRights: {
      [WHITE]: { kingSide: true, queenSide: true },
      [BLACK]: { kingSide: true, queenSide: true },
    },
    enPassantTarget: null,
    capturedPieces: { [WHITE]: [], [BLACK]: [] },
    status: 'active', // active | check | checkmate | stalemate
    winner: null,
    lastMove: null,
  };
}

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function getLegalMoves(state, row, col) {
  return getLegalMovesForSquare(state.board, row, col, state);
}

export function getMoveTargets(state, row, col) {
  const piece = state.board[row][col];
  if (!piece || piece.color !== state.turn) return [];
  return getLegalMoves(state, row, col);
}

// Applies a chosen move (from getLegalMoves) to the game state and returns a brand-new state.
// `move` shape: { row, col, isCapture?, isEnPassant?, isDoublePawn?, promotion?, castle? }
export function applyMove(state, from, move) {
  const board = cloneBoard(state.board);
  const piece = board[from.row][from.col];
  const color = piece.color;
  const opp = opponent(color);
  const captured = board[move.row][move.col];

  board[from.row][from.col] = null;

  const capturedPieces = {
    [WHITE]: [...state.capturedPieces[WHITE]],
    [BLACK]: [...state.capturedPieces[BLACK]],
  };

  if (move.isEnPassant) {
    const capturedPawn = board[from.row][move.col];
    board[from.row][move.col] = null;
    capturedPieces[color].push(capturedPawn);
  } else if (captured) {
    capturedPieces[color].push(captured);
  }

  if (move.castle === 'K') {
    board[from.row][5] = board[from.row][7];
    board[from.row][7] = null;
  } else if (move.castle === 'Q') {
    board[from.row][3] = board[from.row][0];
    board[from.row][0] = null;
  }

  board[move.row][move.col] = move.promotion ? { type: move.promotion, color } : piece;

  const castlingRights = {
    [WHITE]: { ...state.castlingRights[WHITE] },
    [BLACK]: { ...state.castlingRights[BLACK] },
  };

  if (piece.type === KING) {
    castlingRights[color].kingSide = false;
    castlingRights[color].queenSide = false;
  }
  if (piece.type === ROOK) {
    if (from.row === (color === WHITE ? 7 : 0) && from.col === 0) castlingRights[color].queenSide = false;
    if (from.row === (color === WHITE ? 7 : 0) && from.col === 7) castlingRights[color].kingSide = false;
  }
  // If a rook is captured on its home square, lose that side's castling rights too.
  if (captured && captured.type === ROOK) {
    const homeRow = opp === WHITE ? 7 : 0;
    if (move.row === homeRow && move.col === 0) castlingRights[opp].queenSide = false;
    if (move.row === homeRow && move.col === 7) castlingRights[opp].kingSide = false;
  }

  let enPassantTarget = null;
  if (move.isDoublePawn) {
    const midRow = (from.row + move.row) / 2;
    enPassantTarget = { row: midRow, col: from.col };
  }

  const nextState = {
    board,
    turn: opp,
    castlingRights,
    enPassantTarget,
    capturedPieces,
    status: 'active',
    winner: null,
    lastMove: { from, to: { row: move.row, col: move.col } },
  };

  const legalMoves = getAllLegalMoves(board, opp, nextState);
  const inCheck = isInCheck(board, opp);

  if (legalMoves.length === 0) {
    nextState.status = inCheck ? 'checkmate' : 'stalemate';
    nextState.winner = inCheck ? color : null;
  } else if (inCheck) {
    nextState.status = 'check';
  }

  return nextState;
}

export function isGameOver(state) {
  return state.status === 'checkmate' || state.status === 'stalemate';
}
