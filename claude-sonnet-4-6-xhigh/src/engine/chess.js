// Chess engine — pure game logic, no UI dependencies

export const COLORS = { WHITE: 'white', BLACK: 'black' };
export const PIECES = {
  KING: 'K', QUEEN: 'Q', ROOK: 'R', BISHOP: 'B', KNIGHT: 'N', PAWN: 'P'
};

// Initial board layout: [piece, color] or null
const INITIAL_BOARD = (() => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  const backRow = [PIECES.ROOK, PIECES.KNIGHT, PIECES.BISHOP, PIECES.QUEEN,
                   PIECES.KING, PIECES.BISHOP, PIECES.KNIGHT, PIECES.ROOK];
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRow[col], color: COLORS.BLACK };
    board[1][col] = { type: PIECES.PAWN, color: COLORS.BLACK };
    board[6][col] = { type: PIECES.PAWN, color: COLORS.WHITE };
    board[7][col] = { type: backRow[col], color: COLORS.WHITE };
  }
  return board;
})();

export function createInitialState() {
  return {
    board: INITIAL_BOARD.map(row => row.map(cell => cell ? { ...cell } : null)),
    currentTurn: COLORS.WHITE,
    // castling rights: { white: { kingside, queenside }, black: { kingside, queenside } }
    castlingRights: {
      white: { kingside: true, queenside: true },
      black: { kingside: true, queenside: true },
    },
    // en passant target square [row, col] or null
    enPassantTarget: null,
    capturedPieces: { white: [], black: [] },
    status: 'playing', // 'playing' | 'check' | 'checkmate' | 'stalemate'
    winner: null,
    promotionPending: null, // { from, to } when pawn reaches last rank
    moveHistory: [],
  };
}

function cloneBoard(board) {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

function cloneState(state) {
  return {
    ...state,
    board: cloneBoard(state.board),
    castlingRights: {
      white: { ...state.castlingRights.white },
      black: { ...state.castlingRights.black },
    },
    capturedPieces: {
      white: [...state.capturedPieces.white],
      black: [...state.capturedPieces.black],
    },
    moveHistory: [...state.moveHistory],
  };
}

function opponent(color) {
  return color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
}

function inBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Find king position for a given color
function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === PIECES.KING && p.color === color) return [r, c];
    }
  }
  return null;
}

// Check if a square is attacked by any piece of `attackerColor`
function isSquareAttacked(board, row, col, attackerColor) {
  // Knight attacks
  const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of knightMoves) {
    const r = row + dr, c = col + dc;
    if (inBounds(r, c)) {
      const p = board[r][c];
      if (p && p.color === attackerColor && p.type === PIECES.KNIGHT) return true;
    }
  }

  // Sliding pieces: rook/queen (straight) and bishop/queen (diagonal)
  const straightDirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr, dc] of straightDirs) {
    let r = row + dr, c = col + dc;
    while (inBounds(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.color === attackerColor && (p.type === PIECES.ROOK || p.type === PIECES.QUEEN)) return true;
        break;
      }
      r += dr; c += dc;
    }
  }

  const diagDirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
  for (const [dr, dc] of diagDirs) {
    let r = row + dr, c = col + dc;
    while (inBounds(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.color === attackerColor && (p.type === PIECES.BISHOP || p.type === PIECES.QUEEN)) return true;
        break;
      }
      r += dr; c += dc;
    }
  }

  // Pawn attacks
  const pawnDir = attackerColor === COLORS.WHITE ? 1 : -1; // white pawns attack upward (decreasing row from their perspective, but attacking squares above them)
  // If attackerColor is white, their pawns attack from higher row numbers toward lower
  // White pawn at (r,c) attacks (r-1, c-1) and (r-1, c+1)
  // Black pawn at (r,c) attacks (r+1, c-1) and (r+1, c+1)
  // So to check if (row,col) is attacked by attacker's pawn:
  // white pawn would be at (row+1, col-1) or (row+1, col+1)
  // black pawn would be at (row-1, col-1) or (row-1, col+1)
  const pawnRow = attackerColor === COLORS.WHITE ? row + 1 : row - 1;
  for (const dc of [-1, 1]) {
    const c = col + dc;
    if (inBounds(pawnRow, c)) {
      const p = board[pawnRow][c];
      if (p && p.color === attackerColor && p.type === PIECES.PAWN) return true;
    }
  }

  // King attacks (to prevent kings from moving adjacent to each other)
  const kingDirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  for (const [dr, dc] of kingDirs) {
    const r = row + dr, c = col + dc;
    if (inBounds(r, c)) {
      const p = board[r][c];
      if (p && p.color === attackerColor && p.type === PIECES.KING) return true;
    }
  }

  return false;
}

function isInCheck(board, color) {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  return isSquareAttacked(board, kingPos[0], kingPos[1], opponent(color));
}

