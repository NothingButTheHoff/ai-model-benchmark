import './CapturedPieces.css';

const PIECE_SYMBOLS = {
  white: {
    pawn: '♙',
    rook: '♖',
    knight: '♘',
    bishop: '♗',
    queen: '♕',
    king: '♔'
  },
  black: {
    pawn: '♟',
    rook: '♜',
    knight: '♞',
    bishop: '♝',
    queen: '♛',
    king: '♚'
  }
};

function CapturedPieces({ pieces, color, label }) {
  return (
    <div className="captured-pieces">
      <h3>{label}</h3>
      <div className="pieces-list">
        {pieces.map((piece, index) => (
          <span key={index} className={`captured-piece ${piece.color}`}>
            {PIECE_SYMBOLS[piece.color][piece.type]}
          </span>
        ))}
      </div>
    </div>
  );
}

export default CapturedPieces;
