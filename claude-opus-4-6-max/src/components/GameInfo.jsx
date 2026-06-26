import { WHITE, BLACK, PIECE_UNICODE, PIECE_VALUE, opponent } from '../engine';

export default function GameInfo({ gameState }) {
  const { turn, status, capturedPieces } = gameState;

  const whiteCaptured = capturedPieces.filter(p => p.color === WHITE).sort((a, b) => PIECE_VALUE[b.type] - PIECE_VALUE[a.type]);
  const blackCaptured = capturedPieces.filter(p => p.color === BLACK).sort((a, b) => PIECE_VALUE[b.type] - PIECE_VALUE[a.type]);

  let statusText;
  switch (status) {
    case 'check':
      statusText = `${turn === WHITE ? 'White' : 'Black'} is in check!`;
      break;
    case 'checkmate':
      statusText = `Checkmate! ${opponent(turn) === WHITE ? 'White' : 'Black'} wins!`;
      break;
    case 'stalemate':
      statusText = 'Stalemate — Draw';
      break;
    default:
      statusText = `${turn === WHITE ? 'White' : 'Black'}'s turn`;
  }

  return (
    <div className="game-info">
      <div className={`status ${status}`}>{statusText}</div>
      <div className="captured-row">
        <CapturedGroup label="Black captured" pieces={whiteCaptured} />
        <CapturedGroup label="White captured" pieces={blackCaptured} />
      </div>
    </div>
  );
}

function CapturedGroup({ label, pieces }) {
  if (pieces.length === 0) return null;
  return (
    <div className="captured-group">
      <span className="captured-label">{label}:</span>
      <span className="captured-pieces">
        {pieces.map((p, i) => <span key={i}>{PIECE_UNICODE[p.color][p.type]}</span>)}
      </span>
    </div>
  );
}
