import { useGame } from './hooks/useGame.js';
import Board from './components/Board.jsx';
import GameInfo from './components/GameInfo.jsx';
import CapturedPieces from './components/CapturedPieces.jsx';
import PromotionModal from './components/PromotionModal.jsx';
import './App.css';

function App() {
  const { game, selectedSquare, legalMoves, pendingPromotion, selectSquare, choosePromotion, resetGame } =
    useGame();

  const handleReset = () => {
    if (window.confirm('Reset the board and start a new game?')) {
      resetGame();
    }
  };

  return (
    <div className="app">
      <h1>Browser Chess</h1>

      <GameInfo turn={game.turn} status={game.status} winner={game.winner} />

      <div className="game-layout">
        <Board
          board={game.board}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          lastMove={game.lastMove}
          onSquareClick={selectSquare}
        />

        <div className="side-panel">
          <CapturedPieces capturedPieces={game.capturedPieces} />
          <button type="button" className="reset-button" onClick={handleReset}>
            Reset Game
          </button>
        </div>
      </div>

      {pendingPromotion && (
        <PromotionModal color={pendingPromotion.piece.color} onChoose={choosePromotion} />
      )}
    </div>
  );
}

export default App;
