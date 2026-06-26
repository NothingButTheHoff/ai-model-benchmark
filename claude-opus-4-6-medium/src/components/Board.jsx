import { useState, useEffect, useCallback } from 'react';
import Square from './Square.jsx';
import PromotionDialog from './PromotionDialog.jsx';
import { PIECES, PIECE_SYMBOLS, COLORS } from '../engine/constants.js';
import { createInitialState, makeMove, applyPromotion } from '../engine/game.js';
import { getLegalMoves, findKing, isInCheck } from '../engine/moves.js';

const STORAGE_KEY = 'chess-game-state';

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

const PIECE_VALUES = { queen: 9, rook: 5, bishop: 3, knight: 3, pawn: 1 };

function sortCaptured(pieces) {
  return [...pieces].sort((a, b) => (PIECE_VALUES[b.type] || 0) - (PIECE_VALUES[a.type] || 0));
}

export default function Board() {
  const [gameState, setGameState] = useState(() => loadState() || createInitialState());
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);

  useEffect(() => {
    saveState(gameState);
  }, [gameState]);

  const handleSquareClick = useCallback((row, col) => {
    if (gameState.pendingPromotion) return;
    if (gameState.status === 'checkmate' || gameState.status === 'stalemate') return;

    const piece = gameState.board[row][col];

    if (selected) {
      const isLegal = legalMoves.some(([r, c]) => r === row && c === col);
      if (isLegal) {
        const newState = makeMove(gameState, selected[0], selected[1], row, col);
        if (newState) {
          setGameState(newState);
          setSelected(null);
          setLegalMoves([]);
          return;
        }
      }

      if (piece && piece.color === gameState.turn) {
        setSelected([row, col]);
        setLegalMoves(getLegalMoves(gameState.board, row, col, gameState.enPassantTarget, gameState.castlingRights));
        return;
      }

      setSelected(null);
      setLegalMoves([]);
      return;
    }

    if (piece && piece.color === gameState.turn) {
      setSelected([row, col]);
      setLegalMoves(getLegalMoves(gameState.board, row, col, gameState.enPassantTarget, gameState.castlingRights));
    }
  }, [gameState, selected, legalMoves]);

  const handlePromotion = useCallback((pieceType) => {
    const newState = applyPromotion(gameState, pieceType);
    setGameState(newState);
  }, [gameState]);

  const handleReset = useCallback(() => {
    const fresh = createInitialState();
    setGameState(fresh);
    setSelected(null);
    setLegalMoves([]);
  }, []);

  const kingPos = findKing(gameState.board, gameState.turn);
  const kingInCheck = (gameState.status === 'check' || gameState.status === 'checkmate') && kingPos;

  const statusText = (() => {
    switch (gameState.status) {
      case 'checkmate': return `Checkmate! ${gameState.winner === COLORS.WHITE ? 'White' : 'Black'} wins!`;
      case 'stalemate': return 'Stalemate — Draw!';
      case 'check': return `${gameState.turn === COLORS.WHITE ? 'White' : 'Black'} is in check!`;
      default: return `${gameState.turn === COLORS.WHITE ? 'White' : 'Black'}'s turn`;
    }
  })();

  return (
    <div className="game-container">
      <div className="game-info">
        <div className={`status ${gameState.status}`}>{statusText}</div>
      </div>

      <div className="board-area">
        <div className="captured-panel">
          <h4>Black captured:</h4>
          <div className="captured-pieces">
            {sortCaptured(gameState.captured[COLORS.BLACK]).map((p, i) => (
              <span key={i} className="captured-piece">{PIECE_SYMBOLS[p.color][p.type]}</span>
            ))}
          </div>
        </div>

        <div className="board">
          {gameState.board.map((row, r) => (
            <div key={r} className="board-row">
              <span className="rank-label">{8 - r}</span>
              {row.map((piece, c) => (
                <Square
                  key={`${r}-${c}`}
                  piece={piece}
                  row={r}
                  col={c}
                  isSelected={selected && selected[0] === r && selected[1] === c}
                  isLegalMove={legalMoves.some(([mr, mc]) => mr === r && mc === c)}
                  isCheck={kingInCheck && kingPos[0] === r && kingPos[1] === c}
                  onClick={() => handleSquareClick(r, c)}
                />
              ))}
            </div>
          ))}
          <div className="file-labels">
            <span className="rank-spacer" />
            {['a','b','c','d','e','f','g','h'].map(f => <span key={f} className="file-label">{f}</span>)}
          </div>
        </div>

        <div className="captured-panel">
          <h4>White captured:</h4>
          <div className="captured-pieces">
            {sortCaptured(gameState.captured[COLORS.WHITE]).map((p, i) => (
              <span key={i} className="captured-piece">{PIECE_SYMBOLS[p.color][p.type]}</span>
            ))}
          </div>
        </div>
      </div>

      <button className="reset-btn" onClick={handleReset}>Reset Game</button>

      {gameState.pendingPromotion && (
        <PromotionDialog color={gameState.turn} onSelect={handlePromotion} />
      )}
    </div>
  );
}
