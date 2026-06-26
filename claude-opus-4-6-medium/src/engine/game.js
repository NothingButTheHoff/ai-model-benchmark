import { COLORS, PIECES, INITIAL_BOARD } from './constants.js';
import { cloneBoard, opponent, getLegalMoves, hasAnyLegalMove, isInCheck } from './moves.js';

function createInitialState() {
  return {
    board: INITIAL_BOARD.map(row => row.map(cell => (cell ? { ...cell } : null))),
    turn: COLORS.WHITE,
    castlingRights: {
      [COLORS.WHITE]: { kingSide: true, queenSide: true },
      [COLORS.BLACK]: { kingSide: true, queenSide: true },
    },
    enPassantTarget: null,
    captured: { [COLORS.WHITE]: [], [COLORS.BLACK]: [] },
    status: 'playing', // 'playing' | 'check' | 'checkmate' | 'stalemate'
    winner: null,
    pendingPromotion: null,
  };
}

function updateCastlingRights(rights, piece, fromRow, fromCol, toRow, toCol) {
  const newRights = {
    [COLORS.WHITE]: { ...rights[COLORS.WHITE] },
    [COLORS.BLACK]: { ...rights[COLORS.BLACK] },
  };

  if (piece.type === PIECES.KING) {
    newRights[piece.color].kingSide = false;
    newRights[piece.color].queenSide = false;
  }
  if (piece.type === PIECES.ROOK) {
    if (piece.color === COLORS.WHITE && fromRow === 7) {
      if (fromCol === 0) newRights[COLORS.WHITE].queenSide = false;
      if (fromCol === 7) newRights[COLORS.WHITE].kingSide = false;
    }
    if (piece.color === COLORS.BLACK && fromRow === 0) {
      if (fromCol === 0) newRights[COLORS.BLACK].queenSide = false;
      if (fromCol === 7) newRights[COLORS.BLACK].kingSide = false;
    }
  }

  // rook captured
  if (toRow === 0 && toCol === 0) newRights[COLORS.BLACK].queenSide = false;
  if (toRow === 0 && toCol === 7) newRights[COLORS.BLACK].kingSide = false;
  if (toRow === 7 && toCol === 0) newRights[COLORS.WHITE].queenSide = false;
  if (toRow === 7 && toCol === 7) newRights[COLORS.WHITE].kingSide = false;

  return newRights;
}

export function makeMove(state, fromRow, fromCol, toRow, toCol) {
  const piece = state.board[fromRow][fromCol];
  if (!piece || piece.color !== state.turn) return null;

  const legalMoves = getLegalMoves(state.board, fromRow, fromCol, state.enPassantTarget, state.castlingRights);
  if (!legalMoves.some(([r, c]) => r === toRow && c === toCol)) return null;

  const newBoard = cloneBoard(state.board);
  const newCaptured = {
    [COLORS.WHITE]: [...state.captured[COLORS.WHITE]],
    [COLORS.BLACK]: [...state.captured[COLORS.BLACK]],
  };
  let newEnPassant = null;

  // Capture
  const targetPiece = newBoard[toRow][toCol];
  if (targetPiece) {
    newCaptured[piece.color].push(targetPiece);
  }

  // En passant capture
  if (piece.type === PIECES.PAWN && state.enPassantTarget &&
      toRow === state.enPassantTarget[0] && toCol === state.enPassantTarget[1] &&
      !targetPiece) {
    const capturedPawn = newBoard[fromRow][toCol];
    if (capturedPawn) newCaptured[piece.color].push(capturedPawn);
    newBoard[fromRow][toCol] = null;
  }

  // Castling
  if (piece.type === PIECES.KING && Math.abs(toCol - fromCol) === 2) {
    if (toCol === 6) {
      newBoard[fromRow][5] = newBoard[fromRow][7];
      newBoard[fromRow][7] = null;
    } else if (toCol === 2) {
      newBoard[fromRow][3] = newBoard[fromRow][0];
      newBoard[fromRow][0] = null;
    }
  }

  // Pawn double push — set en passant target
  if (piece.type === PIECES.PAWN && Math.abs(toRow - fromRow) === 2) {
    const epRow = (fromRow + toRow) / 2;
    newEnPassant = [epRow, fromCol];
  }

  // Move piece
  newBoard[toRow][toCol] = { ...piece };
  newBoard[fromRow][fromCol] = null;

  // Pawn promotion check
  const promotionRow = piece.color === COLORS.WHITE ? 0 : 7;
  if (piece.type === PIECES.PAWN && toRow === promotionRow) {
    return {
      board: newBoard,
      turn: state.turn,
      castlingRights: updateCastlingRights(state.castlingRights, piece, fromRow, fromCol, toRow, toCol),
      enPassantTarget: newEnPassant,
      captured: newCaptured,
      status: 'playing',
      winner: null,
      pendingPromotion: { row: toRow, col: toCol },
    };
  }

  const newCastling = updateCastlingRights(state.castlingRights, piece, fromRow, fromCol, toRow, toCol);
  const nextTurn = opponent(state.turn);

  return resolveStatus({
    board: newBoard,
    turn: nextTurn,
    castlingRights: newCastling,
    enPassantTarget: newEnPassant,
    captured: newCaptured,
    pendingPromotion: null,
  });
}

export function applyPromotion(state, pieceType) {
  if (!state.pendingPromotion) return state;
  const { row, col } = state.pendingPromotion;
  const newBoard = cloneBoard(state.board);
  newBoard[row][col] = { type: pieceType, color: state.turn };

  const nextTurn = opponent(state.turn);
  return resolveStatus({
    board: newBoard,
    turn: nextTurn,
    castlingRights: state.castlingRights,
    enPassantTarget: state.enPassantTarget,
    captured: state.captured,
    pendingPromotion: null,
  });
}

function resolveStatus(partialState) {
  const { board, turn, enPassantTarget, castlingRights } = partialState;
  const inCheck = isInCheck(board, turn);
  const hasMove = hasAnyLegalMove(board, turn, enPassantTarget, castlingRights);

  let status = 'playing';
  let winner = null;

  if (!hasMove) {
    if (inCheck) {
      status = 'checkmate';
      winner = opponent(turn);
    } else {
      status = 'stalemate';
    }
  } else if (inCheck) {
    status = 'check';
  }

  return { ...partialState, status, winner };
}

export { createInitialState };
