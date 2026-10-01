import { squareName } from '../engine/index.js';
import { Piece, pieceLabel } from './Piece.jsx';

export function Square({ square, piece, isLight, isSelected, isLastMove, isInCheck, moveHint, fileLabel, rankLabel, onSelect }) {
  const classNames = [
    'square',
    isLight ? 'square--light' : 'square--dark',
    isSelected && 'square--selected',
    isLastMove && 'square--last-move',
    isInCheck && 'square--check',
    moveHint && `square--hint-${moveHint}`,
  ].filter(Boolean).join(' ');

  const label = `${squareName(square)}${piece ? `, ${pieceLabel(piece)}` : ''}`;

  return (
    <button type="button" className={classNames} onClick={() => onSelect(square)} aria-label={label}>
      {rankLabel && <span className="square__rank">{rankLabel}</span>}
      {fileLabel && <span className="square__file">{fileLabel}</span>}
      {piece && <Piece type={piece.type} color={piece.color} />}
    </button>
  );
}
