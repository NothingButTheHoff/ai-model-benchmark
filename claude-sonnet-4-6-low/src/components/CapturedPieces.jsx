import Piece from './Piece.jsx';

export default function CapturedPieces({ pieces, color, label }) {
  return (
    <div className="captured-pieces">
      <span className="captured-label">{label}:</span>
      <div className="captured-list">
        {pieces.map((p, i) => (
          <span key={i} className="captured-piece">
            <Piece type={p.type} color={p.color} />
          </span>
        ))}
      </div>
    </div>
  );
}
