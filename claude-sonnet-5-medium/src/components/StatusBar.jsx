import { WHITE } from '../engine/constants';

function describeStatus(state) {
  const turnLabel = state.turn === WHITE ? 'White' : 'Black';

  switch (state.status) {
    case 'checkmate': {
      const winner = state.winner === WHITE ? 'White' : 'Black';
      return `Checkmate — ${winner} wins`;
    }
    case 'stalemate':
      return 'Stalemate — draw';
    case 'check':
      return `${turnLabel} to move — Check!`;
    default:
      return `${turnLabel} to move`;
  }
}

export default function StatusBar({ state, onReset }) {
  return (
    <div className="status-bar">
      <span className={`status-text ${state.status}`}>{describeStatus(state)}</span>
      <button type="button" className="reset-button" onClick={onReset}>Reset Game</button>
    </div>
  );
}