// Generate pseudo-legal moves for a piece (does not check if they leave own king in check)
function generatePseudoMoves(state, fromRow, fromCol) {
  const { board, enPassantTarget, castlingRights } = state;
  const piece = board[fromRow][fromCol];
  if (!piece) return [];

  const { type, color } = piece;
  const moves = [];
  const opp = opponent(color);

  function addMove(toRow, toCol, extra = {}) {
    moves.push({ from: [fromRow, fromCol], to: [toRow, toCol], ...extra });
  }

  function addSlidingMoves(dirs) {
    for (const [dr, dc] of dirs) {
      let r = fromRow + dr, c = fromCol + dc;
      while (inBounds(r, c)) {
        const target = board[r][c];
        if (target) {
          if (target.color === opp) addMove(r, c);
          break;
        }
        addMove(r, c);
        r += dr; c += dc;
      }
    }
  }

  switch (type) {
    case PIECES.PAWN: {
      const dir = color === COLORS.WHITE ? -1 : 1;
      const startRow = color === COLORS.WHITE ? 6 : 1;
      const promotionRow = color === COLORS.WHITE ? 0 : 7;

      // Forward move
      const r1 = fromRow + dir;
      if (inBounds(r1, fromCol) && !board[r1][fromCol]) {
        if (r1 === promotionRow) {
          for (const promo of [PIECES.QUEEN, PIECES.ROOK, PIECES.BISHOP, PIECES.KNIGHT]) {
            addMove(r1, fromCol, { promotion: promo });
          }
        } else {
          addMove(r1, fromCol);
        }
        // Double push from start
        if (fromRow === startRow) {
          const r2 = fromRow + 2 * dir;
          if (!board[r2][fromCol]) {
            addMove(r2, fromCol, { enPassantSquare: [r1, fromCol] });
          }
        }
      }

      // Captures
      for (const dc of [-1, 1]) {
        const c = fromCol + dc;
        if (!inBounds(r1, c)) continue;
        const target = board[r1][c];
        if (target && target.color === opp) {
          if (r1 === promotionRow) {
            for (const promo of [PIECES.QUEEN, PIECES.ROOK, PIECES.BISHOP, PIECES.KNIGHT]) {
              addMove(r1, c, { promotion: promo });
            }
          } else {
            addMove(r1, c);
          }
        }
        // En passant
        if (enPassantTarget && enPassantTarget[0] === r1 && enPassantTarget[1] === c) {
          addMove(r1, c, { enPassant: true, capturedPawnRow: fromRow });
        }
      }
      break;
    }

    case PIECES.KNIGHT: {
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const r = fromRow + dr, c = fromCol + dc;
        if (inBounds(r, c)) {
          const target = board[r][c];
          if (!target || target.color === opp) addMove(r, c);
        }
      }
      break;
    }

    case PIECES.BISHOP:
      addSlidingMoves([[-1,-1],[-1,1],[1,-1],[1,1]]);
      break;

    case PIECES.ROOK:
      addSlidingMoves([[-1,0],[1,0],[0,-1],[0,1]]);
      break;

    case PIECES.QUEEN:
      addSlidingMoves([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
      break;

    case PIECES.KING: {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        const r = fromRow + dr, c = fromCol + dc;
        if (inBounds(r, c)) {
          const target = board[r][c];
          if (!target || target.color === opp) addMove(r, c);
        }
      }

      // Castling
      const rights = castlingRights[color];
      const kingRow = color === COLORS.WHITE ? 7 : 0;
      if (fromRow === kingRow && fromCol === 4 && !isInCheck(board, color)) {
        // Kingside
        if (rights.kingside &&
            !board[kingRow][5] && !board[kingRow][6] &&
            board[kingRow][7]?.type === PIECES.ROOK &&
            !isSquareAttacked(board, kingRow, 5, opp) &&
            !isSquareAttacked(board, kingRow, 6, opp)) {
          addMove(kingRow, 6, { castling: 'kingside' });
        }
        // Queenside
        if (rights.queenside &&
            !board[kingRow][3] && !board[kingRow][2] && !board[kingRow][1] &&
            board[kingRow][0]?.type === PIECES.ROOK &&
            !isSquareAttacked(board, kingRow, 3, opp) &&
            !isSquareAttacked(board, kingRow, 2, opp)) {
          addMove(kingRow, 2, { castling: 'queenside' });
        }
      }
      break;
    }
  }

  return moves;
}

