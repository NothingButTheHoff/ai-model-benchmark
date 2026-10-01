import { PIECE_VALUES, opponentOf } from '../engine/index.js';
import { colorName, Piece } from './Piece.jsx';

const byValueDescending = (a, b) => PIECE_VALUES[b] - PIECE_VALUES[a];

export function CapturedPieces({ capturerColor, capturedTypes, materialAdvantage }) {
  const capturedColor = opponentOf(capturerColor);

  return (
    <div className="captured">
      <span className="captured__label">Captured by {colorName(capturerColor)}</span>
      <div className="captured__pieces">
        {capturedTypes.length === 0 && <span className="captured__empty">None</span>}
        {[...capturedTypes].sort(byValueDescending).map((type, index) => (
          <Piece key={`${type}-${index}`} type={type} color={capturedColor} className="piece--small" />
        ))}
        {materialAdvantage > 0 && <span className="captured__advantage">+{materialAdvantage}</span>}
      </div>
    </div>
  );
}
