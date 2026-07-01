import Square from './Square';

export default function Board({
  board, selected, legalMoves, lastMove, kingInCheckSquare, onSquareClick,
}) {
  const isLegalTarget = (r, c) => legalMoves.some((m) => m.to.row === r && m.to.col === c);
  const isCaptureTarget = (r, c) => legalMoves.some((m) => m.to.row === r && m.to.col === c && m.capture);
  const isLastMoveSquare = (r, c) => lastMove
    && ((lastMove.from.row === r && lastMove.from.col === c)
      || (lastMove.to.row === r && lastMove.to.col === c));

  return (
    <div className="board">
      {board.map((rowArr, r) => (
        rowArr.map((cell, c) => (
          <Square
            key={`${r}-${c}`}
            row={r}
            col={c}
            piece={cell}
            isLight={(r + c) % 2 === 0}
            isSelected={selected && selected.row === r && selected.col === c}
            isLegalTarget={isLegalTarget(r, c)}
            isCapture={isCaptureTarget(r, c)}
            isLastMove={isLastMoveSquare(r, c)}
            isCheck={kingInCheckSquare && kingInCheckSquare.row === r && kingInCheckSquare.col === c}
            onClick={onSquareClick}
          />
        ))
      ))}
    </div>
  );
}
