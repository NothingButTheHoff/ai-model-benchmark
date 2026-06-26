// Display pieces captured by a given color
const SYMBOLS = {
  white: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
  black: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' },
};

const PIECE_VALUE = { Q: 9, R: 5, B: 3, N: 3, P: 1, K: 0 };

function sortByValue(pieces) {
  return [...pieces].sort((a, b) => PIECE_VALUE[b.type] - PIECE_VALUE[a.type]);
}

export function CapturedPieces({ capturedByWhite, capturedByBlack }) {
  const whiteCaptures = sortByValue(capturedByWhite);
  const blackCaptures = sortByValue(capturedByBlack);

  const whiteScore = whiteCaptures.reduce((s, p) => s + PIECE_VALUE[p.type], 0);
  const blackScore = blackCaptures.reduce((s, p) => s + PIECE_VALUE[p.type], 0);
  const diff = whiteScore - blackScore;

  return (
    <div className="captured-container">
      <div className="captured-row">
        <span className="captured-label">White captured:</span>
        <span className="captured-pieces">
          {whiteCaptures.map((p, i) => (
            <span key={i} className={`captured-piece piece-${p.color}`}>
              {SYMBOLS[p.color][p.type]}
            </span>
          ))}
          {diff > 0 && <span className="score-diff">+{diff}</span>}
        </span>
      </div>
      <div className="captured-row">
        <span className="captured-label">Black captured:</span>
        <span className="captured-pieces">
          {blackCaptures.map((p, i) => (
            <span key={i} className={`captured-piece piece-${p.color}`}>
              {SYMBOLS[p.color][p.type]}
            </span>
          ))}
          {diff < 0 && <span className="score-diff">+{Math.abs(diff)}</span>}
        </span>
      </div>
    </div>
  );
}
