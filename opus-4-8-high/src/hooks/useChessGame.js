// React hook owning all game state, user interaction, and persistence.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createGame,
  makeMove,
  isGameOver,
  serializeGame,
  deserializeGame,
} from '../engine/game.js';
import { legalMovesForSquare } from '../engine/moves.js';

const STORAGE_KEY = 'browser-chess:game:v1';

function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = deserializeGame(raw);
    return saved ?? createGame();
  } catch {
    // localStorage may be unavailable (private mode, etc.) — fall back.
    return createGame();
  }
}

export function useChessGame() {
  const [game, setGame] = useState(loadGame);
  const [selected, setSelected] = useState(null); // { row, col } | null
  const [pendingPromotion, setPendingPromotion] = useState(null); // { move } | null

  // Persist on every game change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeGame(game));
    } catch {
      /* ignore persistence failures */
    }
  }, [game]);

  // Legal moves for the currently-selected square.
  const legalForSelected = useMemo(() => {
    if (!selected) return [];
    return legalMovesForSquare(game.state, selected.row, selected.col);
  }, [game, selected]);

  // Map of "row,col" -> move object for quick lookup of valid targets.
  const targets = useMemo(() => {
    const map = new Map();
    for (const m of legalForSelected) map.set(`${m.to.row},${m.to.col}`, m);
    return map;
  }, [legalForSelected]);

  const commitMove = useCallback((move) => {
    setGame((g) => makeMove(g, move));
    setSelected(null);
    setPendingPromotion(null);
  }, []);

  // Handle a click on a board square.
  const onSquareClick = useCallback(
    (row, col) => {
      if (isGameOver(game) || pendingPromotion) return;

      const piece = game.state.board[row][col];
      const target = targets.get(`${row},${col}`);

      // Clicking a highlighted legal target completes a move.
      if (selected && target) {
        if (target.isPromotion) {
          setPendingPromotion({ move: target });
        } else {
          commitMove(target);
        }
        return;
      }

      // Clicking own piece selects / re-selects it.
      if (piece && piece.color === game.state.turn) {
        setSelected((cur) =>
          cur && cur.row === row && cur.col === col ? null : { row, col },
        );
        return;
      }

      // Anything else clears the selection.
      setSelected(null);
    },
    [game, selected, targets, pendingPromotion, commitMove],
  );

  const choosePromotion = useCallback(
    (type) => {
      if (!pendingPromotion) return;
      commitMove({ ...pendingPromotion.move, promotion: type });
    },
    [pendingPromotion, commitMove],
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    setSelected(null);
  }, []);

  const reset = useCallback(() => {
    setGame(createGame());
    setSelected(null);
    setPendingPromotion(null);
  }, []);

  return {
    game,
    selected,
    targets,
    pendingPromotion,
    onSquareClick,
    choosePromotion,
    cancelPromotion,
    reset,
  };
}
