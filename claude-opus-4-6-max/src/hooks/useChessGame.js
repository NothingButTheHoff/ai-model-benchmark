import { useState, useCallback, useEffect } from 'react';
import { createInitialState, getValidMoves, makeMove, isPromotion } from '../engine';

const STORAGE_KEY = 'chess-game-state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupted — start fresh */ }
  return createInitialState();
}

export default function useChessGame() {
  const [gameState, setGameState] = useState(loadState);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [pendingPromotion, setPendingPromotion] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  const select = useCallback((row, col, state) => {
    setSelectedSquare({ row, col });
    setValidMoves(getValidMoves(state, row, col));
  }, []);

  const deselect = useCallback(() => {
    setSelectedSquare(null);
    setValidMoves([]);
  }, []);

  const handleSquareClick = useCallback((row, col) => {
    if (gameState.status === 'checkmate' || gameState.status === 'stalemate') return;
    if (pendingPromotion) return;

    const clickedPiece = gameState.board[row][col];

    if (selectedSquare) {
      if (selectedSquare.row === row && selectedSquare.col === col) {
        deselect();
        return;
      }

      if (validMoves.some(m => m.row === row && m.col === col)) {
        const from = selectedSquare;
        const to = { row, col };
        if (isPromotion(gameState.board, from, to)) {
          setPendingPromotion({ from, to });
          return;
        }
        setGameState(makeMove(gameState, from, to));
        deselect();
        return;
      }

      if (clickedPiece && clickedPiece.color === gameState.turn) {
        select(row, col, gameState);
        return;
      }

      deselect();
      return;
    }

    if (clickedPiece && clickedPiece.color === gameState.turn) {
      select(row, col, gameState);
    }
  }, [gameState, selectedSquare, validMoves, pendingPromotion, select, deselect]);

  const handlePromotion = useCallback((pieceType) => {
    if (!pendingPromotion) return;
    setGameState(makeMove(gameState, pendingPromotion.from, pendingPromotion.to, pieceType));
    setPendingPromotion(null);
    deselect();
  }, [gameState, pendingPromotion, deselect]);

  const resetGame = useCallback(() => {
    setGameState(createInitialState());
    deselect();
    setPendingPromotion(null);
  }, [deselect]);

  return { gameState, selectedSquare, validMoves, pendingPromotion, handleSquareClick, handlePromotion, resetGame };
}
