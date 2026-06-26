import React from 'react'
import Square from './Square.jsx'
import { squareName } from '../engine/chess.js'

// Renders the 8x8 grid plus rank/file coordinate labels.
export default function Board({
  board,
  selected,
  legalTargets,
  checkSquare,
  lastMove,
  onSquareClick,
}) {
  const targetMap = new Map()
  for (const m of legalTargets) targetMap.set(m.to.r * 8 + m.to.c, m)

  return (
    <div className="board">
      {board.map((row, r) =>
        row.map((piece, c) => {
          const key = r * 8 + c
          const legalMove = targetMap.get(key)
          const isCheck =
            checkSquare && checkSquare.r === r && checkSquare.c === c
          const isLastMove =
            lastMove &&
            ((lastMove.from.r === r && lastMove.from.c === c) ||
              (lastMove.to.r === r && lastMove.to.c === c))
          return (
            <Square
              key={key}
              piece={piece}
              isLight={(r + c) % 2 === 0}
              isSelected={selected && selected.r === r && selected.c === c}
              isLegal={!!legalMove}
              isCapture={!!legalMove && (!!piece || !!legalMove.flags?.enPassant)}
              isCheck={isCheck}
              isLastMove={isLastMove}
              label={squareName(r, c)}
              onClick={() => onSquareClick(r, c)}
            />
          )
        })
      )}
    </div>
  )
}
