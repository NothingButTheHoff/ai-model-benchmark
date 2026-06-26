import Piece from './Piece.jsx'

export default function Square({
  row,
  col,
  piece,
  isSelected,
  isValidMove,
  isCapture,
  isCheck,
  onClick,
}) {
  const isLight = (row + col) % 2 === 0

  let className = `square ${isLight ? 'square-light' : 'square-dark'}`
  if (isSelected) className += ' square-selected'
  if (isCheck) className += ' square-check'

  return (
    <div className={className} onClick={onClick} role="gridcell">
      {/* Rank label on left edge (col 0) */}
      {col === 0 && (
        <span className="label label-rank">{8 - row}</span>
      )}
      {/* File label on bottom edge (row 7) */}
      {row === 7 && (
        <span className="label label-file">{'abcdefgh'[col]}</span>
      )}

      {/* Valid move indicator */}
      {isValidMove && !isCapture && (
        <div className="valid-move-dot" />
      )}
      {isCapture && (
        <div className="valid-capture-ring" />
      )}

      <Piece piece={piece} />
    </div>
  )
}
