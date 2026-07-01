export const WHITE = 'w';
export const BLACK = 'b';

export const PIECE_NAMES = {
  k: 'King',
  q: 'Queen',
  r: 'Rook',
  b: 'Bishop',
  n: 'Knight',
  p: 'Pawn',
};

export const PIECE_SYMBOLS = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

const BOARD_SIZE = 8;
const PROMOTION_TYPES = new Set(['q', 'r', 'b', 'n']);
const BACK_RANK = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

function piece(type, color) {
  return { type, color };
}

function emptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

function baseStatus() {
  return {
    check: false,
    checkmate: false,
    stalemate: false,
    winner: null,
    message: '',
  };
}

export function createInitialState() {
  const board = emptyBoard();

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    board[0][col] = piece(BACK_RANK[col], BLACK);
    board[1][col] = piece('p', BLACK);
    board[6][col] = piece('p', WHITE);
    board[7][col] = piece(BACK_RANK[col], WHITE);
  }

  return finalizeState({
    board,
    turn: WHITE,
    castling: {
      w: { k: true, q: true },
      b: { k: true, q: true },
    },
    enPassant: null,
    captured: { w: [], b: [] },
    halfmoveClock: 0,
    fullmoveNumber: 1,
    lastMove: null,
    status: baseStatus(),
  });
}

export function createCustomState({
  board,
  turn = WHITE,
  castling = { w: { k: false, q: false }, b: { k: false, q: false } },
  enPassant = null,
  captured = { w: [], b: [] },
  halfmoveClock = 0,
  fullmoveNumber = 1,
  lastMove = null,
} = {}) {
  if (!Array.isArray(board) || board.length !== BOARD_SIZE) {
    throw new Error('Custom state requires an 8x8 board.');
  }

  return finalizeState({
    board: board.map((row) => row.map((entry) => (entry ? { ...entry } : null))),
    turn,
    castling: cloneCastling(castling),
    enPassant: enPassant ? { ...enPassant } : null,
    captured: {
      w: [...(captured.w ?? [])],
      b: [...(captured.b ?? [])],
    },
    halfmoveClock,
    fullmoveNumber,
    lastMove: lastMove ? structuredCloneSafe(lastMove) : null,
    status: baseStatus(),
  });
}

export function createEmptyBoard() {
  return emptyBoard();
}

export function hydrateState(value) {
  const state = typeof value === 'string' ? JSON.parse(value) : value;
  if (!state || !Array.isArray(state.board) || state.board.length !== BOARD_SIZE) {
    throw new Error('Saved game data is not a chess state.');
  }

  const board = state.board.map((row) => {
    if (!Array.isArray(row) || row.length !== BOARD_SIZE) {
      throw new Error('Saved board has an invalid shape.');
    }

    return row.map((entry) => {
      if (entry === null) return null;
      if (!entry || !['k', 'q', 'r', 'b', 'n', 'p'].includes(entry.type) || ![WHITE, BLACK].includes(entry.color)) {
        throw new Error('Saved board contains an invalid piece.');
      }
      return { type: entry.type, color: entry.color };
    });
  });

  return finalizeState({
    board,
    turn: state.turn === BLACK ? BLACK : WHITE,
    castling: cloneCastling(state.castling),
    enPassant: isCoordinate(state.enPassant) ? { ...state.enPassant } : null,
    captured: {
      w: Array.isArray(state.captured?.w) ? state.captured.w.map((p) => ({ ...p })) : [],
      b: Array.isArray(state.captured?.b) ? state.captured.b.map((p) => ({ ...p })) : [],
    },
    halfmoveClock: Number.isInteger(state.halfmoveClock) ? state.halfmoveClock : 0,
    fullmoveNumber: Number.isInteger(state.fullmoveNumber) ? state.fullmoveNumber : 1,
    lastMove: state.lastMove ? structuredCloneSafe(state.lastMove) : null,
    status: baseStatus(),
  });
}

export function getLegalMoves(state, row, col) {
  if (!inBounds(row, col)) return [];
  const movingPiece = state.board[row][col];
  if (!movingPiece || movingPiece.color !== state.turn) return [];

  return getPseudoMoves(state, row, col).filter((move) => {
    const next = makeMoveOnState(state, move);
    return !isKingInCheck(next, movingPiece.color);
  });
}

