import { useEffect, useMemo, useState } from 'react';
import {
  COLORS,
  PIECE_NAMES,
  applyMove,
  colorName,
  createInitialState,
  getGameStatus,
  getLegalMoves,
  normalizeState,
  pieceKey,
  sameSquare,
  squareName,
} from './chessEngine.js';

const STORAGE_KEY = 'browser-chess-gpt-5-codex-2';
const PIECES = {
  wk: '♔',
  wq: '♕',
  wr: '♖',
  wb: '♗',
  wn: '♘',
  wp: '♙',
  bk: '♚',
  bq: '♛',
  br: '♜',
  bb: '♝',
  bn: '♞',
  bp: '♟',
};
const PROMOTION_OPTIONS = ['q', 'r', 'b', 'n'];

export default function App() {
  const [game, setGame] = useState(loadGame);
  const [selected, setSelected] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [error, setError] = useState('');

  const legalMoves = useMemo(
    () => (selected ? getLegalMoves(game, selected) : []),
    [game, selected],
  );
  const status = useMemo(() => getGameStatus(game), [game]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  function handleSquareClick(row, col) {
    if (pendingPromotion) return;

    const clicked = { row, col };
    const piece = game.board[row][col];
    const chosenMove = legalMoves.find((move) => sameSquare(move.to, clicked));

    setError('');

    if (chosenMove) {
      if (chosenMove.promotion) {
        setPendingPromotion(chosenMove);
      } else {
        commitMove(chosenMove);
      }
      return;
    }

    if (piece?.color === game.turn && status.kind !== 'checkmate' && status.kind !== 'stalemate') {
      setSelected(clicked);
      return;
    }

    setSelected(null);
  }

  function commitMove(move, promotionChoice) {
    try {
      setGame((current) => applyMove(current, move, promotionChoice));
      setSelected(null);
      setPendingPromotion(null);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  function resetGame() {
    const fresh = createInitialState();
    setGame(fresh);
    setSelected(null);
    setPendingPromotion(null);
    setError('');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }

  return (
    <main className="app-shell">
      <section className="game-area" aria-label="Chess game">
        <div className="board-wrap">
          <div className="board" role="grid" aria-label="Chess board">
            {game.board.map((rank, row) =>
              rank.map((piece, col) => {
                const square = { row, col };
                const isSelected = sameSquare(selected, square);
                const legalMove = legalMoves.find((move) => sameSquare(move.to, square));
                const isLastMove =
                  sameSquare(game.lastMove?.from, square) || sameSquare(game.lastMove?.to, square);

                return (
                  <button
                    className={[
                      'square',
                      (row + col) % 2 === 0 ? 'light' : 'dark',
                      isSelected ? 'selected' : '',
                      legalMove ? 'legal' : '',
                      legalMove?.capture ? 'capture' : '',
                      isLastMove ? 'last-move' : '',
                    ].join(' ')}
                    key={`${row}-${col}`}
                    onClick={() => handleSquareClick(row, col)}
                    role="gridcell"
                    aria-label={labelSquare(square, piece, legalMove)}
                  >
                    <span className="coordinate file">{row === 7 ? squareName(square)[0] : ''}</span>
                    <span className="coordinate rank">{col === 0 ? squareName(square)[1] : ''}</span>
                    {piece ? <span className="piece">{PIECES[pieceKey(piece)]}</span> : null}
                    {legalMove && !piece ? <span className="move-dot" /> : null}
                    {legalMove?.capture ? <span className="capture-ring" /> : null}
                  </button>
                );
              }),
            )}
          </div>
        </div>

        <aside className="panel">
          <div>
            <p className="label">Turn</p>
            <h1>{colorName(game.turn)}</h1>
            <p className={`status ${status.inCheck ? 'danger' : ''}`}>{status.message}</p>
            {error ? <p className="error">{error}</p> : null}
          </div>

          <div className="meta-grid">
            <div>
              <p className="label">Move</p>
              <strong>{game.fullmoveNumber}</strong>
            </div>
            <div>
              <p className="label">Selected</p>
              <strong>{selected ? squareName(selected) : '-'}</strong>
            </div>
          </div>

          <Captured title="White captured" pieces={game.captured[COLORS.WHITE]} />
          <Captured title="Black captured" pieces={game.captured[COLORS.BLACK]} />

          <button className="reset" onClick={resetGame} type="button">
            Reset Game
          </button>
        </aside>
      </section>

      {pendingPromotion ? (
        <div className="modal-backdrop" role="presentation">
          <div className="promotion-dialog" role="dialog" aria-modal="true" aria-label="Choose promotion">
            <h2>Promote pawn</h2>
            <div className="promotion-options">
              {PROMOTION_OPTIONS.map((type) => {
                const piece = { color: game.turn, type };
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => commitMove(pendingPromotion, type)}
                    aria-label={`Promote to ${PIECE_NAMES[type]}`}
                  >
                    <span>{PIECES[pieceKey(piece)]}</span>
                    <small>{PIECE_NAMES[type]}</small>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function loadGame() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeState(JSON.parse(saved)) : createInitialState();
  } catch {
    return createInitialState();
  }
}

function Captured({ title, pieces }) {
  return (
    <div className="captured">
      <p className="label">{title}</p>
      <div className="captured-list" aria-label={title}>
        {pieces.length === 0 ? (
          <span className="empty">None</span>
        ) : (
          pieces.map((piece, index) => <span key={`${pieceKey(piece)}-${index}`}>{PIECES[pieceKey(piece)]}</span>)
        )}
      </div>
    </div>
  );
}

function labelSquare(square, piece, legalMove) {
  const parts = [squareName(square)];
  if (piece) parts.push(`${colorName(piece.color)} ${PIECE_NAMES[piece.type]}`);
  if (legalMove?.capture) parts.push('capture available');
  if (legalMove && !legalMove.capture) parts.push('legal move');
  return parts.join(', ');
}
