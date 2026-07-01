import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, computeStatus } from '../game.js';
import { getAllLegalMoves } from '../moveGen.js';
import { stateFromLayout, playMove } from './testUtils.js';

test('initial position has 20 legal moves for white', () => {
  const state = createGame();
  assert.equal(getAllLegalMoves(state).length, 20);
});

test("fool's mate delivers checkmate", () => {
  let state = createGame();
  state = playMove(state, 'f2', 'f3');
  state = playMove(state, 'e7', 'e5');
  state = playMove(state, 'g2', 'g4');
  state = playMove(state, 'd8', 'h4');

  assert.equal(state.status, 'checkmate');
  assert.equal(state.winner, 'b');
  assert.equal(getAllLegalMoves(state).length, 0);
});

test('classic king+queen vs king stalemate is detected, not checkmate', () => {
  const state = stateFromLayout(
    [
      'k.......',
      '..K.....',
      '.Q......',
      '........',
      '........',
      '........',
      '........',
      '........',
    ],
    { turn: 'b' }
  );

  const { status, winner } = computeStatus(state, 'w');
  assert.equal(status, 'stalemate');
  assert.equal(winner, null);
});

test('king in check with a legal escape reports "check", not checkmate', () => {
  // Queen on a6 checks the king along the a-file; b8 is a safe escape square.
  const state = stateFromLayout(
    [
      'k.......',
      '........',
      'Q.......',
      '........',
      '........',
      '........',
      '........',
      '.......K',
    ],
    { turn: 'b' }
  );

  const { status } = computeStatus(state, 'w');
  assert.equal(status, 'check');
});
