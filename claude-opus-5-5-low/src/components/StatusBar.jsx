import { GAME_STATUS, WHITE, opponent } from '../engine/constants.js';

const colorName = (color) => (color === WHITE ? 'White' : 'Black');

function statusText(status, turn) {
  switch (status) {
    case GAME_STATUS.CHECKMATE:
      return `Checkmate! ${colorName(opponent(turn))} wins.`;
    case GAME_STATUS.STALEMATE:
      return 'Stalemate! The game is a draw.';
    case GAME_STATUS.CHECK:
      return `${colorName(turn)}'s turn — Check!`;
    default:
      return `${colorName(turn)}'s turn`;
  }
}

export function StatusBar({ status, turn }) {
  return (
    <div className={`status status-${status}`} aria-live="polite">
      <span className={`turn-dot turn-${turn}`} />
      {statusText(status, turn)}
    </div>
  );
}
