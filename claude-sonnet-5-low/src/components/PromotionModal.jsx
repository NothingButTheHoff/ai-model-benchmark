import { GLYPHS } from './Piece';

const OPTIONS = ['q', 'r', 'b', 'n'];

export default function PromotionModal({ color, onSelect }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Promote pawn to:</h3>
        <div className="promotion-options">
          {OPTIONS.map((type) => (
            <button key={type} type="button" className="promotion-btn" onClick={() => onSelect(type)}>
              {GLYPHS[color][type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
