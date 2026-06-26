import { useEffect, useMemo, useState } from 'react';
import {
  BLACK,
  PIECE_LABELS,
  WHITE,
  createInitialState,
  getLegalMoves,
  movePiece,
  reviveState,
  squareName
} from './chessEngine.js';

const STORAGE_KEY = 'gpt-5-codex-browser-chess';
const PROMOTIONS = ['queen', 'rook', 'bishop', 'knight'];

const PIECE_SYMBOLS = {
  white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
  black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
};

function App() {
  const [game, setGame] = useState(() => {
    try {
      return reviveState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch {
      return createInitialState();
    }
  });
  const [selected, setSelected] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  const legalMoves = useMemo(() => (selected ? getLegalMoves(game, selected) : []), [game, selected]);

  function handleSquareClick(row, col) {
    if (pendingPromotion || game.status.type === 'checkmate' || game.status.type === 'stalemate') return;
    const clicked = game.board[row][col];
    const move = legalMoves.find((entry) => entry.to.row === row && entry.to.col === col);

    if (selected && move) {
      if (move.promotion) {
        setPendingPromotion({ from: selected, to: { row, col } });
        return;
      }
      commitMove(selected, { row, col });
      return;
    }

    if (clicked?.color === game.turn) {
      setSelected({ row, col });
      setMessage('');
      return;
    }

    setSelected(null);
    setMessage(clicked ? 'Choose one of your own pieces.' : '');
  }

  function commitMove(from, to, promotion) {
    const result = movePiece(game, from, to, promotion);
    if (result.ok) {
      setGame(result.state);
      setSelected(null);
      setPendingPromotion(null);
      setMessage('');
    } else {
      setMessage(result.error);
    }
  }

  function resetGame() {
    const fresh = createInitialState();
    setGame(fresh);
    setSelected(null);
    setPendingPromotion(null);
    setMessage('');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }

  return (
    <main className="app">
      <section className="game-area" aria-label="Chess game">
        <div className="topbar">
          <div>
            <h1>Browser Chess</h1>
            <p className={`status ${game.status.type}`}>{game.status.message}</p>
          </div>
          <button className="reset-button" onClick={resetGame}>Reset Game</button>
        </div>

        <div className="board-wrap">
          <div className="files top" aria-hidden="true">{['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((f) => <span key={f}>{f}</span>)}</div>
          <div className="ranked-board">
            <div className="ranks" aria-hidden="true">{[8, 7, 6, 5, 4, 3, 2, 1].map((r) => <span key={r}>{r}</span>)}</div>
            <div className="board" role="grid" aria-label="Chess board">
              {game.board.map((rank, row) => rank.map((piece, col) => {
                const dark = (row + col) % 2 === 1;
                const isSelected = selected?.row === row && selected?.col === col;
                const legal = legalMoves.find((entry) => entry.to.row === row && entry.to.col === col);
                const label = `${squareName({ row, col })}${piece ? ` ${piece.color} ${piece.type}` : ''}`;
                return (
                  <button
                    key={`${row}-${col}`}
                    className={[
                      'square',
                      dark ? 'dark' : 'light',
                      isSelected ? 'selected' : '',
                      legal ? 'legal' : '',
                      legal && piece ? 'capture' : ''
                    ].filter(Boolean).join(' ')}
                    onClick={() => handleSquareClick(row, col)}
                    role="gridcell"
                    aria-label={label}
                  >
                    {piece && <span className={`piece ${piece.color}`}>{PIECE_SYMBOLS[piece.color][piece.type]}</span>}
                  </button>
                );
              }))}
            </div>
            <div className="ranks right" aria-hidden="true">{[8, 7, 6, 5, 4, 3, 2, 1].map((r) => <span key={r}>{r}</span>)}</div>
          </div>
          <div className="files" aria-hidden="true">{['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((f) => <span key={f}>{f}</span>)}</div>
        </div>
        {message && <p className="message">{message}</p>}
      </section>

      <aside className="panel" aria-label="Game details">
        <section>
          <h2>Captured by White</h2>
          <Captured pieces={game.captured.white} fallback="None" />
        </section>
        <section>
          <h2>Captured by Black</h2>
          <Captured pieces={game.captured.black} fallback="None" />
        </section>
        <section>
          <h2>Recent Moves</h2>
          <ol className="history">
            {(game.history || []).length === 0 ? <li>No moves yet</li> : game.history.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}
          </ol>
        </section>
      </aside>

      {pendingPromotion && (
        <div className="modal-backdrop" role="presentation">
          <div className="promotion-dialog" role="dialog" aria-modal="true" aria-label="Choose promotion piece">
            <h2>Promote Pawn</h2>
            <div className="promotion-options">
              {PROMOTIONS.map((type) => (
                <button key={type} onClick={() => commitMove(pendingPromotion.from, pendingPromotion.to, type)}>
                  <span>{PIECE_SYMBOLS[game.turn][type]}</span>
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Captured({ pieces, fallback }) {
  if (!pieces.length) return <p className="empty">{fallback}</p>;
  return (
    <div className="captured">
      {pieces.map((piece, index) => (
        <span key={`${piece.color}-${piece.type}-${index}`} title={`${piece.color} ${piece.type}`}>
          {PIECE_SYMBOLS[piece.color][piece.type] || PIECE_LABELS[piece.color][piece.type]}
        </span>
      ))}
    </div>
  );
}

export default App;
