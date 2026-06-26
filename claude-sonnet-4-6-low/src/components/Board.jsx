import Square from './Square.jsx';

export default function Board({ board, selectedSquare, legalMoves, lastMove, onSquareClick }) {
  const legalSet = new Set(legalMoves.map(m => `${m.row},${m.col}`));

  return (
    <div className="board">
      {Array(8).fill(null).map((_, row) =>
        Array(8).fill(null).map((_, col) => {
          const isLight = (row + col) % 2 === 0;
          const isSelected = selectedSquare?.row === row && selectedSquare?.col === col;
          const isLegalMove = legalSet.has(`${row},${col}`);
          const isLastMove = lastMove && (
            (lastMove.from.row === row && lastMove.from.col === col) ||
            (lastMove.to.row === row && lastMove.to.col === col)
          );
          return (
            <Square
              key={`${row}-${col}`}
              row={row}
              col={col}
              piece={board[row][col]}
              isLight={isLight}
              isSelected={isSelected}
              isLegalMove={isLegalMove}
              isLastMove={isLastMove}
              onClick={() => onSquareClick(row, col)}
            />
          );
        })
      )}
      <div className="board-labels-col">
        {['8','7','6','5','4','3','2','1'].map(n => <span key={n}>{n}</span>)}
      </div>
      <div className="board-labels-row">
        {['a','b','c','d','e','f','g','h'].map(n => <span key={n}>{n}</span>)}
      </div>
    </div>
  );
}
