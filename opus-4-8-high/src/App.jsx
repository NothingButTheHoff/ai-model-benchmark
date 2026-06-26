import { useChessGame } from './hooks/useChessGame.js';
import Board from './components/Board.jsx';
import GameStatus from './components/GameStatus.jsx';
import CapturedPieces, { materialScore } from './components/CapturedPieces.jsx';
import MoveHistory from './components/MoveHistory.jsx';
import PromotionDialog from './components/PromotionDialog.jsx';

export default function App() {
  const {
    game,
    selected,
    targets,
    pendingPromotion,
    onSquareClick,
    choosePromotion,
    cancelPromotion,
    reset,
  } = useChessGame();

  const whiteScore = materialScore(game.captured.w);
  const blackScore = materialScore(game.captured.b);
  const diff = whiteScore - blackScore;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Chess</h1>
        <button type="button" className="reset-btn" onClick={reset}>
          Reset Game
        </button>
      </header>

      <main className="layout">
        <section className="board-area">
          {/* Black's captures sit above the board (material Black has taken). */}
          <CapturedPieces
            capturer="b"
            captured={game.captured.b}
            advantage={-diff}
          />
          <Board
            game={game}
            selected={selected}
            targets={targets}
            onSquareClick={onSquareClick}
          />
          <CapturedPieces
            capturer="w"
            captured={game.captured.w}
            advantage={diff}
          />
        </section>

        <aside className="sidebar">
          <GameStatus game={game} />
          <MoveHistory history={game.history} />
        </aside>
      </main>

      {pendingPromotion && (
        <PromotionDialog
          color={game.state.turn}
          onChoose={choosePromotion}
          onCancel={cancelPromotion}
        />
      )}
    </div>
  );
}
