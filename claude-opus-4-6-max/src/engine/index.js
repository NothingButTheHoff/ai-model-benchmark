export const WHITE = 'white';
export const BLACK = 'black';

export const PAWN = 'pawn';
export const KNIGHT = 'knight';
export const BISHOP = 'bishop';
export const ROOK = 'rook';
export const QUEEN = 'queen';
export const KING = 'king';

export const PIECE_UNICODE = {
  [WHITE]: { [KING]: '♔', [QUEEN]: '♕', [ROOK]: '♖', [BISHOP]: '♗', [KNIGHT]: '♘', [PAWN]: '♙' },
  [BLACK]: { [KING]: '♚', [QUEEN]: '♛', [ROOK]: '♜', [BISHOP]: '♝', [KNIGHT]: '♞', [PAWN]: '♟' },
};

export const PIECE_VALUE = {
  [PAWN]: 1, [KNIGHT]: 3, [BISHOP]: 3, [ROOK]: 5, [QUEEN]: 9, [KING]: 0,
};

export function opponent(color) {
  return color === WHITE ? BLACK : WHITE;
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function copyBoard(board) {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

export function findKing(board, color) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === KING && p.color === color) return { row: r, col: c };
    }
  return null;
}

function isSquareAttacked(board, r, c, byColor) {
  const pd = byColor === WHITE ? 1 : -1;
  for (const dc of [-1, 1]) {
    const pr = r + pd, pc = c + dc;
    if (inBounds(pr, pc)) {
      const p = board[pr][pc];
      if (p && p.color === byColor && p.type === PAWN) return true;
    }
  }

  for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
    const nr = r + dr, nc = c + dc;
    if (inBounds(nr, nc)) {
      const p = board[nr][nc];
      if (p && p.color === byColor && p.type === KNIGHT) return true;
    }
  }

  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (inBounds(nr, nc)) {
        const p = board[nr][nc];
        if (p && p.color === byColor && p.type === KING) return true;
      }
    }

  for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
    for (let i = 1; i < 8; i++) {
      const nr = r + dr * i, nc = c + dc * i;
      if (!inBounds(nr, nc)) break;
      const p = board[nr][nc];
      if (p) {
        if (p.color === byColor && (p.type === BISHOP || p.type === QUEEN)) return true;
        break;
      }
    }
  }

  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    for (let i = 1; i < 8; i++) {
      const nr = r + dr * i, nc = c + dc * i;
      if (!inBounds(nr, nc)) break;
      const p = board[nr][nc];
      if (p) {
        if (p.color === byColor && (p.type === ROOK || p.type === QUEEN)) return true;
        break;
      }
    }
  }

  return false;
}

export function isKingInCheck(board, color) {
  const king = findKing(board, color);
  if (!king) return false;
  return isSquareAttacked(board, king.row, king.col, opponent(color));
}

function getPseudoLegalMoves(state, fromRow, fromCol) {
  const piece = state.board[fromRow][fromCol];
  if (!piece) return [];

  const { board, enPassantTarget, castlingRights } = state;
  const color = piece.color;
  const moves = [];

  const tryAdd = (r, c) => {
    if (!inBounds(r, c)) return false;
    const target = board[r][c];
    if (target && target.color === color) return false;
    moves.push({ row: r, col: c });
    return !target;
  };

  switch (piece.type) {
    case PAWN: {
      const dir = color === WHITE ? -1 : 1;
      const startRow = color === WHITE ? 6 : 1;
      const next = fromRow + dir;

      if (inBounds(next, fromCol) && !board[next][fromCol]) {
        moves.push({ row: next, col: fromCol });
        const twoRow = fromRow + 2 * dir;
        if (fromRow === startRow && !board[twoRow][fromCol]) {
          moves.push({ row: twoRow, col: fromCol });
        }
      }

      for (const dc of [-1, 1]) {
        const nc = fromCol + dc;
        if (!inBounds(next, nc)) continue;
        const target = board[next][nc];
        if (target && target.color !== color) {
          moves.push({ row: next, col: nc });
        }
        if (enPassantTarget && enPassantTarget.row === next && enPassantTarget.col === nc) {
          moves.push({ row: next, col: nc });
        }
      }
      break;
    }

    case KNIGHT:
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])
        tryAdd(fromRow + dr, fromCol + dc);
      break;

    case BISHOP:
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]])
        for (let i = 1; i < 8; i++)
          if (!tryAdd(fromRow + dr * i, fromCol + dc * i)) break;
      break;

    case ROOK:
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]])
        for (let i = 1; i < 8; i++)
          if (!tryAdd(fromRow + dr * i, fromCol + dc * i)) break;
      break;

    case QUEEN:
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]])
        for (let i = 1; i < 8; i++)
          if (!tryAdd(fromRow + dr * i, fromCol + dc * i)) break;
      break;

    case KING: {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          tryAdd(fromRow + dr, fromCol + dc);
        }

      const rights = castlingRights[color];
      const row = color === WHITE ? 7 : 0;
      if (fromRow === row && fromCol === 4 && !isSquareAttacked(board, row, 4, opponent(color))) {
        if (rights.kingSide && !board[row][5] && !board[row][6] &&
            !isSquareAttacked(board, row, 5, opponent(color)) &&
            !isSquareAttacked(board, row, 6, opponent(color))) {
          moves.push({ row, col: 6 });
        }
        if (rights.queenSide && !board[row][1] && !board[row][2] && !board[row][3] &&
            !isSquareAttacked(board, row, 2, opponent(color)) &&
            !isSquareAttacked(board, row, 3, opponent(color))) {
          moves.push({ row, col: 2 });
        }
      }
      break;
    }
  }

  return moves;
}

