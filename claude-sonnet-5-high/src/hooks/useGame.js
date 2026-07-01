import { useCallback, useEffect, useState } from 'react';
import { createGame, applyMove, getLegalMovesForSquare } from '../engine/game.js';

const STORAGE_KEY = 'chess-game-state-v1';

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.board) || !parsed.turn) return null;
    return parsed;
  } catch {
    return null;
  }
}

function squaresEqual(a, b) {
  return !!a && !!b && a.row === b.row && a.col === b.col;
}

export function useGame() {
  const [game, setGame] = useState(() => loadSavedState() ?? createGame());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [pendingPromotion, setPendingPromotion] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  const selectSquare = useCallback(
    (square) => {
      if (pendingPromotion) return;

      const piece = game.board[square.row][square.col];
      const isOwnPiece = piece && piece.color === game.turn;

      if (selectedSquare && squaresEqual(square, selectedSquare)) {
        clearSelection();
        return;
      }

      if (selectedSquare) {
        const move = legalMoves.find((m) => squaresEqual(m.to, square));
        if (move) {
          if (move.promotion) {
            setPendingPromotion(move);
          } else {
            setGame((prev) => applyMove(prev, move));
            clearSelection();
          }
          return;
        }
      }

      if (isOwnPiece) {
        setSelectedSquare(square);
        setLegalMoves(getLegalMovesForSquare(game, square));
      } else {
        clearSelection();
      }
    },
    [game, selectedSquare, legalMoves, pendingPromotion, clearSelection]
  );

  const choosePromotion = useCallback(
    (pieceType) => {
      if (!pendingPromotion) return;
      const finalMove = { ...pendingPromotion, promotion: pieceType };
      setGame((prev) => applyMove(prev, finalMove));
      setPendingPromotion(null);
      clearSelection();
    },
    [pendingPromotion, clearSelection]
  );

  const resetGame = useCallback(() => {
    setGame(createGame());
    setPendingPromotion(null);
    clearSelection();
  }, [clearSelection]);

  return {
    game,
    selectedSquare,
    legalMoves,
    pendingPromotion,
    selectSquare,
    choosePromotion,
    resetGame,
  };
}
