import { pieceSymbol } from './pieceSymbols';

export default function CapturedPanel({ label, pieces }) {
  return (
    <div className="captured-panel">
      <span className="captured-label">{label}</span>
      <div className="captured-pieces">
        {pieces.map((piece, i) => (
          <span className="captured-piece" key={i}>{pieceSymbol(piece)}</span>
        ))}
      </div>
    </div>
  );
}
