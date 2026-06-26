import React from 'react'
import { GLYPHS } from '../pieces.js'

// Modal shown when a pawn reaches the last rank.
export default function PromotionDialog({ color, onSelect, onCancel }) {
  const options = ['q', 'r', 'b', 'n']
  return (
    <div className="promotion-overlay" onClick={onCancel}>
      <div className="promotion-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Promote pawn</h3>
        <div className="promotion-options">
          {options.map((t) => (
            <button key={t} className="promotion-choice" onClick={() => onSelect(t)}>
              <span className={color === 'w' ? 'white-piece' : 'black-piece'}>
                {GLYPHS[color + t]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
