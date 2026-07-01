import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateLegalMoves } from '../moveGen.js';
import { algebraicToSquare } from '../board.js';
import { stateFromLayout } from './testUtils.js';

const bothSidesRights = {
  w: { kingSide: true, queenSide: true },
  b: { kingSide: false, queenSide: false },
};

function castleTargets(state, kingAlg = 'e1') {
  const moves = generateLegalMoves(state, algebraicToSquare(kingAlg));
  return moves.filter((m) => m.isCastle).map((m) => m.isCastle);
}

test('king can castle both sides when squares are empty and unattacked', () => {
  const state = stateFromLayout(
    ['....k...', '........', '........', '........', '........', '........', '........', 'R...K..R'],
    { turn: 'w', castlingRights: bothSidesRights }
  );

  assert.deepEqual(castleTargets(state).sort(), ['K', 'Q']);
});

test('king cannot castle while currently in check', () => {
  const state = stateFromLayout(
    ['....r...', '........', '........', '........', '........', '........', '........', 'R...K..R'],
    { turn: 'w', castlingRights: bothSidesRights }
  );

  assert.deepEqual(castleTargets(state), []);
});

test('king cannot castle through an attacked square', () => {
  // Black rook on the f-file attacks f1, the square the king must pass
  // through to castle kingside. Queenside remains legal.
  const state = stateFromLayout(
    ['.....r..', '........', '........', '........', '........', '........', '........', 'R...K..R'],
    { turn: 'w', castlingRights: bothSidesRights }
  );

  assert.deepEqual(castleTargets(state), ['Q']);
});

test('king cannot castle into an attacked square', () => {
  // Black rook on the g-file attacks g1, the kingside castling destination.
  const state = stateFromLayout(
    ['......r.', '........', '........', '........', '........', '........', '........', 'R...K..R'],
    { turn: 'w', castlingRights: bothSidesRights }
  );

  assert.deepEqual(castleTargets(state), ['Q']);
});

test('castling rights are respected once revoked', () => {
  const state = stateFromLayout(
    ['....k...', '........', '........', '........', '........', '........', '........', 'R...K..R'],
    {
      turn: 'w',
      castlingRights: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    }
  );

  assert.deepEqual(castleTargets(state), []);
});
