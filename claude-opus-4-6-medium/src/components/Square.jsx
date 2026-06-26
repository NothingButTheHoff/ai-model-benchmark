import { PIECE_SYMBOLS } from '../engine/constants.js';

export default function Square({ piece, row, col, isSelected, isLegalMove, isCheck, onClick }) {
  const isDark = (row + col) % 2 === 1;
  let className = `square ${isDark ? 'dark' : 'light'}`;
  if (isSelected) className += ' selected';
  if (isLegalMove) className += ' legal-move';
  if (isCheck) className += ' in-check';

  return (
    <div className={className} onClick={onClick}>
      {piece && (
        <span className={`piece ${piece.color}`}>
          {PIECE_SYMBOLS[piece.color][piece.type]}
        </span>
      )}
      {isLegalMove && !piece && <div className="move-dot" />}
      {isLegalMove && piece && <div className="capture-ring" />}
    </div>
  );
}
