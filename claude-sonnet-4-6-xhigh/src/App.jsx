import { useChessGame } from './hooks/useChessGame';
import { Board } from './components/Board';
import { StatusBar } from './components/StatusBar';
import { CapturedPieces } from './components/CapturedPieces';
import { PromotionModal } from './components/PromotionModal';
import './App.css';

export default function App() {
  const {
    gameState,
    selectedSquare,
    validMoves,
    promotionState,
    selectSquare,
    handlePromotion,
    resetGame,
  } = useChessGame();

  const { status, currentTurn, winner, capturedPieces } = gameState;
  const isGameOver = status === 'checkmate' || status === 'stalemate';

  const promotionColor = promotionState
    ? gameState.board[promotionState.from[0]][promotionState.from[1]]?.color
    : null;

  return (
    <div className="app">
      <h1 className="app-title">Chess</h1>

      <StatusBar status={status} currentTurn={currentTurn} winner={winner} />

      <CapturedPieces
        capturedByWhite={capturedPieces.white}
        capturedByBlack={capturedPieces.black}
      />

      <div className="board-wrapper">
        <Board
          gameState={gameState}
          selectedSquare={selectedSquare}
          validMoves={validMoves}
          onSquareClick={selectSquare}
        />
        {promotionState && promotionColor && (
          <PromotionModal color={promotionColor} onSelect={handlePromotion} />
        )}
      </div>

      <button className="reset-btn" onClick={resetGame}>
        {isGameOver ? 'New Game' : 'Reset Game'}
      </button>
    </div>
  );
}
