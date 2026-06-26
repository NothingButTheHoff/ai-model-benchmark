import { STATUS } from '../engine/game.js';

// Turn indicator + end-of-game / check banner.
export default function GameStatus({ game }) {
  const { turn } = game.state;
  const turnName = turn === 'w' ? 'White' : 'Black';
  const winnerName = game.winner === 'w' ? 'White' : 'Black';

  let message;
  let tone = 'info';

  switch (game.status) {
    case STATUS.CHECKMATE:
      message = `Checkmate — ${winnerName} wins`;
      tone = 'win';
      break;
    case STATUS.STALEMATE:
      message = 'Stalemate — draw';
      tone = 'draw';
      break;
    case STATUS.DRAW:
      message = 'Draw — 50-move rule';
      tone = 'draw';
      break;
    case STATUS.CHECK:
      message = `${turnName} to move — Check!`;
      tone = 'check';
      break;
    default:
      message = `${turnName} to move`;
  }

  return (
    <div className={`status status-${tone}`} role="status" aria-live="polite">
      <span className={`turn-dot ${turn === 'w' ? 'white' : 'black'}`} aria-hidden="true" />
      {message}
    </div>
  );
}
