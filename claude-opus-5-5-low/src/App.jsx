import { Board } from './components/Board.jsx';
import { CapturedPieces } from './components/CapturedPieces.jsx';
import { PromotionDialog } from './components/PromotionDialog.jsx';
import { StatusBar } from './components/StatusBar.jsx';
import { findKing } from './engine/board.js';
import { BLACK, GAME_STATUS, WHITE } from './engine/constants.js';
import { useChessGame } from './hooks/useChessGame.js';

export default function App() {
  const { game, selected, validMoves, pendingPromotion, error, selectSquare, choosePromotion, cancelPromotion, resetGame } =
    useChessGame();

  const kingInDanger = [GAME_STATUS.CHECK, GAME_STATUS.CHECKMATE].includes(game.status);
  const checkedKing = kingInDanger ? findKing(game.board, game.turn) : null;

  return (
    <main className="app">
      <h1>Browser Chess</h1>
      <StatusBar status={game.status} turn={game.turn} />
      <CapturedPieces label="Black captured:" capturedBy={BLACK} pieces={game.captured[BLACK]} />
      <Board
        board={game.board}
        selected={selected}
        validMoves={validMoves}
        lastMove={game.lastMove}
        checkedKing={checkedKing}
        onSquareClick={selectSquare}
      />
      <CapturedPieces label="White captured:" capturedBy={WHITE} pieces={game.captured[WHITE]} />
      {error && <p className="error">{error}</p>}
      <button type="button" className="reset" onClick={resetGame}>
        Reset Game
      </button>
      {pendingPromotion && <PromotionDialog color={game.turn} onSelect={choosePromotion} onCancel={cancelPromotion} />}
    </main>
  );
}
