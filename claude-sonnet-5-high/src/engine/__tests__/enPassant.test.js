import { test } from 'node:test';
import assert from 'node:assert/strict';
import { algebraicToSquare } from '../board.js';
import { stateFromLayout, playMove } from './testUtils.js';

test('pawn can capture en passant immediately after an opposing double push', () => {
  const state = stateFromLayout(
    ['....k...', '........', '........', '...pP...', '........', '........', '........', '....K...'],
    { turn: 'w', enPassantTarget: algebraicToSquare('d6') }
  );

  const next = playMove(state, 'e5', 'd6');

  const captured = algebraicToSquare('d5');
  assert.equal(next.board[captured.row][captured.col], null);
  const dest = algebraicToSquare('d6');
  assert.deepEqual(next.board[dest.row][dest.col], { type: 'p', color: 'w' });
  assert.deepEqual(next.capturedPieces.b, ['p']);
});

test('en passant window closes after one move', () => {
  const state = stateFromLayout(
    ['....k...', '........', '........', '...pP...', '........', '........', '........', '....K...'],
    { turn: 'w', enPassantTarget: algebraicToSquare('d6') }
  );

  const next = playMove(state, 'e1', 'd1');
  assert.equal(next.enPassantTarget, null);
});