// Apply a move to a cloned state (does not validate legality)
function applyMoveToState(state, move) {
  const newState = cloneState(state);
  const { board } = newState;
  const [fromRow, fromCol] = move.from;
  const [toRow, toCol] = move.to;
  const piece = board[fromRow][fromCol];
  const captured = board[toRow][toCol];

  // Track captured piece
  if (captured) {
    newState.capturedPieces[piece.color].push(captured);
  }

  // En passant capture
  if (move.enPassant) {
    const capturedPawn = board[move.capturedPawnRow][toCol];
    if (capturedPawn) {
      newState.capturedPieces[piece.color].push(capturedPawn);
    }
    board[move.capturedPawnRow][toCol] = null;
  }

  // Move piece
  board[toRow][toCol] = move.promotion ? { type: move.promotion, color: piece.color } : { ...piece };
  board[fromRow][fromCol] = null;

  // Castling: move rook
  if (move.castling) {
    const rookRow = toRow;
    if (move.castling === 'kingside') {
      board[rookRow][5] = board[rookRow][7];
      board[rookRow][7] = null;
    } else {
      board[rookRow][3] = board[rookRow][0];
      board[rookRow][0] = null;
    }
  }

  // Update castling rights
  if (piece.type === PIECES.KING) {
    newState.castlingRights[piece.color].kingside = false;
    newState.castlingRights[piece.color].queenside = false;
  }
  if (piece.type === PIECES.ROOK) {
    const homeRow = piece.color === COLORS.WHITE ? 7 : 0;
    if (fromRow === homeRow && fromCol === 0) newState.castlingRights[piece.color].queenside = false;
    if (fromRow === homeRow && fromCol === 7) newState.castlingRights[piece.color].kingside = false;
  }
  // If rook is captured, revoke opponent castling right
  if (captured?.type === PIECES.ROOK) {
    const homeRow = captured.color === COLORS.WHITE ? 7 : 0;
    if (toRow === homeRow && toCol === 0) newState.castlingRights[captured.color].queenside = false;
    if (toRow === homeRow && toCol === 7) newState.castlingRights[captured.color].kingside = false;
  }

  // Update en passant target
  newState.enPassantTarget = move.enPassantSquare || null;

  // Switch turn
  newState.currentTurn = opponent(piece.color);

  return newState;
}

// Get all legal moves for a color (filters out moves leaving own king in check)
export function getLegalMoves(state, color) {
  const legalMoves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = state.board[r][c];
      if (!piece || piece.color !== color) continue;
      const pseudos = generatePseudoMoves(state, r, c);
      for (const move of pseudos) {
        // For promotion, we only need to check one promotion variant to determine legality
        // (all promotions from same square are equally legal)
        const testState = applyMoveToState(state, move);
        if (!isInCheck(testState.board, color)) {
          legalMoves.push(move);
        }
      }
    }
  }
  return legalMoves;
}

// Get legal moves for a specific piece
export function getLegalMovesForPiece(state, fromRow, fromCol) {
  const piece = state.board[fromRow][fromCol];
  if (!piece) return [];
  const allLegal = getLegalMoves(state, piece.color);
  return allLegal.filter(m => m.from[0] === fromRow && m.from[1] === fromCol);
}

// Apply a legal move and compute new game status
export function applyMove(state, move) {
  const newState = applyMoveToState(state, move);
  const movedColor = state.currentTurn; // who just moved
  const nextColor = newState.currentTurn;

  // Record move
  newState.moveHistory = [...state.moveHistory, move];

  // Compute status
  const nextLegal = getLegalMoves(newState, nextColor);
  const inCheckNow = isInCheck(newState.board, nextColor);

  if (nextLegal.length === 0) {
    if (inCheckNow) {
      newState.status = 'checkmate';
      newState.winner = movedColor;
    } else {
      newState.status = 'stalemate';
      newState.winner = null;
    }
  } else if (inCheckNow) {
    newState.status = 'check';
  } else {
    newState.status = 'playing';
  }

  return newState;
}

// Check if a move is legal given state
export function isMoveLegal(state, from, to, promotion = null) {
  const legal = getLegalMovesForPiece(state, from[0], from[1]);
  return legal.some(m =>
    m.to[0] === to[0] && m.to[1] === to[1] &&
    (promotion === null || m.promotion === promotion)
  );
}

// Find matching legal move object
export function findMove(state, from, to, promotion = null) {
  const legal = getLegalMovesForPiece(state, from[0], from[1]);
  // If promotion choices exist, pick matching one (or first if not specified)
  const candidates = legal.filter(m => m.to[0] === to[0] && m.to[1] === to[1]);
  if (candidates.length === 0) return null;
  if (promotion) return candidates.find(m => m.promotion === promotion) || null;
  // If there are promotion moves, caller must specify; return null to trigger UI
  return candidates[0];
}

export function needsPromotion(state, from, to) {
  const legal = getLegalMovesForPiece(state, from[0], from[1]);
  const candidates = legal.filter(m => m.to[0] === to[0] && m.to[1] === to[1]);
  return candidates.length > 0 && candidates.some(m => m.promotion);
}
