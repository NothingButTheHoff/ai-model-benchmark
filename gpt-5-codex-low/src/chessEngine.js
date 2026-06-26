export const WHITE = 'white';
export const BLACK = 'black';
export const BOARD_SIZE = 8;

export const PIECE_LABELS = {
  white: { king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: 'P' },
  black: { king: 'k', queen: 'q', rook: 'r', bishop: 'b', knight: 'n', pawn: 'p' }
};

const BACK_RANK = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

export function createInitialState() {
  const board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
  for (let col = 0; col < BOARD_SIZE; col += 1) {
    board[0][col] = piece(BLACK, BACK_RANK[col]);
    board[1][col] = piece(BLACK, 'pawn');
    board[6][col] = piece(WHITE, 'pawn');
    board[7][col] = piece(WHITE, BACK_RANK[col]);
  }
  return {
    board,
    turn: WHITE,
    castling: {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true }
    },
    enPassant: null,
    captured: { white: [], black: [] },
    status: { type: 'active', message: "White's turn" },
    history: []
  };
}

export function reviveState(saved) {
  if (!saved?.board || !saved?.turn || !saved?.castling) return createInitialState();
  return withStatus(saved);
}

export function getLegalMoves(state, from) {
  if (!inBounds(from.row, from.col)) return [];
  const moving = state.board[from.row][from.col];
  if (!moving || moving.color !== state.turn) return [];
  return getPseudoMoves(state, from).filter((move) => {
    const next = applyMoveUnchecked(state, from, move);
    return !isKingInCheck(next.board, moving.color);
  });
}

export function movePiece(state, from, to, promotion = 'queen') {
  const legal = getLegalMoves(state, from);
  const selected = legal.find((move) => move.to.row === to.row && move.to.col === to.col);
  if (!selected) {
    return { state, ok: false, error: 'That move is not legal.' };
  }
  const next = applyMoveUnchecked(state, from, selected, promotion);
  return { state: withStatus(next), ok: true };
}

export function hasAnyLegalMove(state, color = state.turn) {
  const view = { ...state, turn: color };
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const p = view.board[row][col];
      if (p?.color === color && getLegalMoves(view, { row, col }).length > 0) return true;
    }
  }
  return false;
}

export function isKingInCheck(board, color) {
  const king = findKing(board, color);
  if (!king) return true;
  return isSquareAttacked(board, king.row, king.col, other(color));
}

export function squareName({ row, col }) {
  return `${'abcdefgh'[col]}${8 - row}`;
}

function piece(color, type) {
  return { color, type };
}

function withStatus(state) {
  const inCheck = isKingInCheck(state.board, state.turn);
  const anyMove = hasAnyLegalMoveShallow(state);
  let status;
  if (!anyMove && inCheck) {
    status = { type: 'checkmate', winner: other(state.turn), message: `Checkmate. ${capitalize(other(state.turn))} wins.` };
  } else if (!anyMove) {
    status = { type: 'stalemate', message: 'Stalemate. The game is a draw.' };
  } else if (inCheck) {
    status = { type: 'check', message: `${capitalize(state.turn)} is in check.` };
  } else {
    status = { type: 'active', message: `${capitalize(state.turn)}'s turn` };
  }
  return { ...state, status };
}

function hasAnyLegalMoveShallow(state) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const p = state.board[row][col];
      if (p?.color === state.turn && getPseudoMoves(state, { row, col }).some((move) => {
        const next = applyMoveUnchecked(state, { row, col }, move);
        return !isKingInCheck(next.board, state.turn);
      })) return true;
    }
  }
  return false;
}

