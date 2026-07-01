import Square from './Square';

export default function Board({ board, selected, legalTargets, lastMove, onSquareClick }) {
  const targetMap = new Map(legalTargets.map((m) => [`${m.row},${m.col}`, m]));

  return (
    <div className="board">
      {board.map((rowArr, row) => (
        <div className="board-row" key={row}>
          {rowArr.map((piece, col) => {
            const key = `${row},${col}`;
            const target = targetMap.get(key);
            const isSelected = !!selected && selected.row === row && selected.col === col;
            const isLastMove = !!lastMove && (
              (lastMove.from.row === row && lastMove.from.col === col) ||
              (lastMove.to.row === row && lastMove.to.col === col)
            );
            return (
              <Square
                key={key}
                piece={piece}
                isLight={(row + col) % 2 === 0}
                isSelected={isSelected}
                isLegalTarget={!!target}
                isCapture={!!piece || target?.isEnPassant}
                isLastMove={isLastMove}
                onClick={() => onSquareClick(row, col)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
