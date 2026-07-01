import { test } from 'node:test';
import assert from 'node:assert/strict';
import { algebraicToSquare } from '../board.js';
import { generateLegalMoves } from '../moveGen.js';
import { stateFromLayout, playMove } from './testUtils.js';

test('pawn reaching the last rank offers a promotion move', () => {
  const state = stateFromLayout(
    ['.......k', '....P...', '........', '........', '........', '........', '........', 'K.......'],
    { turn: 'w' }
  );

  const moves = generateLegalMoves(state, algebraicToSquare('e7'));
  const toE8 = moves.find((m) => m.to.row === algebraicToSquare('e8').row && m.to.col === algebraicToSquare('e8').col);
  assert.ok(toE8, 'expected a legal move to e8');
  assert.equal(toE8.promotion, 'q');
});

test('underpromotion to a knight replaces the pawn with the chosen piece', () => {
  const state = stateFromLayout(
    ['.......k', '....P...', '........', '........', '........', '........', '........', 'K.......'],
    { turn: 'w' }
  );

  const next = playMove(state, 'e7', 'e8', 'n');
  const dest = algebraicToSquare('e8');
  assert.deepEqual(next.board[dest.row][dest.col], { type: 'n', color: 'w' });
});

test('capturing into the last rank also triggers promotion', () => {
  const state = stateFromLayout(
    ['...r.k..', '....P...', '........', '........', '........', '........', '........', 'K.......'],
    { turn: 'w' }
  );

  const next = playMove(state, 'e7', 'd8', 'q');
  const dest = algebraicToSquare('d8');
  assert.deepEqual(next.board[dest.row][dest.col], { type: 'q', color: 'w' });
  assert.deepEqual(next.capturedPieces.b, ['r']);
});
