import Square from './Square.jsx';

function squaresEqual(a, b) {
  return !!a && !!b && a.row === b.row && a.col === b.col;
}

export default function Board({ board, selectedSquare, legalMoves, lastMove, onSquareClick }) {
  const rows = [];

  for (let row = 0; row < 8; row++) {
    const cells = [];
    for (let col = 0; col < 8; col++) {
      const square = { row, col };
      const piece = board[row][col];
      const legalMove = legalMoves.find((m) => squaresEqual(m.to, square));
      const isLastMove =
        !!lastMove && (squaresEqual(lastMove.from, square) || squaresEqual(lastMove.to, square));

      cells.push(
        <Square
          key={col}
          square={square}
          piece={piece}
          isLight={(row + col) % 2 === 0}
          isSelected={squaresEqual(selectedSquare, square)}
          isLegalTarget={!!legalMove}
          isCapture={!!legalMove && (!!legalMove.captured || legalMove.isEnPassant)}
          isLastMove={isLastMove}
          onClick={() => onSquareClick(square)}
        />
      );
    }
    rows.push(
      <div className="board-row" key={row}>
        {cells}
      </div>
    );
  }

  return <div className="board">{rows}</div>;
}
