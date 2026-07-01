import { createInitialState, getMoveTargets, applyMove } from './src/engine/gameEngine.js';
import { getAllLegalMoves, isInCheck } from './src/engine/moveGenerator.js';

function move(state, from, to, extra = {}) {
  const targets = getMoveTargets(state, from.row, from.col);
  const m = targets.find((t) => t.row === to.row && t.col === to.col && (!extra.promotion || t.promotion === extra.promotion) && (!extra.castle || t.castle === extra.castle));
  if (!m) throw new Error(`Illegal move ${JSON.stringify(from)}->${JSON.stringify(to)} targets=${JSON.stringify(targets)}`);
  return applyMove(state, from, m);
}

function rc(alg) {
  const col = alg.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = 8 - parseInt(alg[1], 10);
  return { row, col };
}

function run(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (e) {
    console.log(`FAIL: ${name} -> ${e.message}`);
  }
}

run('fools mate checkmate', () => {
  let s = createInitialState();
  s = move(s, rc('f2'), rc('f3'));
  s = move(s, rc('e7'), rc('e5'));
  s = move(s, rc('g2'), rc('g4'));
  s = move(s, rc('d8'), rc('h4'));
  if (s.status !== 'checkmate') throw new Error(`expected checkmate got ${s.status}`);
  if (s.winner !== 'black') throw new Error(`expected black winner got ${s.winner}`);
});

run('en passant capture', () => {
  let s = createInitialState();
  s = move(s, rc('e2'), rc('e4'));
  s = move(s, rc('a7'), rc('a6'));
  s = move(s, rc('e4'), rc('e5'));
  s = move(s, rc('d7'), rc('d5')); // black double step next to white pawn
  const targets = getMoveTargets(s, rc('e5').row, rc('e5').col);
  const ep = targets.find((t) => t.isEnPassant);
  if (!ep) throw new Error('en passant target not found');
  s = applyMove(s, rc('e5'), ep);
  if (s.board[rc('d5').row][rc('d5').col]) throw new Error('captured pawn still on board');
  if (!s.board[rc('d6').row][rc('d6').col]) throw new Error('capturing pawn not moved to d6');
});

run('kingside castling', () => {
  let s = createInitialState();
  s = move(s, rc('e2'), rc('e4'));
  s = move(s, rc('e7'), rc('e5'));
  s = move(s, rc('g1'), rc('f3'));
  s = move(s, rc('b8'), rc('c6'));
  s = move(s, rc('f1'), rc('c4'));
  s = move(s, rc('g8'), rc('f6'));
  s = move(s, rc('e1'), rc('g1'), { castle: 'K' });
  if (s.board[7][6]?.type !== 'k') throw new Error('king did not castle');
  if (s.board[7][5]?.type !== 'r') throw new Error('rook did not move');
});

run('pawn promotion', () => {
  // Build a state manually: white pawn one step from promotion, nothing blocking.
  let s = createInitialState();
  // Clear a path: move white pawn from a2 up to a7 manually via repeated captures is complex;
  // instead directly mutate board for a focused promotion test.
  const board = s.board.map((row) => row.map((c) => (c ? { ...c } : null)));
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) board[r][c] = null;
  board[1][0] = { type: 'p', color: 'white' };
  board[0][7] = { type: 'k', color: 'black' };
  board[7][7] = { type: 'k', color: 'white' };
  s = { ...s, board, turn: 'white' };
  const targets = getMoveTargets(s, 1, 0);
  const queenPromo = targets.find((t) => t.promotion === 'q');
  if (!queenPromo) throw new Error('no queen promotion option');
  s = applyMove(s, { row: 1, col: 0 }, queenPromo);
  if (s.board[0][0]?.type !== 'q') throw new Error('pawn did not promote to queen');
});

run('stalemate detection', () => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[0][0] = { type: 'k', color: 'black' }; // a8
  board[1][2] = { type: 'q', color: 'white' }; // c7
  board[2][1] = { type: 'k', color: 'white' }; // b6
  const moves = getAllLegalMoves(board, 'black', { castlingRights: { black: {}, white: {} }, enPassantTarget: null });
  if (moves.length !== 0) throw new Error(`expected no legal moves, got ${moves.length}`);
  if (isInCheck(board, 'black')) throw new Error('king should not be in check for stalemate');
});