function getPseudoMoves(state, from) {
  const p = state.board[from.row][from.col];
  if (!p) return [];
  if (p.type === 'pawn') return pawnMoves(state, from, p);
  if (p.type === 'knight') return jumpMoves(state, from, p, [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]);
  if (p.type === 'bishop') return rayMoves(state, from, p, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
  if (p.type === 'rook') return rayMoves(state, from, p, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
  if (p.type === 'queen') return rayMoves(state, from, p, [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
  return kingMoves(state, from, p);
}

function pawnMoves(state, from, p) {
  const moves = [];
  const dir = p.color === WHITE ? -1 : 1;
  const start = p.color === WHITE ? 6 : 1;
  const promotionRow = p.color === WHITE ? 0 : 7;
  const one = { row: from.row + dir, col: from.col };
  if (inBounds(one.row, one.col) && !state.board[one.row][one.col]) {
    moves.push(markPromotion(one, promotionRow));
    const two = { row: from.row + dir * 2, col: from.col };
    if (from.row === start && !state.board[two.row][two.col]) moves.push({ to: two, doublePawn: true });
  }
  for (const dc of [-1, 1]) {
    const target = { row: from.row + dir, col: from.col + dc };
    if (!inBounds(target.row, target.col)) continue;
    const occupant = state.board[target.row][target.col];
    if (occupant && occupant.color !== p.color) moves.push(markPromotion(target, promotionRow));
    if (state.enPassant?.row === target.row && state.enPassant?.col === target.col) {
      moves.push({ to: target, enPassant: true, captureAt: { row: from.row, col: target.col } });
    }
  }
  return moves;
}

function markPromotion(to, promotionRow) {
  return to.row === promotionRow ? { to, promotion: true } : { to };
}

function jumpMoves(state, from, p, deltas) {
  return deltas.map(([dr, dc]) => ({ row: from.row + dr, col: from.col + dc }))
    .filter((to) => inBounds(to.row, to.col) && state.board[to.row][to.col]?.color !== p.color)
    .map((to) => ({ to }));
}

function rayMoves(state, from, p, deltas) {
  const moves = [];
  for (const [dr, dc] of deltas) {
    let row = from.row + dr;
    let col = from.col + dc;
    while (inBounds(row, col)) {
      const occupant = state.board[row][col];
      if (!occupant) moves.push({ to: { row, col } });
      else {
        if (occupant.color !== p.color) moves.push({ to: { row, col } });
        break;
      }
      row += dr;
      col += dc;
    }
  }
  return moves;
}

function kingMoves(state, from, p) {
  const moves = jumpMoves(state, from, p, [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]);
  const homeRow = p.color === WHITE ? 7 : 0;
  if (from.row === homeRow && from.col === 4 && !isKingInCheck(state.board, p.color)) {
    if (state.castling[p.color].kingSide && clearAndSafe(state.board, homeRow, [5, 6], p.color)) {
      const rook = state.board[homeRow][7];
      if (rook?.type === 'rook' && rook.color === p.color) moves.push({ to: { row: homeRow, col: 6 }, castle: 'kingSide' });
    }
    if (state.castling[p.color].queenSide && clearAndSafe(state.board, homeRow, [3, 2], p.color) && !state.board[homeRow][1]) {
      const rook = state.board[homeRow][0];
      if (rook?.type === 'rook' && rook.color === p.color) moves.push({ to: { row: homeRow, col: 2 }, castle: 'queenSide' });
    }
  }
  return moves;
}

function clearAndSafe(board, row, cols, color) {
  return cols.every((col) => !board[row][col] && !isSquareAttacked(board, row, col, other(color)));
}

function applyMoveUnchecked(state, from, move, promotion = 'queen') {
  const board = cloneBoard(state.board);
  const moving = board[from.row][from.col];
  const target = board[move.to.row][move.to.col];
  const capturedPiece = move.enPassant ? board[move.captureAt.row][move.captureAt.col] : target;
  board[from.row][from.col] = null;
  if (move.enPassant) board[move.captureAt.row][move.captureAt.col] = null;
  board[move.to.row][move.to.col] = move.promotion ? { ...moving, type: normalizePromotion(promotion) } : moving;
  if (move.castle === 'kingSide') {
    board[from.row][5] = board[from.row][7];
    board[from.row][7] = null;
  }
  if (move.castle === 'queenSide') {
    board[from.row][3] = board[from.row][0];
    board[from.row][0] = null;
  }

  const castling = updateCastling(state.castling, moving, from, move.to, target);
  const captured = cloneCaptured(state.captured);
  if (capturedPiece) captured[moving.color].push(capturedPiece);
  const enPassant = move.doublePawn ? { row: (from.row + move.to.row) / 2, col: from.col } : null;
  const notation = `${PIECE_LABELS[moving.color][moving.type].toUpperCase()} ${squareName(from)}-${squareName(move.to)}`;
  return {
    ...state,
    board,
    turn: other(state.turn),
    castling,
    enPassant,
    captured,
    history: [...(state.history || []), notation].slice(-20)
  };
}

function updateCastling(current, moving, from, to, captured) {
  const castling = {
    white: { ...current.white },
    black: { ...current.black }
  };
  if (moving.type === 'king') castling[moving.color] = { kingSide: false, queenSide: false };
  if (moving.type === 'rook') disableRookCastle(castling, moving.color, from);
  if (captured?.type === 'rook') disableRookCastle(castling, captured.color, to);
  return castling;
}

function disableRookCastle(castling, color, square) {
  const homeRow = color === WHITE ? 7 : 0;
  if (square.row !== homeRow) return;
  if (square.col === 0) castling[color].queenSide = false;
  if (square.col === 7) castling[color].kingSide = false;
}

function isSquareAttacked(board, row, col, byColor) {
  const pawnDir = byColor === WHITE ? -1 : 1;
  for (const dc of [-1, 1]) {
    const p = board[row - pawnDir]?.[col + dc];
    if (p?.color === byColor && p.type === 'pawn') return true;
  }
  for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
    const p = board[row + dr]?.[col + dc];
    if (p?.color === byColor && p.type === 'knight') return true;
  }
  if (attackedByRay(board, row, col, byColor, ['rook', 'queen'], [[-1, 0], [1, 0], [0, -1], [0, 1]])) return true;
  if (attackedByRay(board, row, col, byColor, ['bishop', 'queen'], [[-1, -1], [-1, 1], [1, -1], [1, 1]])) return true;
  for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
    const p = board[row + dr]?.[col + dc];
    if (p?.color === byColor && p.type === 'king') return true;
  }
  return false;
}

function attackedByRay(board, row, col, byColor, types, deltas) {
  for (const [dr, dc] of deltas) {
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.color === byColor && types.includes(p.type)) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return false;
}

function findKing(board, color) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const p = board[row][col];
      if (p?.color === color && p.type === 'king') return { row, col };
    }
  }
  return null;
}

function normalizePromotion(value) {
  return ['queen', 'rook', 'bishop', 'knight'].includes(value) ? value : 'queen';
}

function cloneBoard(board) {
  return board.map((rank) => rank.map((p) => (p ? { ...p } : null)));
}

function cloneCaptured(captured) {
  return {
    white: [...(captured?.white || [])],
    black: [...(captured?.black || [])]
  };
}

function inBounds(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function other(color) {
  return color === WHITE ? BLACK : WHITE;
}

function capitalize(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}
