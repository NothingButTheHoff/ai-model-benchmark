import { useEffect, useState } from 'react';
import Board from './components/Board';
import CapturedPanel from './components/CapturedPanel';
import PromotionModal from './components/PromotionModal';
import StatusBar from './components/StatusBar';
import { WHITE, BLACK } from './engine/constants';
import { createInitialState, getMoveTargets, applyMove, isGameOver } from './engine/gameEngine';
import { loadState, saveState, clearState } from './engine/storage';
import './App.css';

function App() {
  const [state, setState] = useState(() => loadState() || createInitialState());
  const [selected, setSelected] = useState(null);
  const [legalTargets, setLegalTargets] = useState([]);
  const [pendingPromotion, setPendingPromotion] = useState(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  function selectSquare(row, col) {
    const piece = state.board[row][col];
    if (!piece || piece.color !== state.turn) {
      setSelected(null);
      setLegalTargets([]);
      return;
    }
    setSelected({ row, col });
    setLegalTargets(getMoveTargets(state, row, col));
  }

  function handleSquareClick(row, col) {
    if (pendingPromotion || isGameOver(state)) return;

    if (!selected) {
      selectSquare(row, col);
      return;
    }

    if (selected.row === row && selected.col === col) {
      setSelected(null);
      setLegalTargets([]);
      return;
    }

    const piece = state.board[row][col];
    if (piece && piece.color === state.turn) {
      selectSquare(row, col);
      return;
    }

    const matches = legalTargets.filter((m) => m.row === row && m.col === col);
    if (matches.length === 0) {
      setSelected(null);
      setLegalTargets([]);
      return;
    }

    if (matches.length > 1) {
      // Multiple entries at the same square only happens for pawn promotion choices.
      setPendingPromotion({ from: selected, row, col, mover: state.board[selected.row][selected.col].color });
      return;
    }

    commitMove(selected, matches[0]);
  }

  function commitMove(from, move) {
    setState((prev) => applyMove(prev, from, move));
    setSelected(null);
    setLegalTargets([]);
  }

  function handlePromotionChoice(promotion) {
    const { from, row, col } = pendingPromotion;
    const move = legalTargets.find((m) => m.row === row && m.col === col && m.promotion === promotion);
    setPendingPromotion(null);
    commitMove(from, move);
  }

  function handleReset() {
    clearState();
    setState(createInitialState());
    setSelected(null);
    setLegalTargets([]);
    setPendingPromotion(null);
  }

  return (
    <div className="app">
      <h1 className="title">Chess</h1>
      <StatusBar state={state} onReset={handleReset} />
      <div className="game-area">
        <CapturedPanel label="Captured by White" pieces={state.capturedPieces[WHITE]} />
        <Board
          board={state.board}
          selected={selected}
          legalTargets={legalTargets}
          lastMove={state.lastMove}
          onSquareClick={handleSquareClick}
        />
        <CapturedPanel label="Captured by Black" pieces={state.capturedPieces[BLACK]} />
      </div>
      {pendingPromotion && (
        <PromotionModal color={pendingPromotion.mover} onChoose={handlePromotionChoice} />
      )}
    </div>
  );
}

export default App;
