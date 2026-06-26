export default function TurnIndicator({ turn, isCheck, isCheckmate, isStalemate }) {
  let message = ''
  let className = 'turn-indicator'

  if (isCheckmate) {
    const winner = turn === 'w' ? 'Black' : 'White'
    message = `Checkmate! ${winner} wins!`
    className += ' status-checkmate'
  } else if (isStalemate) {
    message = 'Stalemate! It\'s a draw.'
    className += ' status-stalemate'
  } else if (isCheck) {
    const inCheckColor = turn === 'w' ? 'White' : 'Black'
    message = `${inCheckColor} is in Check!`
    className += ' status-check'
  } else {
    const currentColor = turn === 'w' ? 'White' : 'Black'
    message = `${currentColor}'s turn`
    className += ' status-normal'
  }

  return (
    <div className={className}>
      <div className={`turn-dot turn-dot-${turn}`} />
      <span>{message}</span>
    </div>
  )
}
