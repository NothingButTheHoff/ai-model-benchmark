// Unicode glyphs for each piece, keyed by color + type.
// White pieces use the filled white-chess glyphs; CSS colors them.

const GLYPHS = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

export function glyphFor(color, type) {
  return GLYPHS[color]?.[type] ?? '';
}

const NAMES = { k: 'King', q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn' };
export function nameFor(type) {
  return NAMES[type] ?? '';
}
