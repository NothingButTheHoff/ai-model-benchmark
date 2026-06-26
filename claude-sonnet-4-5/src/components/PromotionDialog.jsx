import { PIECES } from '../engine/ChessEngine';
import './PromotionDialog.css';

const PIECE_SYMBOLS = {
  white: {
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘'
  },
  black: {
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞'
  }
};

function PromotionDialog({ color, onSelect }) {
  const pieces = [PIECES.QUEEN, PIECES.ROOK, PIECES.BISHOP, PIECES.KNIGHT];

  return (
    <div className="promotion-overlay">
      <div className="promotion-dialog">
        <h3>Choose Promotion</h3>
        <div className="promotion-options">
          {pieces.map(piece => (
            <button
              key={piece}
              className="promotion-option"
              onClick={() => onSelect(piece)}
            >
              <span className={`piece ${color}`}>
                {PIECE_SYMBOLS[color][piece]}
              </span>
              <span className="piece-name">{piece}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PromotionDialog;
