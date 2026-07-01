import { GLYPHS } from './Piece';

function CapturedList({ pieces }) {
  return (
    <div className="captured-list">
      {pieces.map((p, i) => (
        <span key={i} className="captured-piece">{GLYPHS[p.color][p.type]}</span>
      ))}
    </div>
  );
}

export default function GameInfo({ state, onReset }) {
  const { turn, status, winner, captured, history } = state;

  let statusText = `${turn === 'w' ? 'White' : 'Black'} to move`;
  if (status === 'check') statusText = `${turn === 'w' ? 'White' : 'Black'} is in check`;
  if (status === 'checkmate') statusText = `Checkmate — ${winner === 'w' ? 'White' : 'Black'} wins`;
  if (status === 'stalemate') statusText = 'Stalemate — draw';

  return (
    <div className="game-info">
      <div className={`status ${status}`}>{statusText}</div>

      <div className="captured-row">
        <span className="captured-label">White captured:</span>
        <CapturedList pieces={captured.w} />
      </div>
      <div className="captured-row">
        <span className="captured-label">Black captured:</span>
        <CapturedList pieces={captured.b} />
      </div>

      <button type="button" className="reset-btn" onClick={onReset}>Reset Game</button>

      <div className="history">
        <h4>Moves</h4>
        <ol>
          {history.map((h, i) => (
            <li key={i}>{h.color === 'w' ? 'White' : 'Black'}: {h.san}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
