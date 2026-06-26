import { PIECE_TYPES, COLORS } from '../chess/piece'

function Board({ game, selectedSquare, validMoves, onSquareClick, getPieceEmoji }) {
  const isLightSquare = (row, col) => (row + col) % 2 === 0

  const getSquareClass = (row, col) => {
    let classes = ['square']
    classes.push(isLightSquare(row, col) ? 'light' : 'dark')

    if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
      classes.push('selected')
    }

    if (validMoves.some(m => m.row === row && m.col === col)) {
      classes.push('valid-move')
      if (game.board.getSquare(row, col)) {
        classes.push('capture')
      }
    }

    return classes.join(' ')
  }

  return (
    <div className="board">
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => {
          const piece = game.board.getSquare(row, col)
          return (
            <div
              key={`${row}-${col}`}
              className={getSquareClass(row, col)}
              onClick={() => onSquareClick(row, col)}
            >
              {piece && <div className="piece">{getPieceEmoji(piece.type, piece.color)}</div>}
            </div>
          )
        })
      )}
    </div>
  )
}

export default Board
