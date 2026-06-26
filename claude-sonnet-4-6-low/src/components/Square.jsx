import Piece from './Piece.jsx';

export default function Square({ row, col, piece, isLight, isSelected, isLegalMove, isLastMove, onClick }) {
  const classes = [
    'square',
    isLight ? 'square-light' : 'square-dark',
    isSelected ? 'square-selected' : '',
    isLegalMove ? 'square-legal' : '',
    isLastMove ? 'square-last-move' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} data-row={row} data-col={col}>
      {piece && <Piece type={piece.type} color={piece.color} />}
      {isLegalMove && !piece && <div className="legal-dot" />}
      {isLegalMove && piece && <div className="legal-capture" />}
    </div>
  );
}
