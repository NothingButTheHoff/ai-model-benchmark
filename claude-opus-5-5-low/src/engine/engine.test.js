import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLACK, GAME_STATUS, KING, PAWN, QUEEN, ROOK, WHITE } from './constants.js';
import { createInitialState, makeMove } from './game.js';
import { getAllLegalMoves, getLegalMoves } from './moves.js';

const sq = (name) => ({ row: 8 - Number(name[1]), col: name.charCodeAt(0) - 97 });

const play = (state, ...moves) =>
  moves.reduce((s, m) => {
    const [from, to, promo] = m.split(' ');
    return makeMove(s, sq(from), sq(to), promo);
  }, state);

const emptyState = (pieces, turn = WHITE) => {
  const state = createInitialState();
  state.board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (const [name, type, color] of pieces) {
    const { row, col } = sq(name);
    state.board[row][col] = { type, color };
  }
  state.turn = turn;
  return state;
};

test('initial position has 20 legal moves', () => {
  assert.equal(getAllLegalMoves(createInitialState()).length, 20);
});

test('fools mate is checkmate', () => {
  const state = play(createInitialState(), 'f2 f3', 'e7 e5', 'g2 g4', 'd8 h4');
  assert.equal(state.status, GAME_STATUS.CHECKMATE);
});

test('en passant captures pawn and expires', () => {
  let state = play(createInitialState(), 'e2 e4', 'a7 a6', 'e4 e5', 'd7 d5');
  state = play(state, 'e5 d6');
  assert.equal(state.board[sq('d5').row][sq('d5').col], null);
  assert.deepEqual(state.captured[WHITE], [PAWN]);

  let late = play(createInitialState(), 'e2 e4', 'a7 a6', 'e4 e5', 'd7 d5', 'h2 h3', 'h7 h6');
  assert.throws(() => play(late, 'e5 d6'));
});

test('castling both sides moves rook', () => {
  const base = emptyState([['e1', KING, WHITE], ['a1', ROOK, WHITE], ['h1', ROOK, WHITE], ['e8', KING, BLACK]]);
  const kingSide = play(base, 'e1 g1');
  assert.equal(kingSide.board[7][5].type, ROOK);
  const queenSide = play(base, 'e1 c1');
  assert.equal(queenSide.board[7][3].type, ROOK);
});

test('cannot castle through, out of, or into check', () => {
  const through = emptyState([['e1', KING, WHITE], ['h1', ROOK, WHITE], ['f8', ROOK, BLACK], ['a8', KING, BLACK]]);
  assert.throws(() => play(through, 'e1 g1'));
  const outOf = emptyState([['e1', KING, WHITE], ['h1', ROOK, WHITE], ['e8', ROOK, BLACK], ['a8', KING, BLACK]]);
  assert.throws(() => play(outOf, 'e1 g1'));
  const into = emptyState([['e1', KING, WHITE], ['h1', ROOK, WHITE], ['g8', ROOK, BLACK], ['a8', KING, BLACK]]);
  assert.throws(() => play(into, 'e1 g1'));
});

test('queen side castle allowed when only b1 attacked', () => {
  const state = emptyState([['e1', KING, WHITE], ['a1', ROOK, WHITE], ['b8', ROOK, BLACK], ['h8', KING, BLACK]]);
  assert.doesNotThrow(() => play(state, 'e1 c1'));
});

test('castling rights lost after rook moves', () => {
  const base = emptyState([['e1', KING, WHITE], ['h1', ROOK, WHITE], ['e8', KING, BLACK]]);
  const state = play(base, 'h1 h2', 'e8 e7', 'h2 h1', 'e7 e8');
  assert.equal(getLegalMoves(state, sq('e1')).some((m) => m.castle), false);
});

test('promotion requires valid piece and promotes', () => {
  const base = emptyState([['a7', PAWN, WHITE], ['e1', KING, WHITE], ['h8', KING, BLACK]]);
  assert.throws(() => play(base, 'a7 a8'));
  const state = play(base, 'a7 a8 n');
  assert.equal(state.board[0][0].type, 'n');
  assert.equal(play(base, 'a7 a8 q').board[0][0].type, QUEEN);
});

test('stalemate detected', () => {
  const base = emptyState([['a8', KING, BLACK], ['b6', QUEEN, WHITE], ['h1', KING, WHITE], ['c1', ROOK, WHITE]]);
  const state = play(base, 'c1 c7');
  assert.equal(state.status, GAME_STATUS.STALEMATE);
});

test('pinned piece cannot move', () => {
  const state = emptyState([['e1', KING, WHITE], ['e2', ROOK, WHITE], ['e8', ROOK, BLACK], ['a8', KING, BLACK]]);
  assert.ok(getLegalMoves(state, sq('e2')).every((m) => m.to.col === 4));
});
