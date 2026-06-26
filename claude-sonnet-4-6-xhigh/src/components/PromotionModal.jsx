import { PIECES, COLORS } from '../engine/chess';

const PROMO_PIECES = [PIECES.QUEEN, PIECES.ROOK, PIECES.BISHOP, PIECES.KNIGHT];

const SYMBOLS = {
  white: { Q: '♕', R: '♖', B: '♗', N: '♘' },
  black: { Q: '♛', R: '♜', B: '♝', N: '♞' },
};

const NAMES = { Q: 'Queen', R: 'Rook', B: 'Bishop', N: 'Knight' };

export function PromotionModal({ color, onSelect }) {
  return (
    <div className="promotion-overlay" role="dialog" aria-modal="true" aria-label="Choose promotion piece">
      <div className="promotion-modal">
        <h2>Promote Pawn</h2>
        <div className="promotion-choices">
          {PROMO_PIECES.map(type => (
            <button
              key={type}
              className={`promotion-btn piece-${color}`}
              onClick={() => onSelect(type)}
              aria-label={NAMES[type]}
              title={NAMES[type]}
            >
              {SYMBOLS[color][type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
