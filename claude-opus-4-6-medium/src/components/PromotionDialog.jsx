import { PIECES, PIECE_SYMBOLS } from '../engine/constants.js';

const PROMOTION_PIECES = [PIECES.QUEEN, PIECES.ROOK, PIECES.BISHOP, PIECES.KNIGHT];

export default function PromotionDialog({ color, onSelect }) {
  return (
    <div className="promotion-overlay">
      <div className="promotion-dialog">
        <h3>Promote pawn to:</h3>
        <div className="promotion-options">
          {PROMOTION_PIECES.map(type => (
            <button key={type} className="promotion-btn" onClick={() => onSelect(type)}>
              <span className={`piece ${color}`}>{PIECE_SYMBOLS[color][type]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
