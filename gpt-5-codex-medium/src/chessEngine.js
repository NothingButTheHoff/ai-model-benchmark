const WHITE = 'w';
const BLACK = 'b';
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const PROMOTIONS = ['q', 'r', 'b', 'n'];

export const COLORS = { WHITE, BLACK };
export const PIECE_NAMES = {
  p: 'Pawn',
  r: 'Rook',
  n: 'Knight',
  b: 'Bishop',
  q: 'Queen',
  k: 'King',
};

const START_ROWS = {
  [BLACK]: ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  [WHITE]: ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
};

export function createInitialState() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));

  for (let col = 0; col < 8; col += 1) {
    board[0][col] = { color: BLACK, type: START_ROWS[BLACK][col] };
    board[1][col] = { color: BLACK, type: 'p' };
    board[6][col] = { color: WHITE, type: 'p' };
    board[7][col] = { color: WHITE, type: START_ROWS[WHITE][col] };
  }

  return {
    board,
    turn: WHITE,
    castling: {
      [WHITE]: { kingSide: true, queenSide: true },
      [BLACK]: { kingSide: true, queenSide: true },
    },
    enPassant: null,
    captured: { [WHITE]: [], [BLACK]: [] },
    halfmoveClock: 0,
    fullmoveNumber: 1,
    lastMove: null,
  };
}

export function normalizeState(value) {
  if (!value || !Array.isArray(value.board) || value.board.length !== 8) {
    return createInitialState();
  }

  return {
    ...createInitialState(),
    ...value,
    castling: {
      [WHITE]: { kingSide: false, queenSide: false, ...(value.castling?.[WHITE] ?? {}) },
      [BLACK]: { kingSide: false, queenSide: false, ...(value.castling?.[BLACK] ?? {}) },
    },
    captured: {
      [WHITE]: Array.isArray(value.captured?.[WHITE]) ? value.captured[WHITE] : [],
      [BLACK]: Array.isArray(value.captured?.[BLACK]) ? value.captured[BLACK] : [],
    },
  };
}

export function squareName({ row, col }) {
  return `${FILES[col]}${8 - row}`;
}

export function sameSquare(a, b) {
  return Boolean(a && b && a.row === b.row && a.col === b.col);
}

export function getLegalMoves(state, from) {
  if (!inBounds(from.row, from.col)) return [];
  const piece = state.board[from.row][from.col];
  if (!piece || piece.color !== state.turn) return [];

  return getPseudoMoves(state, from).filter((move) => {
    const next = applyMoveUnchecked(state, move, move.promotion ? 'q' : undefined);
    return !isKingInCheck(next, piece.color);
  });
}

export function getAllLegalMoves(state, color = state.turn) {
  const moves = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = state.board[row][col];
      if (piece?.color === color) {
        const turnState = color === state.turn ? state : { ...state, turn: color };
        moves.push(...getLegalMoves(turnState, { row, col }));
      }
    }
  }
  return moves;
}

export function getGameStatus(state) {
  const inCheck = isKingInCheck(state, state.turn);
  const legalMoves = getAllLegalMoves(state);

  if (legalMoves.length === 0 && inCheck) {
    return {
      kind: 'checkmate',
      inCheck,
      message: `${colorName(opposite(state.turn))} wins by checkmate.`,
    };
  }

  if (legalMoves.length === 0) {
    return { kind: 'stalemate', inCheck, message: 'Stalemate.' };
  }

  if (inCheck) {
    return { kind: 'check', inCheck, message: `${colorName(state.turn)} is in check.` };
  }

  return { kind: 'playing', inCheck, message: `${colorName(state.turn)} to move.` };
}

export function applyMove(state, move, promotionChoice) {
  const legalMoves = getLegalMoves(state, move.from);
  const legalMove = legalMoves.find((candidate) => sameSquare(candidate.to, move.to));

  if (!legalMove) {
    throw new Error('Illegal move');
  }

  if (legalMove.promotion && !PROMOTIONS.includes(promotionChoice)) {
    throw new Error('A valid promotion piece is required');
  }

  return applyMoveUnchecked(state, legalMove, promotionChoice);
}

export function colorName(color) {
  return color === WHITE ? 'White' : 'Black';
}

export function pieceKey(piece) {
  return `${piece.color}${piece.type}`;
}

