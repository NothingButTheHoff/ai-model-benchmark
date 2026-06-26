import { useState, useCallback, useEffect } from 'react';
import {
  createInitialState,
  getLegalMovesForPiece,
  applyMove,
  findMove,
  needsPromotion,
  COLORS,
} from '../engine/chess';

const STORAGE_KEY = 'chess_game_state';

function serializeState(state) {
  return JSON.stringify(state);
}

function deserializeState(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return deserializeState(raw);
  } catch {
    return null;
  }
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, serializeState(state));
  } catch {
    // ignore storage errors
  }
}

export function useChessGame() {
  const [gameState, setGameState] = useState(() => {
    const saved = loadFromStorage();
    return saved || createInitialState();
  });
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [promotionState, setPromotionState] = useState(null); // { from, to }

  // Persist to localStorage on every state change
  useEffect(() => {
    saveToStorage(gameState);
  }, [gameState]);

  const selectSquare = useCallback((row, col) => {
    const { board, currentTurn, status } = gameState;

    if (status === 'checkmate' || status === 'stalemate') return;

    const piece = board[row][col];

    // If promotion dialog open, ignore board clicks
    if (promotionState) return;

    // If a square is already selected
    if (selectedSquare) {
      const [selRow, selCol] = selectedSquare;

      // Clicking same square deselects
      if (selRow === row && selCol === col) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      // Check if clicking a valid move target
      const isValid = validMoves.some(m => m.to[0] === row && m.to[1] === col);
      if (isValid) {
        // Check if this move requires promotion selection
        if (needsPromotion(gameState, selectedSquare, [row, col])) {
          setPromotionState({ from: selectedSquare, to: [row, col] });
          return;
        }

        const move = findMove(gameState, selectedSquare, [row, col]);
        if (move) {
          setGameState(prev => applyMove(prev, move));
        }
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      // Clicking a friendly piece switches selection
      if (piece && piece.color === currentTurn) {
        setSelectedSquare([row, col]);
        setValidMoves(getLegalMovesForPiece(gameState, row, col));
        return;
      }

      // Clicking empty/enemy without valid move: deselect
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    // No selection yet — select own piece
    if (piece && piece.color === currentTurn) {
      setSelectedSquare([row, col]);
      setValidMoves(getLegalMovesForPiece(gameState, row, col));
    }
  }, [gameState, selectedSquare, validMoves, promotionState]);

  const handlePromotion = useCallback((pieceType) => {
    if (!promotionState) return;
    const { from, to } = promotionState;
    const move = findMove(gameState, from, to, pieceType);
    if (move) {
      setGameState(prev => applyMove(prev, move));
    }
    setPromotionState(null);
    setSelectedSquare(null);
    setValidMoves([]);
  }, [gameState, promotionState]);

  const resetGame = useCallback(() => {
    const fresh = createInitialState();
    setGameState(fresh);
    setSelectedSquare(null);
    setValidMoves([]);
    setPromotionState(null);
    saveToStorage(fresh);
  }, []);

  return {
    gameState,
    selectedSquare,
    validMoves,
    promotionState,
    selectSquare,
    handlePromotion,
    resetGame,
  };
}
