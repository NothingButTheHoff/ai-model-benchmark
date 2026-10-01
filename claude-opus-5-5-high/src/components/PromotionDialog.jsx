import { useEffect } from 'react';
import { PROMOTION_TYPES } from '../engine/index.js';
import { Piece, pieceLabel } from './Piece.jsx';

export function PromotionDialog({ color, onSelect, onCancel }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="promotion-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="promotion-title">Promote pawn to</h2>
        <div className="dialog__options">
          {PROMOTION_TYPES.map((type) => (
            <button key={type} type="button" className="dialog__option" onClick={() => onSelect(type)} aria-label={pieceLabel({ type, color })} autoFocus={type === PROMOTION_TYPES[0]}>
              <Piece type={type} color={color} />
            </button>
          ))}
        </div>
        <button type="button" className="button button--secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
