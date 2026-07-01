import { QUEEN, ROOK, BISHOP, KNIGHT } from '../engine/constants';
import { pieceSymbol, PIECE_NAMES } from './pieceSymbols';

const CHOICES = [QUEEN, ROOK, BISHOP, KNIGHT];

export default function PromotionModal({ color, onChoose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Promote pawn to:</h2>
        <div className="promotion-choices">
          {CHOICES.map((type) => (
            <button
              type="button"
              key={type}
              className="promotion-choice"
              onClick={() => onChoose(type)}
            >
              <span className="piece">{pieceSymbol({ type, color })}</span>
              <span>{PIECE_NAMES[type]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
