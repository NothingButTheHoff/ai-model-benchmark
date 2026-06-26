// Unicode chess piece symbols
const SYMBOLS = {
  white: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
  black: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' },
};

export function Piece({ type, color }) {
  return (
    <span className={`piece piece-${color}`} aria-label={`${color} ${type}`}>
      {SYMBOLS[color][type]}
    </span>
  );
}
