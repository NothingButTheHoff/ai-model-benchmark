import Piece from './Piece';

export default function Square({
  row, col, piece, isLight, isSelected, isLegalTarget, isCapture, isLastMove, isCheck, onClick,
}) {
  const classes = [
    'square',
    isLight ? 'light' : 'dark',
    isSelected && 'selected',
    isLastMove && 'last-move',
    isCheck && 'in-check',
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={() => onClick(row, col)}
      aria-label={`square-${row}-${col}`}
    >
      <Piece piece={piece} />
      {isLegalTarget && !isCapture && <span className="move-dot" />}
      {isLegalTarget && isCapture && <span className="capture-ring" />}
    </button>
  );
}
