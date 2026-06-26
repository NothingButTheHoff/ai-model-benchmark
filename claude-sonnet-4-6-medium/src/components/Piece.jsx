import { getSymbol } from '../engine/pieces.js'

export default function Piece({ piece }) {
  if (!piece) return null
  const symbol = getSymbol(piece)
  return (
    <span className={`chess-piece piece-${piece.color}`} aria-label={`${piece.color === 'w' ? 'white' : 'black'} ${piece.type}`}>
      {symbol}
    </span>
  )
}
