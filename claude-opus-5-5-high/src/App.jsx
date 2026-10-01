import { COLORS, PIECE_VALUES, findKing, isInCheck, opponentOf } from './engine/index.js';
import { useChessGame } from './hooks/useChessGame.js';
import { ChessBoard } from './components/ChessBoard.jsx';
import { CapturedPieces } from './components/CapturedPieces.jsx';
import { GameStatus } from './components/GameStatus.jsx';
import { PromotionDialog } from './components/PromotionDialog.jsx';
import './App.css';

const materialOf = (types) => types.reduce((sum, type) => sum + PIECE_VALUES[type], 0);

export default function App() {
  const { game, selectedSquare, legalMoves, pendingPromotion, selectSquare, choosePromotion, cancelPromotion, resetGame } =
    useChessGame();

  const checkedKingSquare = isInCheck(game.board, game.turn) ? findKing(game.board, game.turn) : null;
  const material = Object.fromEntries(COLORS.map((color) => [color, materialOf(game.capturedBy[color])]));

  return (
    <main className="app">
      <h1 className="app__title">Chess</h1>
      <div className="app__layout">
        <ChessBoard
          board={game.board}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          lastMove={game.lastMove}
          checkedKingSquare={checkedKingSquare}
          onSelectSquare={selectSquare}
        />
        <aside className="panel">
          <GameStatus status={game.status} turn={game.turn} />
          {COLORS.map((color) => (
            <CapturedPieces
              key={color}
              capturerColor={color}
              capturedTypes={game.capturedBy[color]}
              materialAdvantage={material[color] - material[opponentOf(color)]}
            />
          ))}
          <button type="button" className="button" onClick={resetGame}>Reset Game</button>
        </aside>
      </div>
      {pendingPromotion && (
        <PromotionDialog color={game.turn} onSelect={choosePromotion} onCancel={cancelPromotion} />
      )}
    </main>
  );
}
