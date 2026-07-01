// Chess engine: pure functions, no UI dependency.
// Board is an 8x8 array of cells. row 0 = rank 8 (top/black), row 7 = rank 1 (bottom/white).
// col 0 = file a, col 7 = file h.

const DIRS = {
  bishop: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
  rook: [[-1, 0], [1, 0], [0, -1], [0, 1]],
};
DIRS.queen = [...DIRS.bishop, ...DIRS.rook];

const KNIGHT_OFFSETS = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
];

export function createInitialState() {
  const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: back[c], color: 'b' };
    board[1][c] = { type: 'p', color: 'b' };
    board[6][c] = { type: 'p', color: 'w' };
    board[7][c] = { type: back[c], color: 'w' };
  }
  return {
    board,
    turn: 'w',
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    enPassant: null, // { row, col } square that can be captured onto
    captured: { w: [], b: [] },
    history: [],
    status: 'active', // active | check | checkmate | stalemate
    winner: null,
  };
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function opponent(color) {
  return color === 'w' ? 'b' : 'w';
}

function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell && cell.type === 'k' && cell.color === color) return { row: r, col: c };
    }
  }
  return null;
}

// Returns true if `color`'s king (or the given square) is attacked by the opponent.
function isSquareAttacked(board, row, col, byColor) {
  // Pawns
  const pawnDir = byColor === 'w' ? 1 : -1; // white pawns attack upward (toward row-1), so attacker is at row+pawnDir
  for (const dc of [-1, 1]) {
    const r = row + pawnDir;
    const c = col + dc;
    if (inBounds(r, c)) {
      const cell = board[r][c];
      if (cell && cell.type === 'p' && cell.color === byColor) return true;
    }
  }
  // Knights
  for (const [dr, dc] of KNIGHT_OFFSETS) {
    const r = row + dr;
    const c = col + dc;
    if (inBounds(r, c)) {
      const cell = board[r][c];
      if (cell && cell.type === 'n' && cell.color === byColor) return true;
    }
  }
  // Sliding: bishop/queen diagonals
  for (const [dr, dc] of DIRS.bishop) {
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c)) {
      const cell = board[r][c];
      if (cell) {
        if (cell.color === byColor && (cell.type === 'b' || cell.type === 'q')) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }
  // Sliding: rook/queen straight
  for (const [dr, dc] of DIRS.rook) {
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c)) {
      const cell = board[r][c];
      if (cell) {
        if (cell.color === byColor && (cell.type === 'r' || cell.type === 'q')) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }
  // King
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (inBounds(r, c)) {
        const cell = board[r][c];
        if (cell && cell.type === 'k' && cell.color === byColor) return true;
      }
    }
  }
  return false;
}

function isInCheck(board, color) {
  const king = findKing(board, color);
  if (!king) return false;
  return isSquareAttacked(board, king.row, king.col, opponent(color));
}

// Generates pseudo-legal moves (does not check for leaving own king in check).
function pseudoLegalMoves(state, row, col) {
  const { board } = state;
  const piece = board[row][col];
  if (!piece) return [];
  const moves = [];
  const { type, color } = piece;

  const addIfValid = (r, c, opts = {}) => {
    if (!inBounds(r, c)) return false;
    const target = board[r][c];
    if (target && target.color === color) return false;
    moves.push({ from: { row, col }, to: { row: r, col: c }, ...opts });
    return !target; // can continue sliding if empty
  };

  if (type === 'p') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    const promoRow = color === 'w' ? 0 : 7;
    // forward
    if (inBounds(row + dir, col) && !board[row + dir][col]) {
      if (row + dir === promoRow) {
        for (const promo of ['q', 'r', 'b', 'n']) {
          moves.push({ from: { row, col }, to: { row: row + dir, col }, promotion: promo });
        }
      } else {
        moves.push({ from: { row, col }, to: { row: row + dir, col } });
      }
      // double step
      if (row === startRow && !board[row + 2 * dir][col]) {
        moves.push({ from: { row, col }, to: { row: row + 2 * dir, col }, doubleStep: true });
      }
    }
    // captures
    for (const dc of [-1, 1]) {
      const r = row + dir;
      const c = col + dc;
      if (!inBounds(r, c)) continue;
      const target = board[r][c];
      if (target && target.color !== color) {
        if (r === promoRow) {
          for (const promo of ['q', 'r', 'b', 'n']) {
            moves.push({ from: { row, col }, to: { row: r, col: c }, promotion: promo, capture: true });
          }
        } else {
          moves.push({ from: { row, col }, to: { row: r, col: c }, capture: true });
        }
      } else if (!target && state.enPassant && state.enPassant.row === r && state.enPassant.col === c) {
        moves.push({ from: { row, col }, to: { row: r, col: c }, enPassant: true, capture: true });
      }
    }
  } else if (type === 'n') {
    for (const [dr, dc] of KNIGHT_OFFSETS) addIfValid(row + dr, col + dc);
  } else if (type === 'k') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        addIfValid(row + dr, col + dc);
      }
    }
    // Castling
    const rank = color === 'w' ? 7 : 0;
    if (row === rank && col === 4 && !isInCheck(board, color)) {
      const kSideKey = color === 'w' ? 'wK' : 'bK';
      const qSideKey = color === 'w' ? 'wQ' : 'bQ';
      const oppColor = opponent(color);
      if (state.castling[kSideKey] && !board[rank][5] && !board[rank][6]
        && board[rank][7] && board[rank][7].type === 'r' && board[rank][7].color === color
        && !isSquareAttacked(board, rank, 5, oppColor) && !isSquareAttacked(board, rank, 6, oppColor)) {
        moves.push({ from: { row, col }, to: { row: rank, col: 6 }, castle: 'king' });
      }
      if (state.castling[qSideKey] && !board[rank][1] && !board[rank][2] && !board[rank][3]
        && board[rank][0] && board[rank][0].type === 'r' && board[rank][0].color === color
        && !isSquareAttacked(board, rank, 3, oppColor) && !isSquareAttacked(board, rank, 2, oppColor)) {
        moves.push({ from: { row, col }, to: { row: rank, col: 2 }, castle: 'queen' });
      }
    }
  } else {
    const dirs = type === 'b' ? DIRS.bishop : type === 'r' ? DIRS.rook : DIRS.queen;
    for (const [dr, dc] of dirs) {
      let r = row + dr;
      let c = col + dc;
      while (addIfValid(r, c)) {
        r += dr;
        c += dc;
      }
    }
  }

  return moves;
}

