import { QUEEN, ROOK, BISHOP, KNIGHT, PIECE_UNICODE } from '../engine';

const CHOICES = [QUEEN, ROOK, BISHOP, KNIGHT];

export default function PromotionDialog({ color, onSelect }) {
  return (
    <div className="promotion-overlay">
      <div className="promotion-dialog">
        <h3>Promote to</h3>
        <div className="promotion-options">
          {CHOICES.map(type => (
            <button key={type} className="promotion-piece" onClick={() => onSelect(type)}>
              {PIECE_UNICODE[color][type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
