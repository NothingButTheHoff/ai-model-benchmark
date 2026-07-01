import { PIECE_SYMBOLS, PIECE_NAMES } from './pieceSymbols.js';

const CHOICES = ['q', 'r', 'b', 'n'];

export default function PromotionModal({ color, onChoose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Promote pawn to:</h2>
        <div className="promotion-choices">
          {CHOICES.map((type) => (
            <button
              key={type}
              type="button"
              className="promotion-choice"
              onClick={() => onChoose(type)}
              aria-label={`Promote to ${PIECE_NAMES[type]}`}
            >
              <span className="piece">{PIECE_SYMBOLS[color][type]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
