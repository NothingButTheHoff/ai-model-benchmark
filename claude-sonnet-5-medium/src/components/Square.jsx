import { pieceSymbol } from './pieceSymbols';

export default function Square({ piece, isLight, isSelected, isLegalTarget, isCapture, isLastMove, onClick }) {
  const classes = [
    'square',
    isLight ? 'light' : 'dark',
    isSelected ? 'selected' : '',
    isLastMove ? 'last-move' : '',
  ].filter(Boolean).join(' ');

  return (
    <button type="button" className={classes} onClick={onClick}>
      {piece && <span className="piece">{pieceSymbol(piece)}</span>}
      {isLegalTarget && !isCapture && <span className="move-dot" />}
      {isLegalTarget && isCapture && <span className="capture-ring" />}
    </button>
  );
}
