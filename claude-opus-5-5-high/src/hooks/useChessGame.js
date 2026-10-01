import { useCallback, useEffect, useMemo, useState } from 'react';
import { createInitialState, getLegalMoves, isGameOver, isSameSquare, makeMove } from '../engine/index.js';
import { loadGame, saveGame } from '../storage/gameStorage.js';

export function useChessGame() {
  const [game, setGame] = useState(() => loadGame() ?? createInitialState());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);

  useEffect(() => {
    saveGame(game);
  }, [game]);

  const legalMoves = useMemo(
    () => (selectedSquare ? getLegalMoves(game, selectedSquare) : []),
    [game, selectedSquare],
  );

  const commitMove = useCallback((from, to, promotionType) => {
    setGame((current) => makeMove(current, from, to, promotionType) ?? current);
    setSelectedSquare(null);
    setPendingPromotion(null);
  }, []);

  const selectSquare = useCallback(
    (square) => {
      if (pendingPromotion || isGameOver(game.status)) return;

      const move = legalMoves.find((candidate) => isSameSquare(candidate.to, square));
      if (move) {
        if (move.isPromotion) setPendingPromotion(move);
        else commitMove(move.from, move.to);
        return;
      }

      const piece = game.board[square.row]?.[square.col];
      const canSelect = piece?.color === game.turn && !isSameSquare(square, selectedSquare);
      setSelectedSquare(canSelect ? square : null);
    },
    [commitMove, game, legalMoves, pendingPromotion, selectedSquare],
  );

  const choosePromotion = useCallback(
    (promotionType) => {
      if (pendingPromotion) commitMove(pendingPromotion.from, pendingPromotion.to, promotionType);
    },
    [commitMove, pendingPromotion],
  );

  const cancelPromotion = useCallback(() => setPendingPromotion(null), []);

  const resetGame = useCallback(() => {
    setGame(createInitialState());
    setSelectedSquare(null);
    setPendingPromotion(null);
  }, []);

  return {
    game,
    selectedSquare,
    legalMoves,
    pendingPromotion,
    selectSquare,
    choosePromotion,
    cancelPromotion,
    resetGame,
  };
}
