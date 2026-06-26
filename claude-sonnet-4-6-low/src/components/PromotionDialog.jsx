import Piece from './Piece.jsx';

const PROMOTION_PIECES = ['queen', 'rook', 'bishop', 'knight'];

export default function PromotionDialog({ color, onSelect }) {
  return (
    <div className="promotion-overlay">
      <div className="promotion-dialog">
        <h3>Choose promotion piece</h3>
        <div className="promotion-options">
          {PROMOTION_PIECES.map(type => (
            <button key={type} className="promotion-btn" onClick={() => onSelect(type)}>
              <Piece type={type} color={color} />
              <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
