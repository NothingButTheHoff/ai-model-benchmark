import { PIECE_SYMBOLS } from './pieceSymbols.js';
import { squareToAlgebraic } from '../engine/board.js';

export default function Square({ square, piece, isLight, isSelected, isLegalTarget, isCapture, isLastMove, onClick }) {
  const classNames = [
    'square',
    isLight ? 'square--light' : 'square--dark',
    isSelected ? 'square--selected' : '',
    isLastMove ? 'square--last-move' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classNames}
      onClick={onClick}
      aria-label={`${squareToAlgebraic(square)}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
    >
      {piece && <span className="piece">{PIECE_SYMBOLS[piece.color][piece.type]}</span>}
      {isLegalTarget && <span className={isCapture ? 'move-hint move-hint--capture' : 'move-hint'} />}
    </button>
  );
}
