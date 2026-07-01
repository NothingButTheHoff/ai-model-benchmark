const STATUS_TEXT = {
  ongoing: null,
  check: 'Check!',
  checkmate: 'Checkmate!',
  stalemate: 'Stalemate — draw.',
};

export default function GameInfo({ turn, status, winner }) {
  const turnLabel = turn === 'w' ? 'White' : 'Black';
  const statusText = STATUS_TEXT[status];

  return (
    <div className="game-info">
      {status !== 'checkmate' && status !== 'stalemate' && (
        <div className="turn-indicator">{turnLabel} to move</div>
      )}
      {statusText && (
        <div className={`status-banner status-banner--${status}`}>
          {statusText}
          {status === 'checkmate' && ` ${winner === 'w' ? 'White' : 'Black'} wins.`}
        </div>
      )}
    </div>
  );
}
