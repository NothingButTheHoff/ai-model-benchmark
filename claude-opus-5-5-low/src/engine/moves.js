import { cloneBoard, findKing, isOnBoard } from './board.js';
import { BISHOP, KING, KNIGHT, PAWN, QUEEN, ROOK, WHITE, opponent } from './constants.js';

const KNIGHT_OFFSETS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING_OFFSETS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const ROOK_DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const BISHOP_DIRECTIONS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

const pawnDirection = (color) => (color === WHITE ? -1 : 1);
const pawnStartRow = (color) => (color === WHITE ? 6 : 1);
const promotionRow = (color) => (color === WHITE ? 0 : 7);
const homeRow = (color) => (color === WHITE ? 7 : 0);

export function isSquareAttacked(board, row, col, byColor) {
  const pawnRow = row - pawnDirection(byColor);
  for (const dc of [-1, 1]) {
    if (!isOnBoard(pawnRow, col + dc)) continue;
    const piece = board[pawnRow][col + dc];
    if (piece && piece.color === byColor && piece.type === PAWN) return true;
  }

  const hasPieceAt = (r, c, types) => {
    if (!isOnBoard(r, c)) return false;
    const piece = board[r][c];
    return Boolean(piece && piece.color === byColor && types.includes(piece.type));
  };

  if (KNIGHT_OFFSETS.some(([dr, dc]) => hasPieceAt(row + dr, col + dc, [KNIGHT]))) return true;
  if (KING_OFFSETS.some(([dr, dc]) => hasPieceAt(row + dr, col + dc, [KING]))) return true;

  const attackedAlongRay = (directions, types) =>
    directions.some(([dr, dc]) => {
      let r = row + dr;
      let c = col + dc;
      while (isOnBoard(r, c)) {
        if (board[r][c]) return hasPieceAt(r, c, types);
        r += dr;
        c += dc;
      }
      return false;
    });

  return attackedAlongRay(ROOK_DIRECTIONS, [ROOK, QUEEN]) || attackedAlongRay(BISHOP_DIRECTIONS, [BISHOP, QUEEN]);
}

export function isInCheck(board, color) {
  const king = findKing(board, color);
  return king ? isSquareAttacked(board, king.row, king.col, opponent(color)) : false;
}

const createMove = (from, to, flags = {}) => ({ from, to, ...flags });

function slidingMoves(board, from, color, directions) {
  const moves = [];
  for (const [dr, dc] of directions) {
    let r = from.row + dr;
    let c = from.col + dc;
    while (isOnBoard(r, c)) {
      const target = board[r][c];
      if (target && target.color === color) break;
      moves.push(createMove(from, { row: r, col: c }, { capture: Boolean(target) }));
      if (target) break;
      r += dr;
      c += dc;
    }
  }
  return moves;
}

function stepMoves(board, from, color, offsets) {
  return offsets
    .map(([dr, dc]) => ({ row: from.row + dr, col: from.col + dc }))
    .filter(({ row, col }) => isOnBoard(row, col) && board[row][col]?.color !== color)
    .map((to) => createMove(from, to, { capture: Boolean(board[to.row][to.col]) }));
}

function pawnMoves(board, from, color, enPassantTarget) {
  const moves = [];
  const dir = pawnDirection(color);
  const oneStep = from.row + dir;
  const isPromotion = oneStep === promotionRow(color);

  if (isOnBoard(oneStep, from.col) && !board[oneStep][from.col]) {
    moves.push(createMove(from, { row: oneStep, col: from.col }, { promotion: isPromotion }));
    const twoStep = from.row + 2 * dir;
    if (from.row === pawnStartRow(color) && !board[twoStep][from.col]) {
      moves.push(createMove(from, { row: twoStep, col: from.col }, { doublePush: true }));
    }
  }

  for (const dc of [-1, 1]) {
    const col = from.col + dc;
    if (!isOnBoard(oneStep, col)) continue;
    const target = board[oneStep][col];
    if (target && target.color !== color) {
      moves.push(createMove(from, { row: oneStep, col }, { capture: true, promotion: isPromotion }));
    } else if (enPassantTarget && enPassantTarget.row === oneStep && enPassantTarget.col === col) {
      moves.push(createMove(from, { row: oneStep, col }, { capture: true, enPassant: true }));
    }
  }
  return moves;
}

function castlingMoves(board, from, color, castlingRights) {
  const row = homeRow(color);
  const enemy = opponent(color);
  if (from.row !== row || from.col !== 4 || isSquareAttacked(board, row, 4, enemy)) return [];

  const rights = castlingRights[color];
  const options = [
    { allowed: rights.kingSide, rookCol: 7, emptyCols: [5, 6], safeCols: [5, 6], kingTo: 6, side: 'king' },
    { allowed: rights.queenSide, rookCol: 0, emptyCols: [1, 2, 3], safeCols: [3, 2], kingTo: 2, side: 'queen' },
  ];

  return options
    .filter(({ allowed, rookCol, emptyCols, safeCols }) => {
      const rook = board[row][rookCol];
      return (
        allowed &&
        rook?.type === ROOK &&
        rook.color === color &&
        emptyCols.every((c) => !board[row][c]) &&
        safeCols.every((c) => !isSquareAttacked(board, row, c, enemy))
      );
    })
    .map(({ kingTo, side }) => createMove(from, { row, col: kingTo }, { castle: side }));
}

function pseudoLegalMoves(state, from) {
  const { board, enPassantTarget, castlingRights } = state;
  const piece = board[from.row][from.col];
  if (!piece) return [];

  switch (piece.type) {
    case PAWN:
      return pawnMoves(board, from, piece.color, enPassantTarget);
    case KNIGHT:
      return stepMoves(board, from, piece.color, KNIGHT_OFFSETS);
    case BISHOP:
      return slidingMoves(board, from, piece.color, BISHOP_DIRECTIONS);
    case ROOK:
      return slidingMoves(board, from, piece.color, ROOK_DIRECTIONS);
    case QUEEN:
      return slidingMoves(board, from, piece.color, [...ROOK_DIRECTIONS, ...BISHOP_DIRECTIONS]);
    case KING:
      return [...stepMoves(board, from, piece.color, KING_OFFSETS), ...castlingMoves(board, from, piece.color, castlingRights)];
    default:
      return [];
  }
}

export function applyMoveToBoard(board, move, promotionType = QUEEN) {
  const next = cloneBoard(board);
  const { from, to } = move;
  const piece = next[from.row][from.col];
  let captured = next[to.row][to.col];

  if (move.enPassant) {
    captured = next[from.row][to.col];
    next[from.row][to.col] = null;
  }

  if (move.castle) {
    const rookFrom = move.castle === 'king' ? 7 : 0;
    const rookTo = move.castle === 'king' ? 5 : 3;
    next[from.row][rookTo] = next[from.row][rookFrom];
    next[from.row][rookFrom] = null;
  }

  next[to.row][to.col] = move.promotion ? { type: promotionType, color: piece.color } : piece;
  next[from.row][from.col] = null;

  return { board: next, captured };
}

export function getLegalMoves(state, from) {
  const piece = state.board[from.row]?.[from.col];
  if (!piece || piece.color !== state.turn) return [];
  return pseudoLegalMoves(state, from).filter(
    (move) => !isInCheck(applyMoveToBoard(state.board, move).board, piece.color),
  );
}

export function getAllLegalMoves(state) {
  const moves = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      moves.push(...getLegalMoves(state, { row, col }));
    }
  }
  return moves;
}
