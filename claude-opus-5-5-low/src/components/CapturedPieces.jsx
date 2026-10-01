import { opponent } from '../engine/constants.js';
import { pieceSymbol } from './pieceSymbols.js';

export function CapturedPieces({ label, capturedBy, pieces }) {
  const pieceColor = opponent(capturedBy);
  return (
    <div className="captured">
      <span className="captured-label">{label}</span>
      <span className="captured-list">
        {pieces.length === 0
          ? '—'
          : pieces.map((type, i) => (
              <span key={i} className={`piece piece-${pieceColor}`}>
                {pieceSymbol(type, pieceColor)}
              </span>
            ))}
      </span>
    </div>
  );
}
