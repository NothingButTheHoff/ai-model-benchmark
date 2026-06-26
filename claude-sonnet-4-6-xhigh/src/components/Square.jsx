import { Piece } from './Piece';

export function Square({ row, col, piece, isSelected, isValidMove, isInCheck, onClick }) {
  const isLight = (row + col) % 2 === 0;

  let className = `square ${isLight ? 'square-light' : 'square-dark'}`;
  if (isSelected) className += ' square-selected';
  if (isValidMove) className += ' square-valid-move';
  if (isInCheck) className += ' square-in-check';

  return (
    <div className={className} onClick={onClick} role="button" aria-label={`${String.fromCharCode(97 + col)}${8 - row}`}>
      {col === 0 && <span className="coord coord-rank">{8 - row}</span>}
      {row === 7 && <span className="coord coord-file">{String.fromCharCode(97 + col)}</span>}
      {isValidMove && !piece && <div className="move-dot" />}
      {piece && <Piece type={piece.type} color={piece.color} />}
      {isValidMove && piece && <div className="capture-ring" />}
    </div>
  );
}