export function applyMove(state, from, to, promotionType = null) {
  if (!isCoordinate(from) || !isCoordinate(to)) {
    throw new Error('Move coordinates are invalid.');
  }

  const legalMove = getLegalMoves(state, from.row, from.col).find(
    (move) => move.to.row === to.row && move.to.col === to.col,
  );

  if (!legalMove) {
    throw new Error('That move is not legal.');
  }

  if (legalMove.promotion) {
    if (!PROMOTION_TYPES.has(promotionType)) {
      throw new Error('A pawn promotion must choose queen, rook, bishop, or knight.');
    }
    legalMove.promotionType = promotionType;
  }

  return finalizeState(makeMoveOnState(state, legalMove));
}

export function getGameStatus(state) {
  return computeStatus(state);
}

export function isKingInCheck(state, color) {
  const king = findKing(state.board, color);
  if (!king) return true;
  return isSquareAttacked(state, king.row, king.col, opposite(color));
}

export function algebraic(row, col) {
  if (!inBounds(row, col)) return '';
  return `${String.fromCharCode(97 + col)}${8 - row}`;
}

function finalizeState(state) {
  return {
    ...state,
    status: computeStatus({ ...state, status: baseStatus() }),
  };
}

function computeStatus(state) {
  const check = isKingInCheck(state, state.turn);
  const hasMoves = hasAnyLegalMove(state, state.turn);

  if (check && !hasMoves) {
    const winner = opposite(state.turn);
    return {
      check: true,
      checkmate: true,
      stalemate: false,
      winner,
      message: `${colorName(winner)} wins by checkmate.`,
    };
  }

  if (!check && !hasMoves) {
    return {
      check: false,
      checkmate: false,
      stalemate: true,
      winner: null,
      message: 'Draw by stalemate.',
    };
  }

  return {
    check,
    checkmate: false,
    stalemate: false,
    winner: null,
    message: check ? `${colorName(state.turn)} is in check.` : `${colorName(state.turn)} to move.`,
  };
}

function hasAnyLegalMove(state, color) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const current = state.board[row][col];
      if (current?.color === color && getLegalMoves({ ...state, turn: color }, row, col).length > 0) {
        return true;
      }
    }
  }
  return false;
}

function getPseudoMoves(state, row, col) {
  const current = state.board[row][col];
  if (!current) return [];

  if (current.type === 'p') return pawnMoves(state, row, col, current);
  if (current.type === 'n') return stepMoves(state, row, col, current, knightOffsets());
  if (current.type === 'b') return rayMoves(state, row, col, current, bishopDirections());
  if (current.type === 'r') return rayMoves(state, row, col, current, rookDirections());
  if (current.type === 'q') return rayMoves(state, row, col, current, [...bishopDirections(), ...rookDirections()]);
  if (current.type === 'k') return kingMoves(state, row, col, current);

  return [];
}

function pawnMoves(state, row, col, current) {
  const moves = [];
  const direction = current.color === WHITE ? -1 : 1;
  const startRow = current.color === WHITE ? 6 : 1;
  const promotionRow = current.color === WHITE ? 0 : 7;
  const oneForward = row + direction;

  if (inBounds(oneForward, col) && !state.board[oneForward][col]) {
    moves.push(buildMove(state, row, col, oneForward, col, {
      promotion: oneForward === promotionRow,
    }));

    const twoForward = row + direction * 2;
    if (row === startRow && inBounds(twoForward, col) && !state.board[twoForward][col]) {
      moves.push(buildMove(state, row, col, twoForward, col, { doublePawnPush: true }));
    }
  }

  for (const deltaCol of [-1, 1]) {
    const targetRow = row + direction;
    const targetCol = col + deltaCol;
    if (!inBounds(targetRow, targetCol)) continue;

    const target = state.board[targetRow][targetCol];
    if (target && target.color !== current.color) {
      moves.push(buildMove(state, row, col, targetRow, targetCol, {
        promotion: targetRow === promotionRow,
      }));
      continue;
    }

    const enPassant = state.enPassant;
    const adjacent = state.board[row][targetCol];
    if (
      enPassant?.row === targetRow &&
      enPassant?.col === targetCol &&
      adjacent?.type === 'p' &&
      adjacent.color !== current.color
    ) {
      moves.push(buildMove(state, row, col, targetRow, targetCol, {
        enPassant: true,
        capturedAt: { row, col: targetCol },
      }));
    }
  }

  return moves;
}

function stepMoves(state, row, col, current, offsets) {
  const moves = [];
  for (const [rowDelta, colDelta] of offsets) {
    const targetRow = row + rowDelta;
    const targetCol = col + colDelta;
    if (!inBounds(targetRow, targetCol)) continue;

    const target = state.board[targetRow][targetCol];
    if (!target || target.color !== current.color) {
      moves.push(buildMove(state, row, col, targetRow, targetCol));
    }
  }
  return moves;
}

