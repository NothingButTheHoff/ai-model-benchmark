import { glyphFor, nameFor } from '../pieces.js';
import { toAlgebraic } from '../engine/board.js';

// A single board square. Purely presentational; click handling is delegated.
export default function Square({
  row,
  col,
  piece,
  isLight,
  isSelected,
  isTarget,
  isCapture,
  isLastMove,
  isCheck,
  onClick,
}) {
  const classes = ['square', isLight ? 'light' : 'dark'];
  if (isSelected) classes.push('selected');
  if (isLastMove) classes.push('last-move');
  if (isCheck) classes.push('check');

  const square = toAlgebraic(row, col);

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={() => onClick(row, col)}
      aria-label={
        piece
          ? `${square}: ${piece.color === 'w' ? 'White' : 'Black'} ${nameFor(piece.type)}`
          : `${square}: empty`
      }
    >
      {/* Coordinate labels along the edges. */}
      {col === 0 && <span className="coord rank">{8 - row}</span>}
      {row === 7 && <span className="coord file">{'abcdefgh'[col]}</span>}

      {piece && (
        <span className={`piece ${piece.color === 'w' ? 'white' : 'black'}`}>
          {glyphFor(piece.color, piece.type)}
        </span>
      )}

      {/* Move hints. */}
      {isTarget && !isCapture && <span className="hint move" />}
      {isTarget && isCapture && <span className="hint capture" />}
    </button>
  );
}
