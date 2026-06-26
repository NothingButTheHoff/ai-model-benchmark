import { glyphFor } from '../pieces.js';

// Material values used to compute a simple advantage score.
const VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

// Shows the pieces a given side has captured, plus a material advantage badge.
// `capturer` is the color that did the capturing; captured pieces are the
// opposite color.
export default function CapturedPieces({ capturer, captured, advantage }) {
  const capturedColor = capturer === 'w' ? 'b' : 'w';
  const ordered = [...captured].sort((a, b) => VALUES[b] - VALUES[a]);

  return (
    <div className="captured" aria-label={`Pieces captured by ${capturer === 'w' ? 'White' : 'Black'}`}>
      <span className="captured-pieces">
        {ordered.map((type, i) => (
          <span key={i} className={`piece ${capturedColor === 'w' ? 'white' : 'black'}`}>
            {glyphFor(capturedColor, type)}
          </span>
        ))}
      </span>
      {advantage > 0 && <span className="advantage">+{advantage}</span>}
    </div>
  );
}

export function materialScore(captured) {
  return captured.reduce((sum, t) => sum + VALUES[t], 0);
}
