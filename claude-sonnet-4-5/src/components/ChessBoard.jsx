import { useState, useEffect } from 'react';
import { ChessEngine, COLORS, PIECES } from '../engine/ChessEngine';
import Square from './Square';
import CapturedPieces from './CapturedPieces';
import PromotionDialog from './PromotionDialog';
import './ChessBoard.css';

const STORAGE_KEY = 'chess_game_state';

function ChessBoard() {
  const [engine, setEngine] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        return new ChessEngine(state);
      } catch (e) {
        console.error('Failed to load saved game', e);
      }
    }
    return new ChessEngine();
  });

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [promotionData, setPromotionData] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);

  useEffect(() => {
    const state = engine.getGameState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    if (engine.isCheckmate()) {
      const winner = engine.currentTurn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
      setGameStatus(`Checkmate! ${winner === COLORS.WHITE ? 'White' : 'Black'} wins!`);
    } else if (engine.isStalemate()) {
      setGameStatus('Stalemate! Game is a draw.');
    } else if (engine.isInCheck(engine.currentTurn)) {
      setGameStatus(`${engine.currentTurn === COLORS.WHITE ? 'White' : 'Black'} is in check!`);
    } else {
      setGameStatus(null);
    }
  }, [engine]);

  const handleSquareClick = (row, col) => {
    if (promotionData) return;

    if (selectedSquare) {
      if (selectedSquare.row === row && selectedSquare.col === col) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      const move = validMoves.find(m => m.row === row && m.col === col);
      if (move) {
        const result = engine.makeMove(selectedSquare.row, selectedSquare.col, row, col);

        if (result && result.needsPromotion) {
          setPromotionData({
            fromRow: selectedSquare.row,
            fromCol: selectedSquare.col,
            toRow: row,
            toCol: col
          });
        } else if (result) {
          setEngine(new ChessEngine(engine.getGameState()));
        }

        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        const piece = engine.getPiece(row, col);
        if (piece && piece.color === engine.currentTurn) {
          setSelectedSquare({ row, col });
          setValidMoves(engine.getValidMoves(row, col));
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      const piece = engine.getPiece(row, col);
      if (piece && piece.color === engine.currentTurn) {
        setSelectedSquare({ row, col });
        setValidMoves(engine.getValidMoves(row, col));
      }
    }
  };

  const handlePromotion = (pieceType) => {
    if (!promotionData) return;

    const { fromRow, fromCol, toRow, toCol } = promotionData;
    engine.makeMove(fromRow, fromCol, toRow, toCol, pieceType);
    setEngine(new ChessEngine(engine.getGameState()));
    setPromotionData(null);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the game?')) {
      const newEngine = new ChessEngine();
      setEngine(newEngine);
      setSelectedSquare(null);
      setValidMoves([]);
      setPromotionData(null);
      setGameStatus(null);
    }
  };

  const isValidMove = (row, col) => {
    return validMoves.some(m => m.row === row && m.col === col);
  };

  const isSelected = (row, col) => {
    return selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
  };

  return (
    <div className="chess-container">
      <div className="game-header">
        <h1>Chess Game</h1>
        <button className="reset-button" onClick={handleReset}>Reset Game</button>
      </div>

      <div className="game-layout">
        <div className="sidebar">
          <CapturedPieces
            pieces={engine.capturedPieces.black}
            color={COLORS.BLACK}
            label="Black's Captures"
          />
        </div>

        <div className="board-section">
          <div className="turn-indicator">
            {gameStatus ? (
              <div className="game-status">{gameStatus}</div>
            ) : (
              <div>Current Turn: <strong>{engine.currentTurn === COLORS.WHITE ? 'White' : 'Black'}</strong></div>
            )}
          </div>

          <div className="chess-board">
            {engine.board.map((row, rowIndex) => (
              <div key={rowIndex} className="board-row">
                {row.map((piece, colIndex) => (
                  <Square
                    key={`${rowIndex}-${colIndex}`}
                    row={rowIndex}
                    col={colIndex}
                    piece={piece}
                    isLight={(rowIndex + colIndex) % 2 === 0}
                    isSelected={isSelected(rowIndex, colIndex)}
                    isValidMove={isValidMove(rowIndex, colIndex)}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar">
          <CapturedPieces
            pieces={engine.capturedPieces.white}
            color={COLORS.WHITE}
            label="White's Captures"
          />
        </div>
      </div>

      {promotionData && (
        <PromotionDialog
          color={engine.currentTurn}
          onSelect={handlePromotion}
        />
      )}
    </div>
  );
}

export default ChessBoard;
