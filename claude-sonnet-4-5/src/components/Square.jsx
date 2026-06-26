import './Square.css';

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

function Square({ row, col, piece, isLight, isSelected, isValidMove, onClick }) {
  const squareClass = [
    'square',
    isLight ? 'light' : 'dark',
    isSelected ? 'selected' : '',
    isValidMove ? 'valid-move' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={squareClass} onClick={onClick}>
      {piece && (
        <div className={`piece ${piece.color}`}>
          {PIECE_SYMBOLS[piece.color][piece.type]}
        </div>
      )}
      {isValidMove && !piece && <div className="move-indicator" />}
    </div>
  );
}

export default Square;
