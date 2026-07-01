import { useEffect, useState } from 'react';
import Board from './components/Board';
import GameInfo from './components/GameInfo';
import PromotionModal from './components/PromotionModal';
import { createInitialState, getLegalMoves, makeMove } from './engine/engine';
import { loadState, saveState, clearState } from './engine/storage';
import './App.css';

function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell && cell.type === 'k' && cell.color === color) return { row: r, col: c };
    }
  }
  return null;
}

function App() {
  const [state, setState] = useState(() => loadState() || createInitialState());
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [pendingPromotion, setPendingPromotion] = useState(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const lastMove = state.history.length > 0 ? state.history[state.history.length - 1].move : null;

  const kingInCheckSquare = (state.status === 'check' || state.status === 'checkmate')
    ? findKing(state.board, state.turn)
    : null;

  const gameOver = state.status === 'checkmate' || state.status === 'stalemate';

  function handleSquareClick(row, col) {
    if (gameOver || pendingPromotion) return;
    const piece = state.board[row][col];

    if (selected) {
      const move = legalMoves.find((m) => m.to.row === row && m.to.col === col);
      if (move) {
        if (move.promotion) {
          const options = legalMoves.filter((m) => m.to.row === row && m.to.col === col);
          setPendingPromotion({ options });
          setSelected(null);
          setLegalMoves([]);
          return;
        }
        setState((s) => makeMove(s, move));
        setSelected(null);
        setLegalMoves([]);
        return;
      }
      if (piece && piece.color === state.turn) {
        setSelected({ row, col });
        setLegalMoves(getLegalMoves(state, row, col));
        return;
      }
      setSelected(null);
      setLegalMoves([]);
      return;
    }

    if (piece && piece.color === state.turn) {
      setSelected({ row, col });
      setLegalMoves(getLegalMoves(state, row, col));
    }
  }

  function handlePromotionSelect(promotionType) {
    const move = pendingPromotion.options.find((m) => m.promotion === promotionType);
    setState((s) => makeMove(s, move));
    setPendingPromotion(null);
  }

  function handleReset() {
    clearState();
    setState(createInitialState());
    setSelected(null);
    setLegalMoves([]);
    setPendingPromotion(null);
  }

  return (
    <div className="app">
      <h1>Chess</h1>
      <div className="game-layout">
        <Board
          board={state.board}
          selected={selected}
          legalMoves={legalMoves}
          lastMove={lastMove}
          kingInCheckSquare={kingInCheckSquare}
          onSquareClick={handleSquareClick}
        />
        <GameInfo state={state} onReset={handleReset} />
      </div>
      {pendingPromotion && (
        <PromotionModal color={state.turn} onSelect={handlePromotionSelect} />
      )}
    </div>
  );
}

export default App;
