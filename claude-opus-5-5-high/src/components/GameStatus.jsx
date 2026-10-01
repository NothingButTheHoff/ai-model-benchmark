import { GAME_STATUS, isGameOver, opponentOf } from '../engine/index.js';
import { colorName } from './Piece.jsx';

function describeStatus(status, turn) {
  switch (status) {
    case GAME_STATUS.CHECKMATE:
      return `Checkmate! ${colorName(opponentOf(turn))} wins.`;
    case GAME_STATUS.STALEMATE:
      return 'Stalemate. The game is a draw.';
    case GAME_STATUS.CHECK:
      return `${colorName(turn)} is in check!`;
    default:
      return null;
  }
}

export function GameStatus({ status, turn }) {
  const message = describeStatus(status, turn);

  return (
    <div className="status" aria-live="polite">
      <div className="status__turn">
        {isGameOver(status) ? (
          'Game over'
        ) : (
          <>
            <span className={`status__swatch status__swatch--${colorName(turn).toLowerCase()}`} />
            {colorName(turn)}&apos;s turn
          </>
        )}
      </div>
      {message && <div className={`status__message status__message--${status}`}>{message}</div>}
    </div>
  );
}
