import { useEffect, useMemo, useState } from 'react';
import {
  BLACK,
  PIECE_NAMES,
  PIECE_SYMBOLS,
  WHITE,
  algebraic,
  applyMove,
  createInitialState,
  getLegalMoves,
  hydrateState,
} from './chessEngine.js';

const STORAGE_KEY = 'gpt-5-browser-chess-state';
const PROMOTIONS = ['q', 'r', 'b', 'n'];

function loadGame() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? hydrateState(stored) : createInitialState();
  } catch (error) {
    console.warn('Could not load saved chess game:', error);
    return createInitialState();
  }
}

export default function App() {
  const [game, setGame] = useState(loadGame);
  const [selected, setSelected] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  const legalMoves = useMemo(() => {
    if (!selected) return [];
    return getLegalMoves(game, selected.row, selected.col);
  }, [game, selected]);

  const moveMap = useMemo(() => {
    const map = new Map();
    for (const move of legalMoves) {
      map.set(squareKey(move.to.row, move.to.col), move);
    }
    return map;
  }, [legalMoves]);

  function resetGame() {
    const freshGame = createInitialState();
    setGame(freshGame);
    setSelected(null);
    setPromotion(null);
    setError('');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshGame));
  }

  function selectSquare(row, col) {
    if (promotion) return;
    const clickedPiece = game.board[row][col];
    const clickedKey = squareKey(row, col);
    setError('');

    if (selected) {
      const chosenMove = moveMap.get(clickedKey);
      if (chosenMove) {
        if (chosenMove.promotion) {
          setPromotion(chosenMove);
          return;
        }
        commitMove(chosenMove);
        return;
      }

      if (clickedPiece?.color === game.turn) {
        setSelected({ row, col });
        return;
      }

      setSelected(null);
      return;
    }

    if (clickedPiece?.color === game.turn) {
      setSelected({ row, col });
    }
  }

  function commitMove(move, promotionType = null) {
    try {
      setGame((current) => applyMove(current, move.from, move.to, promotionType));
      setSelected(null);
      setPromotion(null);
      setError('');
    } catch (moveError) {
      setError(moveError.message);
      setPromotion(null);
    }
  }

  return (
    <main className="app-shell">
      <section className="game-layout" aria-label="Chess game">
        <aside className="side-panel">
          <div className="brand-block">
            <p className="eyebrow">Browser Chess</p>
            <h1>{game.status.message}</h1>
          </div>

          <div className="status-grid" aria-label="Game status">
            <div>
              <span>Turn</span>
              <strong>{game.turn === WHITE ? 'White' : 'Black'}</strong>
            </div>
            <div>
              <span>Move</span>
              <strong>{game.fullmoveNumber}</strong>
            </div>
            <div>
              <span>Check</span>
              <strong>{game.status.check ? 'Yes' : 'No'}</strong>
            </div>
            <div>
              <span>Result</span>
              <strong>{game.status.checkmate || game.status.stalemate ? 'Final' : 'Live'}</strong>
            </div>
          </div>

          <CapturedPieces title="White captured" pieces={game.captured.w} />
          <CapturedPieces title="Black captured" pieces={game.captured.b} />

          {game.lastMove && (
            <div className="last-move">
              <span>Last move</span>
              <strong>
                {PIECE_NAMES[game.lastMove.piece.type]} {algebraic(game.lastMove.from.row, game.lastMove.from.col)}
                {' -> '}
                {algebraic(game.lastMove.to.row, game.lastMove.to.col)}
              </strong>
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          <button className="reset-button" type="button" onClick={resetGame}>
            Reset Game
          </button>
        </aside>

        <div className="board-wrap">
          <div className="board" role="grid" aria-label="Chess board">
            {game.board.map((row, rowIndex) =>
              row.map((entry, colIndex) => {
                const key = squareKey(rowIndex, colIndex);
                const legalMove = moveMap.get(key);
                const selectedHere = selected?.row === rowIndex && selected?.col === colIndex;
                const checkHere = game.status.check && entry?.type === 'k' && entry.color === game.turn;
                const squareColor = (rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark';

                return (
                  <button
                    key={key}
                    type="button"
                    role="gridcell"
                    className={[
                      'square',
                      squareColor,
                      selectedHere ? 'selected' : '',
                      legalMove ? 'legal' : '',
                      legalMove?.capture ? 'capture-target' : '',
                      checkHere ? 'king-check' : '',
                    ].join(' ')}
                    onClick={() => selectSquare(rowIndex, colIndex)}
                    aria-label={squareLabel(rowIndex, colIndex, entry)}
                  >
                    <span className="coordinate file">{rowIndex === 7 ? String.fromCharCode(97 + colIndex) : ''}</span>
                    <span className="coordinate rank">{colIndex === 0 ? 8 - rowIndex : ''}</span>
                    {entry && (
                      <span className={`piece ${entry.color === WHITE ? 'white-piece' : 'black-piece'}`}>
                        {PIECE_SYMBOLS[entry.color][entry.type]}
                      </span>
                    )}
                    {legalMove && <span className="move-dot" aria-hidden="true" />}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      </section>

      {promotion && (
        <div className="promotion-backdrop" role="presentation">
          <div className="promotion-dialog" role="dialog" aria-modal="true" aria-label="Pawn promotion">
            <h2>Promote pawn</h2>
            <div className="promotion-options">
              {PROMOTIONS.map((type) => (
                <button
                  key={type}
                  type="button"
                  className="promotion-button"
                  onClick={() => commitMove(promotion, type)}
                >
                  <span>{PIECE_SYMBOLS[game.turn][type]}</span>
                  <strong>{PIECE_NAMES[type]}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function CapturedPieces({ title, pieces }) {
  return (
    <div className="captured-block">
      <span>{title}</span>
      <div className="captured-row">
        {pieces.length === 0 ? (
          <small>None</small>
        ) : (
          pieces.map((entry, index) => (
            <span key={`${entry.color}-${entry.type}-${index}`} className="captured-piece">
              {PIECE_SYMBOLS[entry.color][entry.type]}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function squareLabel(row, col, piece) {
  const name = algebraic(row, col);
  if (!piece) return `${name}, empty`;
  const color = piece.color === WHITE ? 'White' : 'Black';
  return `${name}, ${color} ${PIECE_NAMES[piece.type]}`;
}

function squareKey(row, col) {
  return `${row}-${col}`;
}