function rayMoves(state, row, col, current, directions) {
  const moves = [];
  for (const [rowDelta, colDelta] of directions) {
    let targetRow = row + rowDelta;
    let targetCol = col + colDelta;

    while (inBounds(targetRow, targetCol)) {
      const target = state.board[targetRow][targetCol];
      if (!target) {
        moves.push(buildMove(state, row, col, targetRow, targetCol));
      } else {
        if (target.color !== current.color) {
          moves.push(buildMove(state, row, col, targetRow, targetCol));
        }
        break;
      }

      targetRow += rowDelta;
      targetCol += colDelta;
    }
  }
  return moves;
}

function kingMoves(state, row, col, current) {
  const moves = stepMoves(state, row, col, current, kingOffsets());
  const homeRow = current.color === WHITE ? 7 : 0;

  if (row !== homeRow || col !== 4 || isKingInCheck(state, current.color)) {
    return moves;
  }

  const enemy = opposite(current.color);
  const rights = state.castling[current.color];

  if (
    rights?.k &&
    rookReady(state, homeRow, 7, current.color) &&
    !state.board[homeRow][5] &&
    !state.board[homeRow][6] &&
    !isSquareAttacked(state, homeRow, 5, enemy) &&
    !isSquareAttacked(state, homeRow, 6, enemy)
  ) {
    moves.push(buildMove(state, row, col, homeRow, 6, { castle: 'k' }));
  }

  if (
    rights?.q &&
    rookReady(state, homeRow, 0, current.color) &&
    !state.board[homeRow][1] &&
    !state.board[homeRow][2] &&
    !state.board[homeRow][3] &&
    !isSquareAttacked(state, homeRow, 3, enemy) &&
    !isSquareAttacked(state, homeRow, 2, enemy)
  ) {
    moves.push(buildMove(state, row, col, homeRow, 2, { castle: 'q' }));
  }

  return moves;
}

function buildMove(state, fromRow, fromCol, toRow, toCol, flags = {}) {
  const target = flags.capturedAt
    ? state.board[flags.capturedAt.row][flags.capturedAt.col]
    : state.board[toRow][toCol];

  return {
    from: { row: fromRow, col: fromCol },
    to: { row: toRow, col: toCol },
    piece: { ...state.board[fromRow][fromCol] },
    capture: target ? { ...target } : null,
    promotion: Boolean(flags.promotion),
    promotionType: null,
    doublePawnPush: Boolean(flags.doublePawnPush),
    enPassant: Boolean(flags.enPassant),
    capturedAt: flags.capturedAt ? { ...flags.capturedAt } : null,
    castle: flags.castle ?? null,
  };
}

function makeMoveOnState(state, move) {
  const next = cloneState(state);
  const movingPiece = next.board[move.from.row][move.from.col];
  const targetPiece = move.capturedAt
    ? next.board[move.capturedAt.row][move.capturedAt.col]
    : next.board[move.to.row][move.to.col];

  next.board[move.from.row][move.from.col] = null;
  if (move.capturedAt) {
    next.board[move.capturedAt.row][move.capturedAt.col] = null;
  }

  const placedPiece = move.promotion
    ? { type: move.promotionType || 'q', color: movingPiece.color }
    : { ...movingPiece };
  next.board[move.to.row][move.to.col] = placedPiece;

  if (move.castle === 'k') {
    const rook = next.board[move.from.row][7];
    next.board[move.from.row][7] = null;
    next.board[move.from.row][5] = rook;
  } else if (move.castle === 'q') {
    const rook = next.board[move.from.row][0];
    next.board[move.from.row][0] = null;
    next.board[move.from.row][3] = rook;
  }

  updateCastlingRights(next, movingPiece, move, targetPiece);

  next.enPassant = move.doublePawnPush
    ? { row: (move.from.row + move.to.row) / 2, col: move.from.col }
    : null;

  if (targetPiece) {
    next.captured[movingPiece.color].push({ ...targetPiece });
  }

  next.halfmoveClock = movingPiece.type === 'p' || targetPiece ? 0 : next.halfmoveClock + 1;
  next.lastMove = {
    from: { ...move.from },
    to: { ...move.to },
    piece: { ...movingPiece },
    capture: targetPiece ? { ...targetPiece } : null,
    promotion: move.promotion ? move.promotionType || 'q' : null,
    castle: move.castle,
    enPassant: move.enPassant,
  };
  next.turn = opposite(state.turn);
  if (movingPiece.color === BLACK) next.fullmoveNumber += 1;

  return next;
}

