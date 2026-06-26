// Move generation, legality filtering, and move application.

import {
  WHITE,
  BLACK,
  PAWN,
  KNIGHT,
  BISHOP,
  ROOK,
  QUEEN,
  KING,
  opponent,
} from './constants.js';
import { inBounds, pieceAt, cloneBoard } from './board.js';
import { isSquareAttacked, isInCheck } from './attacks.js';

const KNIGHT_OFFSETS = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
];

const KING_OFFSETS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

const BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ROOK_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const QUEEN_DIRS = [...BISHOP_DIRS, ...ROOK_DIRS];

// Build a normalized move object with sensible defaults.
function makeMove(from, to, piece, extra = {}) {
  return {
    from,
    to,
    piece: piece.type,
    color: piece.color,
    capture: false,
    captured: null, // { type, color, row, col } — row/col matter for en passant
    promotion: null, // chosen promotion piece type when isPromotion
    isPromotion: false,
    castle: null, // 'K' (kingside) | 'Q' (queenside)
    enPassant: false,
    doublePush: false,
    ...extra,
  };
}

// All pseudo-legal moves (may leave own king in check) for a side.
export function generatePseudoMoves(state, color) {
  const moves = [];
  const { board } = state;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        generatePieceMoves(state, row, col, piece, moves);
      }
    }
  }
  return moves;
}

function generatePieceMoves(state, row, col, piece, moves) {
  switch (piece.type) {
    case PAWN:
      pawnMoves(state, row, col, piece, moves);
      break;
    case KNIGHT:
      stepMoves(state, row, col, piece, KNIGHT_OFFSETS, moves);
      break;
    case BISHOP:
      slideMoves(state, row, col, piece, BISHOP_DIRS, moves);
      break;
    case ROOK:
      slideMoves(state, row, col, piece, ROOK_DIRS, moves);
      break;
    case QUEEN:
      slideMoves(state, row, col, piece, QUEEN_DIRS, moves);
      break;
    case KING:
      stepMoves(state, row, col, piece, KING_OFFSETS, moves);
      castlingMoves(state, row, col, piece, moves);
      break;
    default:
      break;
  }
}

function pawnMoves(state, row, col, piece, moves) {
  const { board, enPassant } = state;
  const dir = piece.color === WHITE ? -1 : 1; // White moves up (smaller rows).
  const startRow = piece.color === WHITE ? 6 : 1;
  const promotionRow = piece.color === WHITE ? 0 : 7;
  const from = { row, col };

  // Single forward push.
  const oneRow = row + dir;
  if (inBounds(oneRow, col) && !board[oneRow][col]) {
    addPawnAdvance(from, { row: oneRow, col }, piece, promotionRow, moves);

    // Double forward push from the starting rank.
    const twoRow = row + 2 * dir;
    if (row === startRow && !board[twoRow][col]) {
      moves.push(makeMove(from, { row: twoRow, col }, piece, { doublePush: true }));
    }
  }

  // Diagonal captures (including en passant).
  for (const dc of [-1, 1]) {
    const r = row + dir;
    const c = col + dc;
    if (!inBounds(r, c)) continue;

    const target = board[r][c];
    if (target && target.color !== piece.color) {
      addPawnCapture(from, { row: r, col: c }, piece, target, promotionRow, moves);
    } else if (
      !target &&
      enPassant &&
      enPassant.row === r &&
      enPassant.col === c
    ) {
      // En passant: the captured pawn sits on the moving pawn's own row.
      const capturedPawn = board[row][c];
      moves.push(
        makeMove(from, { row: r, col: c }, piece, {
          capture: true,
          enPassant: true,
          captured: {
            type: capturedPawn.type,
            color: capturedPawn.color,
            row,
            col: c,
          },
        }),
      );
    }
  }
}

function addPawnAdvance(from, to, piece, promotionRow, moves) {
  if (to.row === promotionRow) {
    moves.push(makeMove(from, to, piece, { isPromotion: true, promotion: QUEEN }));
  } else {
    moves.push(makeMove(from, to, piece));
  }
}

function addPawnCapture(from, to, piece, target, promotionRow, moves) {
  const captured = { type: target.type, color: target.color, row: to.row, col: to.col };
  if (to.row === promotionRow) {
    moves.push(
      makeMove(from, to, piece, {
        capture: true,
        captured,
        isPromotion: true,
        promotion: QUEEN,
      }),
    );
  } else {
    moves.push(makeMove(from, to, piece, { capture: true, captured }));
  }
}

function stepMoves(state, row, col, piece, offsets, moves) {
  const { board } = state;
  const from = { row, col };
  for (const [dr, dc] of offsets) {
    const r = row + dr;
    const c = col + dc;
    if (!inBounds(r, c)) continue;
    const target = board[r][c];
    if (!target) {
      moves.push(makeMove(from, { row: r, col: c }, piece));
    } else if (target.color !== piece.color) {
      moves.push(
        makeMove(from, { row: r, col: c }, piece, {
          capture: true,
          captured: { type: target.type, color: target.color, row: r, col: c },
        }),
      );
    }
  }
}

