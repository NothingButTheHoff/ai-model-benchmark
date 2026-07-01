import { createInitialState, getLegalMoves, makeMove, getAllLegalMoves } from './src/engine/engine.js';

function move(state, from, to, promotion) {
  const legal = getLegalMoves(state, from[0], from[1]);
  const m = legal.find((mv) => mv.to.row === to[0] && mv.to.col === to[1] && (!promotion || mv.promotion === promotion));
  if (!m) throw new Error(`Illegal move ${JSON.stringify(from)}->${JSON.stringify(to)}`);
  return makeMove(state, m);
}

// Fool's mate -> checkmate detection
let s = createInitialState();
s = move(s, [6, 5], [5, 5]); // f3
s = move(s, [1, 4], [3, 4]); // e5
s = move(s, [6, 6], [4, 6]); // g4
s = move(s, [0, 3], [4, 7]); // Qh4#
console.log('Fools mate status:', s.status, s.winner); // expect checkmate, b

// Castling test
s = createInitialState();
s = move(s, [6, 4], [4, 4]); // e4
s = move(s, [1, 4], [3, 4]); // e5
s = move(s, [7, 6], [5, 5]); // Nf3
s = move(s, [0, 6], [2, 5]); // Nf6
s = move(s, [7, 5], [4, 2]); // Bc4
s = move(s, [0, 5], [3, 2]); // Bc5
s = move(s, [7, 4], [7, 6]); // O-O
console.log('Castle status (expect no exception):', s.history[s.history.length - 1].san);

// En passant test
s = createInitialState();
s = move(s, [6, 4], [4, 4]); // e4
s = move(s, [1, 0], [2, 0]); // a6
s = move(s, [4, 4], [3, 4]); // e5
s = move(s, [1, 3], [3, 3]); // d5 (double step, sets enPassant)
s = move(s, [3, 4], [2, 3]); // exd6 en passant
console.log('En passant capture square empty:', s.board[3][3] === null, 'pawn moved to', s.board[2][3]);

// Stalemate scenario (classic K vs K+Q stalemate setup)
let board = Array.from({ length: 8 }, () => Array(8).fill(null));
board[0][0] = { type: 'k', color: 'b' }; // black king a8
board[2][1] = { type: 'k', color: 'w' }; // white king b6
board[1][2] = { type: 'q', color: 'w' }; // white queen c7
let stale = {
  board, turn: 'b', castling: { wK: false, wQ: false, bK: false, bQ: false },
  enPassant: null, captured: { w: [], b: [] }, history: [], status: 'active', winner: null,
};
console.log('Stalemate legal moves for black (expect 0):', getAllLegalMoves(stale, 'b').length);

console.log('ALL TESTS RAN');