function simulateMove(board, from, to, enPassantTarget) {
  const nb = copyBoard(board);
  const piece = nb[from.row][from.col];

  if (piece.type === PAWN && enPassantTarget &&
      to.row === enPassantTarget.row && to.col === enPassantTarget.col) {
    nb[from.row][to.col] = null;
  }

  if (piece.type === KING && Math.abs(to.col - from.col) === 2) {
    if (to.col > from.col) {
      nb[from.row][5] = nb[from.row][7];
      nb[from.row][7] = null;
    } else {
      nb[from.row][3] = nb[from.row][0];
      nb[from.row][0] = null;
    }
  }

  nb[to.row][to.col] = piece;
  nb[from.row][from.col] = null;
  return nb;
}

export function getValidMoves(state, fromRow, fromCol) {
  const piece = state.board[fromRow][fromCol];
  if (!piece || piece.color !== state.turn) return [];
  if (state.status === 'checkmate' || state.status === 'stalemate') return [];

  return getPseudoLegalMoves(state, fromRow, fromCol).filter(move => {
    const sim = simulateMove(state.board, { row: fromRow, col: fromCol }, move, state.enPassantTarget);
    return !isKingInCheck(sim, piece.color);
  });
}

export function isPromotion(board, from, to) {
  const piece = board[from.row][from.col];
  if (!piece || piece.type !== PAWN) return false;
  return (piece.color === WHITE && to.row === 0) || (piece.color === BLACK && to.row === 7);
}

export function makeMove(state, from, to, promotionPiece = QUEEN) {
  const nb = copyBoard(state.board);
  const piece = { ...nb[from.row][from.col] };
  let captured = nb[to.row][to.col];

  if (piece.type === PAWN && state.enPassantTarget &&
      to.row === state.enPassantTarget.row && to.col === state.enPassantTarget.col) {
    captured = nb[from.row][to.col];
    nb[from.row][to.col] = null;
  }

  if (piece.type === KING && Math.abs(to.col - from.col) === 2) {
    if (to.col > from.col) {
      nb[from.row][5] = nb[from.row][7];
      nb[from.row][7] = null;
    } else {
      nb[from.row][3] = nb[from.row][0];
      nb[from.row][0] = null;
    }
  }

  nb[to.row][to.col] = piece;
  nb[from.row][from.col] = null;

  if (piece.type === PAWN && (to.row === 0 || to.row === 7)) {
    nb[to.row][to.col] = { type: promotionPiece, color: piece.color };
  }

  let enPassantTarget = null;
  if (piece.type === PAWN && Math.abs(to.row - from.row) === 2) {
    enPassantTarget = { row: (from.row + to.row) / 2, col: from.col };
  }

  const cr = {
    [WHITE]: { ...state.castlingRights[WHITE] },
    [BLACK]: { ...state.castlingRights[BLACK] },
  };
  if (piece.type === KING) {
    cr[piece.color].kingSide = false;
    cr[piece.color].queenSide = false;
  }
  if (piece.type === ROOK) {
    if (piece.color === WHITE) {
      if (from.row === 7 && from.col === 0) cr[WHITE].queenSide = false;
      if (from.row === 7 && from.col === 7) cr[WHITE].kingSide = false;
    } else {
      if (from.row === 0 && from.col === 0) cr[BLACK].queenSide = false;
      if (from.row === 0 && from.col === 7) cr[BLACK].kingSide = false;
    }
  }
  if (to.row === 7 && to.col === 0) cr[WHITE].queenSide = false;
  if (to.row === 7 && to.col === 7) cr[WHITE].kingSide = false;
  if (to.row === 0 && to.col === 0) cr[BLACK].queenSide = false;
  if (to.row === 0 && to.col === 7) cr[BLACK].kingSide = false;

  const capturedPieces = [...state.capturedPieces];
  if (captured) capturedPieces.push({ type: captured.type, color: captured.color });

  const newState = {
    board: nb,
    turn: opponent(state.turn),
    castlingRights: cr,
    enPassantTarget,
    capturedPieces,
    lastMove: { from, to },
    status: 'playing',
  };

  newState.status = computeStatus(newState);
  return newState;
}

function hasAnyLegalMove(state) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (p && p.color === state.turn && getValidMoves(state, r, c).length > 0) return true;
    }
  return false;
}

function computeStatus(state) {
  const inCheck = isKingInCheck(state.board, state.turn);
  const hasMove = hasAnyLegalMove(state);
  if (inCheck && !hasMove) return 'checkmate';
  if (!inCheck && !hasMove) return 'stalemate';
  if (inCheck) return 'check';
  return 'playing';
}

export function createInitialState() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  const back = [ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK];
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: back[c], color: BLACK };
    board[1][c] = { type: PAWN, color: BLACK };
    board[6][c] = { type: PAWN, color: WHITE };
    board[7][c] = { type: back[c], color: WHITE };
  }
  return {
    board,
    turn: WHITE,
    castlingRights: {
      [WHITE]: { kingSide: true, queenSide: true },
      [BLACK]: { kingSide: true, queenSide: true },
    },
    enPassantTarget: null,
    capturedPieces: [],
    lastMove: null,
    status: 'playing',
  };
}
