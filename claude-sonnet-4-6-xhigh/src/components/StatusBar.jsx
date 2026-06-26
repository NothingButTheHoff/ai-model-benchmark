export function StatusBar({ status, currentTurn, winner }) {
  let message = '';
  let className = 'status-bar';

  switch (status) {
    case 'playing':
      message = `${currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1)}'s turn`;
      className += ` status-${currentTurn}`;
      break;
    case 'check':
      message = `${currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1)} is in Check!`;
      className += ' status-check';
      break;
    case 'checkmate':
      message = `Checkmate! ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
      className += ' status-checkmate';
      break;
    case 'stalemate':
      message = 'Stalemate — Draw!';
      className += ' status-stalemate';
      break;
    default:
      message = '';
  }

  return (
    <div className={className} role="status" aria-live="polite">
      <span className={`turn-dot turn-dot-${currentTurn}`} />
      {message}
    </div>
  );
}
