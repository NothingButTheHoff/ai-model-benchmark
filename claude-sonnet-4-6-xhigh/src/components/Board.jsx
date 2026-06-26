import { Square } from './Square';
import { findKing } from '../utils/boardUtils';
import { PIECES } from '../engine/chess';

export function Board({ gameState, selectedSquare, validMoves, onSquareClick }) {
  const { board, status, currentTurn } = gameState;

  const validMoveSet = new Set(validMoves.map(m => `${m.to[0]},${m.to[1]}`));

  // Find king in check position
  let checkKingPos = null;
  if (status === 'check' || status === 'checkmate') {
    checkKingPos = findKing(board, currentTurn);
  }

  return (
    <div className="board" role="grid" aria-label="Chess board">
      {board.map((row, rowIdx) =>
        row.map((piece, colIdx) => {
          const isSelected = selectedSquare?.[0] === rowIdx && selectedSquare?.[1] === colIdx;
          const isValidMove = validMoveSet.has(`${rowIdx},${colIdx}`);
          const isInCheck = checkKingPos?.[0] === rowIdx && checkKingPos?.[1] === colIdx;

          return (
            <Square
              key={`${rowIdx}-${colIdx}`}
              row={rowIdx}
              col={colIdx}
              piece={piece}
              isSelected={isSelected}
              isValidMove={isValidMove}
              isInCheck={isInCheck}
              onClick={() => onSquareClick(rowIdx, colIdx)}
            />
          );
        })
      )}
    </div>
  );
}
