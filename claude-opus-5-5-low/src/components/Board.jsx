import { toAlgebraic } from '../engine/board.js';
import { pieceSymbol } from './pieceSymbols.js';

const sameSquare = (a, b) => Boolean(a && b && a.row === b.row && a.col === b.col);

export function Board({ board, selected, validMoves, lastMove, checkedKing, onSquareClick }) {
  return (
    <div className="board" role="grid" aria-label="Chess board">
      {board.map((rowPieces, row) =>
        rowPieces.map((piece, col) => {
          const square = { row, col };
          const move = validMoves.find((m) => sameSquare(m.to, square));
          const classes = [
            'square',
            (row + col) % 2 === 0 ? 'light' : 'dark',
            sameSquare(selected, square) && 'selected',
            (sameSquare(lastMove?.from, square) || sameSquare(lastMove?.to, square)) && 'last-move',
            sameSquare(checkedKing, square) && 'in-check',
            move && (move.capture ? 'capture-target' : 'move-target'),
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={`${row}-${col}`}
              type="button"
              className={classes}
              onClick={() => onSquareClick(square)}
              aria-label={`${toAlgebraic(square)}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
            >
              {piece && <span className={`piece piece-${piece.color}`}>{pieceSymbol(piece.type, piece.color)}</span>}
            </button>
          );
        }),
      )}
    </div>
  );
}
