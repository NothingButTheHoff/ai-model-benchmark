import { BOARD_SIZE, isSameSquare } from '../engine/index.js';
import { Square } from './Square.jsx';

const FILES = 'abcdefgh';

function getMoveHint(legalMoves, square) {
  const move = legalMoves.find((candidate) => isSameSquare(candidate.to, square));
  if (!move) return null;
  return move.isCapture ? 'capture' : 'move';
}

export function ChessBoard({ board, selectedSquare, legalMoves, lastMove, checkedKingSquare, onSelectSquare }) {
  return (
    <div className="board" role="group" aria-label="Chess board">
      {board.map((rowPieces, row) =>
        rowPieces.map((piece, col) => {
          const square = { row, col };
          return (
            <Square
              key={`${row}-${col}`}
              square={square}
              piece={piece}
              isLight={(row + col) % 2 === 0}
              isSelected={isSameSquare(square, selectedSquare)}
              isLastMove={isSameSquare(square, lastMove?.from) || isSameSquare(square, lastMove?.to)}
              isInCheck={isSameSquare(square, checkedKingSquare)}
              moveHint={getMoveHint(legalMoves, square)}
              fileLabel={row === BOARD_SIZE - 1 ? FILES[col] : null}
              rankLabel={col === 0 ? String(BOARD_SIZE - row) : null}
              onSelect={onSelectSquare}
            />
          );
        }),
      )}
    </div>
  );
}
