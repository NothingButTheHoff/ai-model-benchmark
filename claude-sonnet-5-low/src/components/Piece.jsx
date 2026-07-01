const GLYPHS = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

export default function Piece({ piece }) {
  if (!piece) return null;
  return <span className="piece">{GLYPHS[piece.color][piece.type]}</span>;
}

export { GLYPHS };
