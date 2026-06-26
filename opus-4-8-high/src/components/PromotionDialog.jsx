import { glyphFor } from '../pieces.js';

const CHOICES = ['q', 'r', 'b', 'n'];

// Modal letting the player pick the promotion piece.
export default function PromotionDialog({ color, onChoose, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="modal promotion"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Choose promotion piece"
      >
        <h2>Promote to</h2>
        <div className="promotion-choices">
          {CHOICES.map((type) => (
            <button
              key={type}
              type="button"
              className="promotion-choice"
              onClick={() => onChoose(type)}
              aria-label={type}
            >
              <span className={`piece ${color === 'w' ? 'white' : 'black'}`}>
                {glyphFor(color, type)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
