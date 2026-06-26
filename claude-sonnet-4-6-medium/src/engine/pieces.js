export const PIECES = {
  PAWN: 'P',
  KNIGHT: 'N',
  BISHOP: 'B',
  ROOK: 'R',
  QUEEN: 'Q',
  KING: 'K',
}

export const COLORS = {
  WHITE: 'w',
  BLACK: 'b',
}

// Unicode chess symbols
export const UNICODE_PIECES = {
  w: {
    K: '♔',
    Q: '♕',
    R: '♖',
    B: '♗',
    N: '♘',
    P: '♙',
  },
  b: {
    K: '♚',
    Q: '♛',
    R: '♜',
    B: '♝',
    N: '♞',
    P: '♟',
  },
}

export function getSymbol(piece) {
  if (!piece) return ''
  return UNICODE_PIECES[piece.color][piece.type] || ''
}
