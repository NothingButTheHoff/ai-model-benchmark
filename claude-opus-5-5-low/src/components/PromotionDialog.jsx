import { PROMOTION_PIECES } from '../engine/constants.js';
import { pieceSymbol } from './pieceSymbols.js';

export function PromotionDialog({ color, onSelect, onCancel }) {
  return (
    <div className="overlay" role="dialog" aria-label="Choose promotion piece">
      <div className="dialog">
        <h2>Promote pawn</h2>
        <div className="promotion-options">
          {PROMOTION_PIECES.map((type) => (
            <button key={type} type="button" onClick={() => onSelect(type)}>
              <span className={`piece piece-${color}`}>{pieceSymbol(type, color)}</span>
            </button>
          ))}
        </div>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