function updateCastlingRights(state, movingPiece, move, targetPiece) {
  if (movingPiece.type === 'k') {
    state.castling[movingPiece.color] = { k: false, q: false };
  }

  if (movingPiece.type === 'r') {
    clearRookCastlingRight(state, movingPiece.color, move.from.row, move.from.col);
  }

  if (targetPiece?.type === 'r') {
    const capturedSquare = move.capturedAt ?? move.to;
    clearRookCastlingRight(state, targetPiece.color, capturedSquare.row, capturedSquare.col);
  }
}

function clearRookCastlingRight(state, color, row, col) {
  const homeRow = color === WHITE ? 7 : 0;
  if (row !== homeRow) return;
  if (col === 0) state.castling[color].q = false;
  if (col === 7) state.castling[color].k = false;
}

function isSquareAttacked(state, row, col, byColor) {
  for (let pieceRow = 0; pieceRow < BOARD_SIZE; pieceRow += 1) {
    for (let pieceCol = 0; pieceCol < BOARD_SIZE; pieceCol += 1) {
      const attacker = state.board[pieceRow][pieceCol];
      if (!attacker || attacker.color !== byColor) continue;
      if (pieceAttacksSquare(state.board, pieceRow, pieceCol, attacker, row, col)) {
        return true;
      }
    }
  }
  return false;
}

function pieceAttacksSquare(board, fromRow, fromCol, attacker, targetRow, targetCol) {
  const rowDelta = targetRow - fromRow;
  const colDelta = targetCol - fromCol;

  if (attacker.type === 'p') {
    const direction = attacker.color === WHITE ? -1 : 1;
    return rowDelta === direction && Math.abs(colDelta) === 1;
  }

  if (attacker.type === 'n') {
    return knightOffsets().some(([r, c]) => r === rowDelta && c === colDelta);
  }

  if (attacker.type === 'k') {
    return Math.max(Math.abs(rowDelta), Math.abs(colDelta)) === 1;
  }

  const directionsByPiece = {
    b: bishopDirections(),
    r: rookDirections(),
    q: [...bishopDirections(), ...rookDirections()],
  };
  const directions = directionsByPiece[attacker.type];
  if (!directions) return false;

  for (const [stepRow, stepCol] of directions) {
    let row = fromRow + stepRow;
    let col = fromCol + stepCol;
    while (inBounds(row, col)) {
      if (row === targetRow && col === targetCol) return true;
      if (board[row][col]) break;
      row += stepRow;
      col += stepCol;
    }
  }

  return false;
}

function findKing(board, color) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const current = board[row][col];
      if (current?.type === 'k' && current.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

function rookReady(state, row, col, color) {
  const rook = state.board[row][col];
  return rook?.type === 'r' && rook.color === color;
}

function cloneState(state) {
  return {
    board: state.board.map((row) => row.map((entry) => (entry ? { ...entry } : null))),
    turn: state.turn,
    castling: cloneCastling(state.castling),
    enPassant: state.enPassant ? { ...state.enPassant } : null,
    captured: {
      w: state.captured?.w?.map((entry) => ({ ...entry })) ?? [],
      b: state.captured?.b?.map((entry) => ({ ...entry })) ?? [],
    },
    halfmoveClock: state.halfmoveClock ?? 0,
    fullmoveNumber: state.fullmoveNumber ?? 1,
    lastMove: state.lastMove ? structuredCloneSafe(state.lastMove) : null,
    status: state.status ? { ...state.status } : baseStatus(),
  };
}

function cloneCastling(castling = {}) {
  return {
    w: {
      k: Boolean(castling.w?.k),
      q: Boolean(castling.w?.q),
    },
    b: {
      k: Boolean(castling.b?.k),
      q: Boolean(castling.b?.q),
    },
  };
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function isCoordinate(value) {
  return value && Number.isInteger(value.row) && Number.isInteger(value.col) && inBounds(value.row, value.col);
}

function inBounds(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function opposite(color) {
  return color === WHITE ? BLACK : WHITE;
}

function colorName(color) {
  return color === WHITE ? 'White' : 'Black';
}

function knightOffsets() {
  return [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];
}

function kingOffsets() {
  return [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];
}

function bishopDirections() {
  return [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
}

function rookDirections() {
  return [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
}
