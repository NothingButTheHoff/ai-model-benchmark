// Unicode glyphs for each piece, keyed by color + type.
export const GLYPHS = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
}

export const PIECE_NAMES = {
  k: 'King', q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn',
}

export function glyph(piece) {
  if (!piece) return ''
  return GLYPHS[piece.color + piece.type]
}