// Applies a move to a cloned board/state, returning the new state (no legality re-check).
function applyMoveRaw(state, move) {
  const board = cloneBoard(state.board);
  const { from, to } = move;
  const piece = board[from.row][from.col];
  const captured = board[to.row][to.col];
  const captures = { w: [...state.captured.w], b: [...state.captured.b] };

  if (move.enPassant) {
    const capRow = piece.color === 'w' ? to.row + 1 : to.row - 1;
    const capturedPawn = board[capRow][to.col];
    if (capturedPawn) captures[piece.color].push(capturedPawn);
    board[capRow][to.col] = null;
  } else if (captured) {
    captures[piece.color].push(captured);
  }

  board[to.row][to.col] = move.promotion ? { type: move.promotion, color: piece.color } : piece;
  board[from.row][from.col] = null;

  if (move.castle) {
    const rank = from.row;
    if (move.castle === 'king') {
      board[rank][5] = board[rank][7];
      board[rank][7] = null;
    } else {
      board[rank][3] = board[rank][0];
      board[rank][0] = null;
    }
  }

  const castling = { ...state.castling };
  if (piece.type === 'k') {
    if (piece.color === 'w') { castling.wK = false; castling.wQ = false; }
    else { castling.bK = false; castling.bQ = false; }
  }
  if (piece.type === 'r') {
    if (from.row === 7 && from.col === 0) castling.wQ = false;
    if (from.row === 7 && from.col === 7) castling.wK = false;
    if (from.row === 0 && from.col === 0) castling.bQ = false;
    if (from.row === 0 && from.col === 7) castling.bK = false;
  }
  // rook captured on its home square also revokes castling rights
  if (to.row === 7 && to.col === 0) castling.wQ = false;
  if (to.row === 7 && to.col === 7) castling.wK = false;
  if (to.row === 0 && to.col === 0) castling.bQ = false;
  if (to.row === 0 && to.col === 7) castling.bK = false;

  const enPassant = move.doubleStep
    ? { row: (from.row + to.row) / 2, col: from.col }
    : null;

  return {
    ...state,
    board,
    turn: opponent(state.turn),
    castling,
    enPassant,
    captured: captures,
  };
}

export function getLegalMoves(state, row, col) {
  const piece = state.board[row][col];
  if (!piece || piece.color !== state.turn) return [];
  const pseudo = pseudoLegalMoves(state, row, col);
  return pseudo.filter((move) => {
    const next = applyMoveRaw(state, move);
    return !isInCheck(next.board, piece.color);
  });
}

export function getAllLegalMoves(state, color) {
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = state.board[r][c];
      if (piece && piece.color === color) {
        moves.push(...getLegalMoves(state, r, c));
      }
    }
  }
  return moves;
}

function algebraic(row, col) {
  return `${'abcdefgh'[col]}${8 - row}`;
}

export function moveToSan(state, move) {
  const piece = state.board[move.from.row][move.from.col];
  const captureMark = move.capture ? 'x' : '';
  if (move.castle === 'king') return 'O-O';
  if (move.castle === 'queen') return 'O-O-O';
  const pieceLetter = piece.type === 'p' ? '' : piece.type.toUpperCase();
  const fromSquare = piece.type === 'p' && move.capture ? 'abcdefgh'[move.from.col] : '';
  const promo = move.promotion ? `=${move.promotion.toUpperCase()}` : '';
  return `${pieceLetter}${fromSquare}${captureMark}${algebraic(move.to.row, move.to.col)}${promo}`;
}

export function makeMove(state, move) {
  const piece = state.board[move.from.row][move.from.col];
  const next = applyMoveRaw(state, move);
  const opponentColor = piece.color === 'w' ? 'b' : 'w';
  const inCheck = isInCheck(next.board, opponentColor);
  const legalMoves = getAllLegalMoves(next, opponentColor);
  let status = 'active';
  let winner = null;
  if (legalMoves.length === 0) {
    status = inCheck ? 'checkmate' : 'stalemate';
    winner = inCheck ? piece.color : null;
  } else if (inCheck) {
    status = 'check';
  }

  const san = moveToSan(state, move);
  return {
    ...next,
    status,
    winner,
    history: [...state.history, { san, move, color: piece.color }],
  };
}

export { isInCheck, opponent };
