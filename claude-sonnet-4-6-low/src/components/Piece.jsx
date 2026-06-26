const SYMBOLS = {
  white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
  black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' },
};

export default function Piece({ type, color }) {
  return (
    <span className={`piece piece-${color}`} aria-label={`${color} ${type}`}>
      {SYMBOLS[color][type]}
    </span>
  );
}
