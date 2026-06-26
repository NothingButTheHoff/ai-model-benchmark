import { PIECES, COLORS } from './constants.js';
import { cloneBoard, cloneState, opponent } from './utils.js';
import { getPseudoLegalMoves } from './moveGenerator.js';

// Check if a color's king is under attack
export const isInCheck = (board, color, enPassantTarget, castlingRights) => {
  // Find king position
  let kingRow = -1, kingCol = -1;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.type === PIECES.KING && board[r][c]?.color === color) {
        kingRow = r; kingCol = c;
      }
    }
  }
  if (kingRow === -1) return false;

  const opp = opponent(color);
  // Check if any opponent piece can attack the king
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color === opp) {
        const moves = getPseudoLegalMoves(board, r, c, enPassantTarget, castlingRights);
        if (moves.some(m => m.row === kingRow && m.col === kingCol)) return true;
      }
    }
  }
  return false;
};

// Apply a move and return new board state (without updating game status)
const applyMoveToBoard = (board, from, to, enPassantTarget) => {
  const newBoard = cloneBoard(board);
  const piece = newBoard[from.row][from.col];

  // En passant capture
  if (to.enPassant) {
    const capturedPawnRow = from.row; // same row as moving pawn
    newBoard[capturedPawnRow][to.col] = null;
  }

  // Castling: move rook
  if (to.castling) {
    const backRow = from.row;
    if (to.castling === 'kingside') {
      newBoard[backRow][5] = newBoard[backRow][7];
      newBoard[backRow][7] = null;
    } else {
      newBoard[backRow][3] = newBoard[backRow][0];
      newBoard[backRow][0] = null;
    }
  }

  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;
  return newBoard;
};

// Get all legal moves for a piece (filters out moves that leave king in check)
export const getLegalMoves = (state, row, col) => {
  const { board, enPassantTarget, castlingRights } = state;
  const piece = board[row][col];
  if (!piece) return [];

  const color = piece.color;
  const pseudoMoves = getPseudoLegalMoves(board, row, col, enPassantTarget, castlingRights);

  return pseudoMoves.filter(move => {
    const newBoard = applyMoveToBoard(board, { row, col }, move, enPassantTarget);

    // For castling, check that king doesn't pass through check
    if (move.castling) {
      const passThroughCol = move.castling === 'kingside' ? 5 : 3;
      const passThroughBoard = applyMoveToBoard(board, { row, col }, { row, col: passThroughCol }, enPassantTarget);
      if (isInCheck(passThroughBoard, color, null, castlingRights)) return false;
      // Also can't castle out of check
      if (isInCheck(board, color, enPassantTarget, castlingRights)) return false;
    }

    return !isInCheck(newBoard, color, null, castlingRights);
  });
};

// Apply a full legal move and return updated game state
export const applyMove = (state, from, to, promotionPiece = null) => {
  const newState = cloneState(state);
  const { board } = newState;
  const piece = board[from.row][from.col];
  if (!piece) return newState;

  const color = piece.color;
  const opp = opponent(color);
  let captured = board[to.row][to.col];

  // En passant capture
  if (to.enPassant) {
    const capturedPawnRow = from.row;
    captured = board[capturedPawnRow][to.col];
    board[capturedPawnRow][to.col] = null;
  }

  // Castling: move rook
  if (to.castling) {
    const backRow = from.row;
    if (to.castling === 'kingside') {
      board[backRow][5] = board[backRow][7];
      board[backRow][7] = null;
    } else {
      board[backRow][3] = board[backRow][0];
      board[backRow][0] = null;
    }
  }

  // Move piece
  board[to.row][to.col] = piece;
  board[from.row][from.col] = null;

  // Pawn promotion
  const promotionRow = color === COLORS.WHITE ? 0 : 7;
  if (piece.type === PIECES.PAWN && to.row === promotionRow) {
    if (promotionPiece) {
      board[to.row][to.col] = { type: promotionPiece, color };
    } else {
      // Signal that promotion is pending
      newState.promotionPending = { from, to };
      newState.board = board;
      return newState;
    }
  }

  // Update captured pieces
  if (captured) {
    newState.capturedPieces[color].push(captured);
  }

  // Update en passant target
  if (piece.type === PIECES.PAWN && Math.abs(to.row - from.row) === 2) {
    newState.enPassantTarget = { row: (from.row + to.row) / 2, col: from.col };
  } else {
    newState.enPassantTarget = null;
  }

  // Update castling rights
  if (piece.type === PIECES.KING) {
    newState.castlingRights[color] = { kingside: false, queenside: false };
  }
  if (piece.type === PIECES.ROOK) {
    const backRow = color === COLORS.WHITE ? 7 : 0;
    if (from.row === backRow) {
      if (from.col === 0) newState.castlingRights[color].queenside = false;
      if (from.col === 7) newState.castlingRights[color].kingside = false;
    }
  }
  // If rook is captured, remove castling rights
  if (captured?.type === PIECES.ROOK) {
    const oppBackRow = opp === COLORS.WHITE ? 7 : 0;
    if (to.row === oppBackRow) {
      if (to.col === 0) newState.castlingRights[opp].queenside = false;
      if (to.col === 7) newState.castlingRights[opp].kingside = false;
    }
  }

  // Switch turn
  newState.turn = opp;
  newState.promotionPending = null;

  // Update game status
  newState.status = getGameStatus(newState);

  return newState;
};

const getGameStatus = (state) => {
  const { board, turn, enPassantTarget, castlingRights } = state;
  const inCheck = isInCheck(board, turn, enPassantTarget, castlingRights);

  // Check if current player has any legal moves
  let hasLegalMoves = false;
  outer: for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color === turn) {
        const moves = getLegalMoves(state, r, c);
        if (moves.length > 0) { hasLegalMoves = true; break outer; }
      }
    }
  }

  if (!hasLegalMoves) return inCheck ? 'checkmate' : 'stalemate';
  return inCheck ? 'check' : 'playing';
};