function cloneBoard(board) {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

function cloneState(state) {
  return {
    ...state,
    board: cloneBoard(state.board),
    castling: {
      [WHITE]: { ...state.castling[WHITE] },
      [BLACK]: { ...state.castling[BLACK] },
    },
    captured: {
      [WHITE]: [...state.captured[WHITE]],
      [BLACK]: [...state.captured[BLACK]],
    },
    enPassant: state.enPassant ? { ...state.enPassant } : null,
    lastMove: state.lastMove
      ? {
          ...state.lastMove,
          from: { ...state.lastMove.from },
          to: { ...state.lastMove.to },
        }
      : null,
  };
}

function applyMoveUnchecked(state, move, promotionChoice) {
  const next = cloneState(state);
  const movingPiece = next.board[move.from.row][move.from.col];
  const capturedSquare = move.isEnPassant
    ? { row: move.from.row, col: move.to.col }
    : move.to;
  const capturedPiece = next.board[capturedSquare.row][capturedSquare.col];

  next.board[move.from.row][move.from.col] = null;
  next.board[capturedSquare.row][capturedSquare.col] = null;
  next.board[move.to.row][move.to.col] = {
    ...movingPiece,
    type: move.promotion ? promotionChoice : movingPiece.type,
  };

  if (move.isCastle) {
    const row = move.from.row;
    if (move.castleSide === 'kingSide') {
      next.board[row][5] = next.board[row][7];
      next.board[row][7] = null;
    } else {
      next.board[row][3] = next.board[row][0];
      next.board[row][0] = null;
    }
  }

  if (capturedPiece) {
    next.captured[movingPiece.color].push(capturedPiece);
  }

  updateCastlingRights(next, move, movingPiece, capturedPiece, capturedSquare);

  next.enPassant = null;
  if (movingPiece.type === 'p' && Math.abs(move.to.row - move.from.row) === 2) {
    next.enPassant = {
      row: (move.to.row + move.from.row) / 2,
      col: move.from.col,
    };
  }

  next.halfmoveClock = movingPiece.type === 'p' || capturedPiece ? 0 : state.halfmoveClock + 1;
  next.fullmoveNumber = movingPiece.color === BLACK ? state.fullmoveNumber + 1 : state.fullmoveNumber;
  next.turn = opposite(state.turn);
  next.lastMove = {
    from: { ...move.from },
    to: { ...move.to },
    piece: movingPiece,
    capture: capturedPiece ?? null,
    promotion: move.promotion ? promotionChoice : null,
    isCastle: Boolean(move.isCastle),
    isEnPassant: Boolean(move.isEnPassant),
  };

  return next;
}

function updateCastlingRights(state, move, movingPiece, capturedPiece, capturedSquare) {
  if (movingPiece.type === 'k') {
    state.castling[movingPiece.color].kingSide = false;
    state.castling[movingPiece.color].queenSide = false;
  }

  if (movingPiece.type === 'r') {
    clearRookRight(state, movingPiece.color, move.from);
  }

  if (capturedPiece?.type === 'r') {
    clearRookRight(state, capturedPiece.color, capturedSquare);
  }
}

function clearRookRight(state, color, square) {
  const homeRow = color === WHITE ? 7 : 0;
  if (square.row !== homeRow) return;
  if (square.col === 0) state.castling[color].queenSide = false;
  if (square.col === 7) state.castling[color].kingSide = false;
}

function getPseudoMoves(state, from) {
  const piece = state.board[from.row][from.col];
  if (!piece) return [];

  if (piece.type === 'p') return pawnMoves(state, from, piece);
  if (piece.type === 'n') return stepMoves(state, from, piece, KNIGHT_STEPS);
  if (piece.type === 'b') return slideMoves(state, from, piece, DIAGONALS);
  if (piece.type === 'r') return slideMoves(state, from, piece, ORTHOGONALS);
  if (piece.type === 'q') return slideMoves(state, from, piece, [...DIAGONALS, ...ORTHOGONALS]);
  if (piece.type === 'k') return kingMoves(state, from, piece);
  return [];
}

function pawnMoves(state, from, piece) {
  const moves = [];
  const dir = piece.color === WHITE ? -1 : 1;
  const startRow = piece.color === WHITE ? 6 : 1;
  const promotionRow = piece.color === WHITE ? 0 : 7;
  const oneRow = from.row + dir;

  if (inBounds(oneRow, from.col) && !state.board[oneRow][from.col]) {
    moves.push(makeMove(from, { row: oneRow, col: from.col }, piece, {
      promotion: oneRow === promotionRow,
    }));

    const twoRow = from.row + dir * 2;
    if (from.row === startRow && !state.board[twoRow][from.col]) {
      moves.push(makeMove(from, { row: twoRow, col: from.col }, piece));
    }
  }

  for (const colDelta of [-1, 1]) {
    const to = { row: from.row + dir, col: from.col + colDelta };
    if (!inBounds(to.row, to.col)) continue;
    const target = state.board[to.row][to.col];

    if (target && target.color !== piece.color) {
      moves.push(makeMove(from, to, piece, {
        capture: target,
        promotion: to.row === promotionRow,
      }));
    }

    if (sameSquare(state.enPassant, to)) {
      const pawnToCapture = state.board[from.row][to.col];
      if (pawnToCapture?.type === 'p' && pawnToCapture.color === opposite(piece.color)) {
        moves.push(makeMove(from, to, piece, {
          capture: pawnToCapture,
          isEnPassant: true,
        }));
      }
    }
  }

  return moves;
}

function stepMoves(state, from, piece, steps) {
  const moves = [];
  for (const [rowDelta, colDelta] of steps) {
    const to = { row: from.row + rowDelta, col: from.col + colDelta };
    if (!inBounds(to.row, to.col)) continue;
    const target = state.board[to.row][to.col];
    if (!target || target.color !== piece.color) {
      moves.push(makeMove(from, to, piece, { capture: target ?? null }));
    }
  }
  return moves;
}

function slideMoves(state, from, piece, directions) {
  const moves = [];
  for (const [rowDelta, colDelta] of directions) {
    let row = from.row + rowDelta;
    let col = from.col + colDelta;
    while (inBounds(row, col)) {
      const target = state.board[row][col];
      if (!target) {
        moves.push(makeMove(from, { row, col }, piece));
      } else {
        if (target.color !== piece.color) {
          moves.push(makeMove(from, { row, col }, piece, { capture: target }));
        }
        break;
      }
      row += rowDelta;
      col += colDelta;
    }
  }
  return moves;
}

function kingMoves(state, from, piece) {
  return [...stepMoves(state, from, piece, KING_STEPS), ...castleMoves(state, from, piece)];
}

function castleMoves(state, from, piece) {
  const row = piece.color === WHITE ? 7 : 0;
  if (piece.type !== 'k' || from.row !== row || from.col !== 4) return [];
  if (isKingInCheck(state, piece.color)) return [];

  const enemy = opposite(piece.color);
  const moves = [];

  if (
    state.castling[piece.color].kingSide &&
    state.board[row][7]?.type === 'r' &&
    state.board[row][7]?.color === piece.color &&
    !state.board[row][5] &&
    !state.board[row][6] &&
    !isSquareAttacked(state, { row, col: 5 }, enemy) &&
    !isSquareAttacked(state, { row, col: 6 }, enemy)
  ) {
    moves.push(makeMove(from, { row, col: 6 }, piece, {
      isCastle: true,
      castleSide: 'kingSide',
    }));
  }

  if (
    state.castling[piece.color].queenSide &&
    state.board[row][0]?.type === 'r' &&
    state.board[row][0]?.color === piece.color &&
    !state.board[row][1] &&
    !state.board[row][2] &&
    !state.board[row][3] &&
    !isSquareAttacked(state, { row, col: 3 }, enemy) &&
    !isSquareAttacked(state, { row, col: 2 }, enemy)
  ) {
    moves.push(makeMove(from, { row, col: 2 }, piece, {
      isCastle: true,
      castleSide: 'queenSide',
    }));
  }

  return moves;
}

function makeMove(from, to, piece, extras = {}) {
  return {
    from: { ...from },
    to,
    piece,
    capture: null,
    promotion: false,
    isCastle: false,
    isEnPassant: false,
    castleSide: null,
    ...extras,
  };
}

function isKingInCheck(state, color) {
  const king = findKing(state.board, color);
  if (!king) return true;
  return isSquareAttacked(state, king, opposite(color));
}

function findKing(board, color) {
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (piece?.type === 'k' && piece.color === color) return { row, col };
    }
  }
  return null;
}