function slideMoves(state, row, col, piece, dirs, moves) {
  const { board } = state;
  const from = { row, col };
  for (const [dr, dc] of dirs) {
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c)) {
      const target = board[r][c];
      if (!target) {
        moves.push(makeMove(from, { row: r, col: c }, piece));
      } else {
        if (target.color !== piece.color) {
          moves.push(
            makeMove(from, { row: r, col: c }, piece, {
              capture: true,
              captured: { type: target.type, color: target.color, row: r, col: c },
            }),
          );
        }
        break; // Blocked by a piece (captured or own).
      }
      r += dr;
      c += dc;
    }
  }
}

function castlingMoves(state, row, col, piece, moves) {
  const { board, castling } = state;
  const color = piece.color;
  const enemy = opponent(color);
  const homeRow = color === WHITE ? 7 : 0;

  // King must be on its home square and not currently in check.
  if (row !== homeRow || col !== 4) return;
  if (isSquareAttacked(board, row, 4, enemy)) return;

  const rights = color === WHITE
    ? { K: castling.wK, Q: castling.wQ }
    : { K: castling.bK, Q: castling.bQ };

  // Kingside: squares f and g must be empty, and the king must not pass
  // through or land on an attacked square.
  if (rights.K) {
    const rook = board[homeRow][7];
    if (
      rook && rook.type === ROOK && rook.color === color &&
      !board[homeRow][5] && !board[homeRow][6] &&
      !isSquareAttacked(board, homeRow, 5, enemy) &&
      !isSquareAttacked(board, homeRow, 6, enemy)
    ) {
      moves.push(
        makeMove({ row, col }, { row: homeRow, col: 6 }, piece, { castle: 'K' }),
      );
    }
  }

  // Queenside: squares b, c, d must be empty; king passes through d and c.
  if (rights.Q) {
    const rook = board[homeRow][0];
    if (
      rook && rook.type === ROOK && rook.color === color &&
      !board[homeRow][1] && !board[homeRow][2] && !board[homeRow][3] &&
      !isSquareAttacked(board, homeRow, 3, enemy) &&
      !isSquareAttacked(board, homeRow, 2, enemy)
    ) {
      moves.push(
        makeMove({ row, col }, { row: homeRow, col: 2 }, piece, { castle: 'Q' }),
      );
    }
  }
}

// Apply a move to `state`, returning a brand new state object. Does not mutate
// the input. Turn is switched; status is computed by the game layer.
export function applyMove(state, move) {
  const board = cloneBoard(state.board);
  const color = state.turn;
  const movingPiece = board[move.from.row][move.from.col];

  // Remove an en-passant-captured pawn from its own square.
  if (move.enPassant && move.captured) {
    board[move.captured.row][move.captured.col] = null;
  }

  // Move the piece.
  board[move.from.row][move.from.col] = null;
  if (move.isPromotion) {
    board[move.to.row][move.to.col] = {
      type: move.promotion || QUEEN,
      color,
    };
  } else {
    board[move.to.row][move.to.col] = { ...movingPiece };
  }

  // Move the rook when castling.
  if (move.castle) {
    const homeRow = move.from.row;
    if (move.castle === 'K') {
      board[homeRow][5] = board[homeRow][7];
      board[homeRow][7] = null;
    } else {
      board[homeRow][3] = board[homeRow][0];
      board[homeRow][0] = null;
    }
  }

  // Update castling rights.
  const castling = { ...state.castling };
  if (movingPiece.type === KING) {
    if (color === WHITE) { castling.wK = false; castling.wQ = false; }
    else { castling.bK = false; castling.bQ = false; }
  }
  // Rook leaving its home square.
  revokeRookRight(castling, color, move.from.row, move.from.col);
  // Rook captured on its home square (use the captured square, which differs
  // from `to` only for en passant — irrelevant for rooks).
  if (move.captured) {
    revokeRookRight(castling, opponent(color), move.captured.row, move.captured.col);
  }

  // En passant target: only set when a pawn double-pushes.
  let enPassant = null;
  if (move.doublePush) {
    enPassant = { row: (move.from.row + move.to.row) / 2, col: move.from.col };
  }

  // Halfmove clock: reset on pawn moves and captures, else increment.
  const halfmove =
    move.piece === PAWN || move.capture ? 0 : state.halfmove + 1;
  const fullmove = color === BLACK ? state.fullmove + 1 : state.fullmove;

  return {
    board,
    turn: opponent(color),
    castling,
    enPassant,
    halfmove,
    fullmove,
  };
}

function revokeRookRight(castling, color, row, col) {
  if (color === WHITE && row === 7) {
    if (col === 0) castling.wQ = false;
    if (col === 7) castling.wK = false;
  } else if (color === BLACK && row === 0) {
    if (col === 0) castling.bQ = false;
    if (col === 7) castling.bK = false;
  }
}

// Filter pseudo-legal moves to those that do not leave the mover's king in
// check.
export function legalMoves(state) {
  const color = state.turn;
  const pseudo = generatePseudoMoves(state, color);
  return pseudo.filter((move) => {
    const next = applyMove(state, move);
    return !isInCheck(next.board, color);
  });
}

// Legal moves originating from a specific square (used by the UI).
export function legalMovesForSquare(state, row, col) {
  const piece = pieceAt(state.board, row, col);
  if (!piece || piece.color !== state.turn) return [];
  const pseudo = [];
  generatePieceMoves(state, row, col, piece, pseudo);
  return pseudo.filter((move) => {
    const next = applyMove(state, move);
    return !isInCheck(next.board, state.turn);
  });
}
