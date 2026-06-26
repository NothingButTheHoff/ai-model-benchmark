import { glyphFor } from '../pieces.js';

// Compact move list, paired White/Black per full move.
export default function MoveHistory({ history }) {
  const rows = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ num: i / 2 + 1, white: history[i], black: history[i + 1] });
  }

  return (
    <div className="move-history" aria-label="Move history">
      <h2>Moves</h2>
      {rows.length === 0 ? (
        <p className="empty">No moves yet.</p>
      ) : (
        <ol>
          {rows.map((r) => (
            <li key={r.num}>
              <span className="move-num">{r.num}.</span>
              <span className="move">{formatMove(r.white)}</span>
              <span className="move">{r.black ? formatMove(r.black) : ''}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// Render a single history entry as glyph + algebraic destination.
function formatMove(m) {
  if (!m) return '';
  if (m.castle === 'K') return 'O-O';
  if (m.castle === 'Q') return 'O-O-O';
  const glyph = glyphFor(m.color, m.piece);
  const sep = m.capture ? '×' : '';
  const promo = m.promotion ? `=${glyphFor(m.color, m.promotion)}` : '';
  return `${glyph}${sep}${m.to}${promo}`;
}
