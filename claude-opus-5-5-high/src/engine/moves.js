import {
  BISHOP,
  KING,
  KNIGHT,
  PAWN,
  QUEEN,
  ROOK,
} from './constants.js';
import {
  cloneBoard,
  findKing,
  homeRow,
  isInsideBoard,
  opponentOf,
  pawnDirection,
  pawnStartRow,
  promotionRow,
} from './board.js';

const KNIGHT_OFFSETS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const ORTHOGONAL_DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIAGONAL_DIRECTIONS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ALL_DIRECTIONS = [...ORTHOGONAL_DIRECTIONS, ...DIAGONAL_DIRECTIONS];

const SLIDING_DIRECTIONS = {
  [BISHOP]: DIAGONAL_DIRECTIONS,
  [ROOK]: ORTHOGONAL_DIRECTIONS,
  [QUEEN]: ALL_DIRECTIONS,
};

const CASTLING_SIDES = {
  kingSide: { rookCol: 7, kingTargetCol: 6, rookTargetCol: 5, emptyCols: [5, 6], safeCols: [5, 6] },
  queenSide: { rookCol: 0, kingTargetCol: 2, rookTargetCol: 3, emptyCols: [1, 2, 3], safeCols: [3, 2] },
};

const createMove = (from, to, extras = {}) => ({
  from,
  to,
  isCapture: false,
  isEnPassant: false,
  isPromotion: false,
  castle: null,
  ...extras,
});

function hasPieceAt(board, row, col, color, types) {
  if (!isInsideBoard(row, col)) return false;
  const piece = board[row][col];
  return piece !== null && piece.color === color && types.includes(piece.type);
}

function isAttackedBySlider(board, row, col, byColor, directions, types) {
  return directions.some(([dRow, dCol]) => {
    let r = row + dRow;
    let c = col + dCol;
    while (isInsideBoard(r, c)) {
      const piece = board[r][c];
      if (piece) return piece.color === byColor && types.includes(piece.type);
      r += dRow;
      c += dCol;
    }
    return false;
  });
}

export function isSquareAttacked(board, row, col, byColor) {
  const pawnRow = row - pawnDirection(byColor);
  if (hasPieceAt(board, pawnRow, col - 1, byColor, [PAWN]) || hasPieceAt(board, pawnRow, col + 1, byColor, [PAWN])) {
    return true;
  }
  if (KNIGHT_OFFSETS.some(([dRow, dCol]) => hasPieceAt(board, row + dRow, col + dCol, byColor, [KNIGHT]))) {
    return true;
  }
  if (ALL_DIRECTIONS.some(([dRow, dCol]) => hasPieceAt(board, row + dRow, col + dCol, byColor, [KING]))) {
    return true;
  }
  return (
    isAttackedBySlider(board, row, col, byColor, ORTHOGONAL_DIRECTIONS, [ROOK, QUEEN]) ||
    isAttackedBySlider(board, row, col, byColor, DIAGONAL_DIRECTIONS, [BISHOP, QUEEN])
  );
}

export function isInCheck(board, color) {
  const king = findKing(board, color);
  return king !== null && isSquareAttacked(board, king.row, king.col, opponentOf(color));
}

function generateStepMoves(board, from, color, offsets) {
  const moves = [];
  offsets.forEach(([dRow, dCol]) => {
    const row = from.row + dRow;
    const col = from.col + dCol;
    if (!isInsideBoard(row, col)) return;
    const target = board[row][col];
    if (target?.color === color) return;
    moves.push(createMove(from, { row, col }, { isCapture: target !== null }));
  });
  return moves;
}

function generateSlidingMoves(board, from, color, directions) {
  const moves = [];
  directions.forEach(([dRow, dCol]) => {
    let row = from.row + dRow;
    let col = from.col + dCol;
    while (isInsideBoard(row, col)) {
      const target = board[row][col];
      if (target?.color === color) break;
      moves.push(createMove(from, { row, col }, { isCapture: target !== null }));
      if (target) break;
      row += dRow;
      col += dCol;
    }
  });
  return moves;
}

