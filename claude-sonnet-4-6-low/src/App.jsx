import { useState, useCallback } from 'react';
import Board from './components/Board.jsx';
import StatusBar from './components/StatusBar.jsx';
import CapturedPieces from './components/CapturedPieces.jsx';
import PromotionDialog from './components/PromotionDialog.jsx';
import { INITIAL_STATE } from './engine/constants.js';
import { getLegalMoves, applyMove } from './engine/gameEngine.js';
import { saveState, loadState, clearState } from './engine/storage.js';
import './App.css';

const initState = () => loadState() || INITIAL_STATE();

export default function App() {
  const [gameState, setGameState] = useState(initState);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);

  const updateState = useCallback((newState) => {
    setGameState(newState);
    saveState(newState);
  }, []);

  const handleSquareClick = useCallback((row, col) => {
    const { board, turn, status } = gameState;

    if (status === 'checkmate' || status === 'stalemate') return;

    const piece = board[row][col];

    if (selectedSquare) {
      const move = legalMoves.find(m => m.row === row && m.col === col);

      if (move) {
        const from = selectedSquare;
        const to = move;

        const movingPiece = board[from.row][from.col];
        const promotionRow = turn === 'white' ? 0 : 7;
        if (movingPiece?.type === 'pawn' && to.row === promotionRow) {
          setPendingPromotion({ from, to });
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }

        const newState = applyMove(gameState, from, to);
        updateState(newState);
        setLastMove({ from, to });
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      if (piece && piece.color === turn) {
        setSelectedSquare({ row, col });
        setLegalMoves(getLegalMoves(gameState, row, col));
        return;
      }

      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    if (piece && piece.color === turn) {
      setSelectedSquare({ row, col });
      setLegalMoves(getLegalMoves(gameState, row, col));
    }
  }, [gameState, selectedSquare, legalMoves, updateState]);

  const handlePromotion = useCallback((pieceType) => {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;
    const newState = applyMove(gameState, from, to, pieceType);
    updateState(newState);
    setLastMove({ from, to });
    setPendingPromotion(null);
  }, [gameState, pendingPromotion, updateState]);

  const handleReset = useCallback(() => {
    clearState();
    setGameState(INITIAL_STATE());
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setPendingPromotion(null);
  }, []);

  const { board, turn, status, capturedPieces } = gameState;

  return (
    <div className="app">
      <h1 className="app-title">Chess</h1>
      <StatusBar turn={turn} status={status} onReset={handleReset} />
      <div className="game-area">
        <CapturedPieces pieces={capturedPieces.black} color="black" label="Black captured" />
        <Board
          board={board}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          lastMove={lastMove}
          onSquareClick={handleSquareClick}
        />
        <CapturedPieces pieces={capturedPieces.white} color="white" label="White captured" />
      </div>
      {pendingPromotion && (
        <PromotionDialog
          color={turn}
          onSelect={handlePromotion}
        />
      )}
    </div>
  );
}
