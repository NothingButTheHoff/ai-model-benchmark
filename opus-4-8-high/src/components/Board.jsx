import Square from './Square.jsx';
import { findKing } from '../engine/attacks.js';
import { STATUS } from '../engine/game.js';

// Renders the 8x8 grid from White's perspective (row 0 = rank 8 at top).
export default function Board({ game, selected, targets, onSquareClick }) {
  const { board, turn } = game.state;

  // Highlight the king in check.
  const inCheck =
    game.status === STATUS.CHECK || game.status === STATUS.CHECKMATE;
  const checkedKing = inCheck ? findKing(board, turn) : null;

  // Highlight the squares of the last move.
  const last = game.history[game.history.length - 1];

  return (
    <div className="board" role="grid" aria-label="Chess board">
      {board.map((rowArr, row) =>
        rowArr.map((piece, col) => {
          const key = `${row},${col}`;
          const target = targets.get(key);
          const isLastMove =
            !!last &&
            (squareEquals(last.from, row, col) || squareEquals(last.to, row, col));
          return (
            <Square
              key={key}
              row={row}
              col={col}
              piece={piece}
              isLight={(row + col) % 2 === 0}
              isSelected={!!selected && selected.row === row && selected.col === col}
              isTarget={!!target}
              isCapture={!!target && (target.capture || target.enPassant)}
              isLastMove={isLastMove}
              isCheck={!!checkedKing && checkedKing.row === row && checkedKing.col === col}
              onClick={onSquareClick}
            />
          );
        }),
      )}
    </div>
  );
}

// Compare an algebraic square string (from history) to row/col.
function squareEquals(algebraic, row, col) {
  const files = 'abcdefgh';
  return files[col] === algebraic[0] && String(8 - row) === algebraic[1];
}
