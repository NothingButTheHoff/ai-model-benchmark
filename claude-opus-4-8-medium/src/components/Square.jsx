import React from 'react'
import { glyph } from '../pieces.js'

// A single board square. Pure presentational component.
export default function Square({
  piece,
  isLight,
  isSelected,
  isLegal,
  isCapture,
  isCheck,
  isLastMove,
  label,
  onClick,
}) {
  const classes = ['square', isLight ? 'light' : 'dark']
  if (isSelected) classes.push('selected')
  if (isLastMove) classes.push('last-move')
  if (isCheck) classes.push('check')

  return (
    <div className={classes.join(' ')} onClick={onClick} role="button" aria-label={label}>
      {piece && (
        <span className={`piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}`}>
          {glyph(piece)}
        </span>
      )}
      {isLegal && !isCapture && <span className="hint-dot" />}
      {isLegal && isCapture && <span className="hint-ring" />}
    </div>
  )
}
