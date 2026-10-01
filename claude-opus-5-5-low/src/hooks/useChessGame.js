import { useCallback, useEffect, useMemo, useState } from 'react';
import { createInitialState, findLegalMove, isGameOver, makeMove } from '../engine/game.js';
import { getLegalMoves } from '../engine/moves.js';
import { clearState, loadState, saveState } from '../engine/storage.js';

export function useChessGame() {
  const [game, setGame] = useState(() => loadState() ?? createInitialState());
  const [selected, setSelected] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => saveState(game), [game]);

  const validMoves = useMemo(() => (selected ? getLegalMoves(game, selected) : []), [game, selected]);

  const commitMove = useCallback(
    (from, to, promotionType) => {
      try {
        setGame(makeMove(game, from, to, promotionType));
        setError(null);
      } catch (e) {
        setError(e.message);
      }
      setSelected(null);
      setPendingPromotion(null);
    },
    [game],
  );

  const selectSquare = useCallback(
    (square) => {
      if (isGameOver(game) || pendingPromotion) return;
      const piece = game.board[square.row]?.[square.col];

      if (selected) {
        const move = findLegalMove(game, selected, square);
        if (move?.promotion) {
          setPendingPromotion({ from: selected, to: square });
          return;
        }
        if (move) {
          commitMove(selected, square);
          return;
        }
      }
      setSelected(piece?.color === game.turn ? square : null);
    },
    [game, selected, pendingPromotion, commitMove],
  );

  const choosePromotion = useCallback(
    (type) => pendingPromotion && commitMove(pendingPromotion.from, pendingPromotion.to, type),
    [pendingPromotion, commitMove],
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    setSelected(null);
  }, []);

  const resetGame = useCallback(() => {
    clearState();
    setGame(createInitialState());
    setSelected(null);
    setPendingPromotion(null);
    setError(null);
  }, []);

  return { game, selected, validMoves, pendingPromotion, error, selectSquare, choosePromotion, cancelPromotion, resetGame };
}