function isSquareAttacked(state, square, attackerColor) {
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = state.board[row][col];
      if (piece?.color === attackerColor && attacksSquare(state.board, { row, col }, square, piece)) {
        return true;
      }
    }
  }
  return false;
}

function attacksSquare(board, from, target, piece) {
  const rowDelta = target.row - from.row;
  const colDelta = target.col - from.col;
  const absRow = Math.abs(rowDelta);
  const absCol = Math.abs(colDelta);

  if (piece.type === 'p') {
    const dir = piece.color === WHITE ? -1 : 1;
    return rowDelta === dir && absCol === 1;
  }

  if (piece.type === 'n') {
    return (absRow === 2 && absCol === 1) || (absRow === 1 && absCol === 2);
  }

  if (piece.type === 'k') {
    return Math.max(absRow, absCol) === 1;
  }

  if (piece.type === 'b') {
    return absRow === absCol && isPathClear(board, from, target);
  }

  if (piece.type === 'r') {
    return (rowDelta === 0 || colDelta === 0) && isPathClear(board, from, target);
  }

  if (piece.type === 'q') {
    return (
      (absRow === absCol || rowDelta === 0 || colDelta === 0) &&
      isPathClear(board, from, target)
    );
  }

  return false;
}

function isPathClear(board, from, target) {
  const rowStep = Math.sign(target.row - from.row);
  const colStep = Math.sign(target.col - from.col);
  let row = from.row + rowStep;
  let col = from.col + colStep;

  while (row !== target.row || col !== target.col) {
    if (board[row][col]) return false;
    row += rowStep;
    col += colStep;
  }

  return true;
}

function inBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function opposite(color) {
  return color === WHITE ? BLACK : WHITE;
}

const KNIGHT_STEPS = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];

const KING_STEPS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

const DIAGONALS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

const ORTHOGONALS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
