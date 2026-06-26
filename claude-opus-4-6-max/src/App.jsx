import useChessGame from './hooks/useChessGame';
import Board from './components/Board';
import GameInfo from './components/GameInfo';
import PromotionDialog from './components/PromotionDialog';
import './App.css';

export default function App() {
  const {
    gameState,
    selectedSquare,
    validMoves,
    pendingPromotion,
    handleSquareClick,
    handlePromotion,
    resetGame,
  } = useChessGame();

  const inCheck = gameState.status === 'check' || gameState.status === 'checkmate';

  return (
    <div className="app">
      <h1>Chess</h1>
      <GameInfo gameState={gameState} />
      <Board
        board={gameState.board}
        selectedSquare={selectedSquare}
        validMoves={validMoves}
        lastMove={gameState.lastMove}
        inCheck={inCheck}
        checkColor={gameState.turn}
        onSquareClick={handleSquareClick}
      />
      {pendingPromotion && (
        <PromotionDialog color={gameState.turn} onSelect={handlePromotion} />
      )}
      <button className="reset-btn" onClick={resetGame}>Reset Game</button>
    </div>
  );
}