function generatePawnMoves(state, from, color) {
  const { board, enPassantTarget } = state;
  const direction = pawnDirection(color);
  const isPromotion = from.row + direction === promotionRow(color);
  const moves = [];

  const oneStep = from.row + direction;
  if (isInsideBoard(oneStep, from.col) && board[oneStep][from.col] === null) {
    moves.push(createMove(from, { row: oneStep, col: from.col }, { isPromotion }));
    const twoStep = from.row + 2 * direction;
    if (from.row === pawnStartRow(color) && board[twoStep][from.col] === null) {
      moves.push(createMove(from, { row: twoStep, col: from.col }));
    }
  }

  [from.col - 1, from.col + 1].forEach((col) => {
    if (!isInsideBoard(oneStep, col)) return;
    const target = board[oneStep][col];
    if (target && target.color !== color) {
      moves.push(createMove(from, { row: oneStep, col }, { isCapture: true, isPromotion }));
    } else if (enPassantTarget?.row === oneStep && enPassantTarget.col === col) {
      moves.push(createMove(from, { row: oneStep, col }, { isCapture: true, isEnPassant: true }));
    }
  });

  return moves;
}

function generateCastlingMoves(state, from, color) {
  const { board, castlingRights } = state;
  const row = homeRow(color);
  const opponent = opponentOf(color);
  const rights = castlingRights[color];

  if (from.row !== row || from.col !== 4 || isSquareAttacked(board, row, 4, opponent)) return [];

  return Object.entries(CASTLING_SIDES)
    .filter(([side, { rookCol, emptyCols, safeCols }]) =>
      rights[side] &&
      hasPieceAt(board, row, rookCol, color, [ROOK]) &&
      emptyCols.every((col) => board[row][col] === null) &&
      safeCols.every((col) => !isSquareAttacked(board, row, col, opponent)),
    )
    .map(([side, { kingTargetCol }]) => createMove(from, { row, col: kingTargetCol }, { castle: side }));
}

function generatePseudoLegalMoves(state, from) {
  const piece = state.board[from.row][from.col];
  const { board } = state;

  switch (piece.type) {
    case PAWN:
      return generatePawnMoves(state, from, piece.color);
    case KNIGHT:
      return generateStepMoves(board, from, piece.color, KNIGHT_OFFSETS);
    case KING:
      return [
        ...generateStepMoves(board, from, piece.color, ALL_DIRECTIONS),
        ...generateCastlingMoves(state, from, piece.color),
      ];
    default:
      return generateSlidingMoves(board, from, piece.color, SLIDING_DIRECTIONS[piece.type]);
  }
}

export function applyMoveToBoard(board, move, promotionType = QUEEN) {
  const next = cloneBoard(board);
  const { from, to } = move;
  const piece = next[from.row][from.col];

  next[from.row][from.col] = null;
  next[to.row][to.col] = move.isPromotion ? { type: promotionType, color: piece.color } : piece;

  if (move.isEnPassant) {
    next[from.row][to.col] = null;
  }

  if (move.castle) {
    const { rookCol, rookTargetCol } = CASTLING_SIDES[move.castle];
    next[from.row][rookTargetCol] = next[from.row][rookCol];
    next[from.row][rookCol] = null;
  }

  return next;
}

export function getLegalMoves(state, from) {
  if (!from || !isInsideBoard(from.row, from.col)) return [];
  const piece = state.board[from.row][from.col];
  if (!piece || piece.color !== state.turn) return [];

  return generatePseudoLegalMoves(state, from).filter(
    (move) => !isInCheck(applyMoveToBoard(state.board, move), piece.color),
  );
}

export function getAllLegalMoves(state) {
  const moves = [];
  state.board.forEach((rowPieces, row) => {
    rowPieces.forEach((piece, col) => {
      if (piece?.color === state.turn) moves.push(...getLegalMoves(state, { row, col }));
    });
  });
  return moves;
}

export const CASTLING_ROOK_COLUMNS = Object.fromEntries(
  Object.entries(CASTLING_SIDES).map(([side, { rookCol }]) => [side, rookCol]),
);
