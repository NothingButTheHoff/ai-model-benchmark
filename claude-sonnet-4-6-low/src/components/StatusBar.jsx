export default function StatusBar({ turn, status, onReset }) {
  const getMessage = () => {
    if (status === 'checkmate') {
      const winner = turn === 'white' ? 'Black' : 'White';
      return `Checkmate! ${winner} wins!`;
    }
    if (status === 'stalemate') return 'Stalemate! Draw!';
    if (status === 'check') return `${turn === 'white' ? 'White' : 'Black'} is in check!`;
    return `${turn === 'white' ? 'White' : 'Black'}'s turn`;
  };

  return (
    <div className="status-bar">
      <div className={`turn-indicator turn-${turn}`}>
        <span className="turn-dot" />
        <span className="status-message">{getMessage()}</span>
      </div>
      <button className="reset-btn" onClick={onReset}>Reset Game</button>
    </div>
  );
}
