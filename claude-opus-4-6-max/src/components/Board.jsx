import { PIECE_UNICODE, KING } from '../engine';

const FILES = 'abcdefgh';

export default function Board({ board, selectedSquare, validMoves, lastMove, inCheck, checkColor, onSquareClick }) {
  return (
    <div className="board">
      {board.flatMap((row, r) =>
        row.map((piece, c) => {
          const isLight = (r + c) % 2 === 0;
          const isSelected = selectedSquare && selectedSquare.row === r && selectedSquare.col === c;
          const isValid = validMoves.some(m => m.row === r && m.col === c);
          const isLast = lastMove && (
            (lastMove.from.row === r && lastMove.from.col === c) ||
            (lastMove.to.row === r && lastMove.to.col === c)
          );
          const isCheck = inCheck && piece && piece.type === KING && piece.color === checkColor;

          const classes = [
            'square',
            isLight ? 'light' : 'dark',
            isSelected && 'selected',
            isLast && !isSelected && 'last-move',
          ].filter(Boolean).join(' ');

          return (
            <div
              key={`${r}-${c}`}
              className={classes}
              data-rank={c === 0 ? 8 - r : undefined}
              data-file={r === 7 ? FILES[c] : undefined}
              onClick={() => onSquareClick(r, c)}
            >
              {piece && (
                <span className="piece">{PIECE_UNICODE[piece.color][piece.type]}</span>
              )}
              {isValid && !piece && <div className="move-dot" />}
              {isValid && piece && <div className="move-capture" />}
              {isCheck && <div className="check-overlay" />}
            </div>
          );
        })
      )}
    </div>
  );
}
