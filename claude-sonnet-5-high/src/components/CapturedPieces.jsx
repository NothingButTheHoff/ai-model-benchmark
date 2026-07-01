import { PIECE_SYMBOLS } from './pieceSymbols.js';

const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9 };

function total(pieces) {
  return pieces.reduce((sum, type) => sum + (VALUE[type] ?? 0), 0);
}

function CapturedRow({ label, color, pieces }) {
  const advantage = total(pieces);
  return (
    <div className="captured-row">
      <span className="captured-row__label">{label}</span>
      <span className="captured-row__pieces">
        {pieces.map((type, i) => (
          <span key={i}>{PIECE_SYMBOLS[color][type]}</span>
        ))}
      </span>
      {advantage > 0 && <span className="captured-row__advantage">+{advantage}</span>}
    </div>
  );
}

export default function CapturedPieces({ capturedPieces }) {
  return (
    <div className="captured-pieces">
      <CapturedRow label="Captured by White" color="b" pieces={capturedPieces.b} />
      <CapturedRow label="Captured by Black" color="w" pieces={capturedPieces.w} />
    </div>
  );
}
