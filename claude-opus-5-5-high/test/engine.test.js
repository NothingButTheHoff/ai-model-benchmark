import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLACK, GAME_STATUS, KING, KNIGHT, PAWN, QUEEN, ROOK, WHITE } from '../src/engine/constants.js';
import { createInitialState, makeMove } from '../src/engine/game.js';
import { getLegalMoves } from '../src/engine/moves.js';
import { isValidGameState } from '../src/engine/validation.js';
import { perft, playMoves, square, stateFromFen } from './helpers.js';

const pieceAt = (state, name) => {
  const { row, col } = square(name);
  return state.board[row][col];
};

const targetsOf = (state, from) =>
  getLegalMoves(state, square(from)).map(({ to }) => `${'abcdefgh'[to.col]}${8 - to.row}`).sort();

test('perft from the starting position', () => {
  const state = createInitialState();
  assert.deepEqual([1, 2, 3].map((depth) => perft(state, depth)), [20, 400, 8902]);
});

test('perft on "kiwipete" covers castling, en passant and promotion', () => {
  const state = stateFromFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -');
  assert.deepEqual([1, 2, 3].map((depth) => perft(state, depth)), [48, 2039, 97862]);
});

test('perft on endgame position with en passant pins', () => {
  const state = stateFromFen('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -');
  assert.deepEqual([1, 2, 3, 4].map((depth) => perft(state, depth)), [14, 191, 2812, 43238]);
});

test('perft on promotion-heavy position', () => {
  const state = stateFromFen('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq -');
  assert.deepEqual([1, 2, 3].map((depth) => perft(state, depth)), [6, 264, 9467]);
});

test('en passant captures the passed pawn and records it', () => {
  const state = playMoves(createInitialState(), ['e2e4', 'a7a6', 'e4e5', 'd7d5', 'e5d6']);
  assert.equal(pieceAt(state, 'd5'), null);
  assert.deepEqual(pieceAt(state, 'd6'), { type: PAWN, color: WHITE });
  assert.deepEqual(state.capturedBy[WHITE], [PAWN]);
});

test('en passant is only available immediately after the double step', () => {
  const state = playMoves(createInitialState(), ['e2e4', 'a7a6', 'e4e5', 'd7d5', 'h2h3', 'h7h6']);
  assert.ok(!targetsOf(state, 'e5').includes('d6'));
});

test('castling moves both king and rook on each side', () => {
  const state = stateFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq -');
  const kingSide = playMoves(state, ['e1g1']);
  assert.deepEqual(pieceAt(kingSide, 'f1'), { type: ROOK, color: WHITE });
  assert.equal(pieceAt(kingSide, 'h1'), null);

  const queenSide = playMoves(kingSide, ['e8c8']);
  assert.deepEqual(pieceAt(queenSide, 'c8'), { type: KING, color: BLACK });
  assert.deepEqual(pieceAt(queenSide, 'd8'), { type: ROOK, color: BLACK });
});

test('castling is forbidden out of, through, or into check', () => {
  assert.deepEqual(targetsOf(stateFromFen('4k3/4r3/8/8/8/8/8/R3K2R w KQ -'), 'e1').filter((t) => ['c1', 'g1'].includes(t)), []);
  assert.deepEqual(targetsOf(stateFromFen('4k3/5r2/8/8/8/8/8/R3K2R w KQ -'), 'e1').filter((t) => ['c1', 'g1'].includes(t)), ['c1']);
  assert.deepEqual(targetsOf(stateFromFen('4k3/6r1/8/8/8/8/8/R3K2R w KQ -'), 'e1').filter((t) => ['c1', 'g1'].includes(t)), ['c1']);
  assert.deepEqual(targetsOf(stateFromFen('4k3/1r6/8/8/8/8/8/R3K2R w KQ -'), 'e1').filter((t) => ['c1', 'g1'].includes(t)), ['c1', 'g1']);
});

test('moving or losing a rook removes the matching castling right', () => {
  const state = playMoves(stateFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq -'), ['h1h8']);
  assert.deepEqual(state.castlingRights[WHITE], { kingSide: false, queenSide: true });
  assert.deepEqual(state.castlingRights[BLACK], { kingSide: false, queenSide: true });
});

test('promotion requires a valid piece choice', () => {
  const state = stateFromFen('8/P6k/8/8/8/8/8/K7 w - -');
  assert.equal(makeMove(state, square('a7'), square('a8')), null);
  assert.equal(makeMove(state, square('a7'), square('a8'), KING), null);
  assert.deepEqual(pieceAt(playMoves(state, ['a7a8n']), 'a8'), { type: KNIGHT, color: WHITE });
  assert.deepEqual(pieceAt(playMoves(state, ['a7a8q']), 'a8'), { type: QUEEN, color: WHITE });
});

test('detects checkmate and blocks further moves', () => {
  const state = playMoves(createInitialState(), ['f2f3', 'e7e5', 'g2g4', 'd8h4']);
  assert.equal(state.status, GAME_STATUS.CHECKMATE);
  assert.equal(makeMove(state, square('a2'), square('a3')), null);
});

test('detects stalemate', () => {
  assert.equal(stateFromFen('7k/5Q2/6K1/8/8/8/8/8 b - -').status, GAME_STATUS.STALEMATE);
});

test('detects check', () => {
  assert.equal(playMoves(createInitialState(), ['e2e4', 'f7f6', 'd1h5']).status, GAME_STATUS.CHECK);
});

test('rejects invalid input without throwing', () => {
  const state = createInitialState();
  assert.equal(makeMove(state, square('e7'), square('e5')), null);
  assert.equal(makeMove(state, { row: -1, col: 99 }, square('e4')), null);
  assert.equal(makeMove(state, square('e4'), square('e5')), null);
  assert.equal(makeMove(state, null, square('e5')), null);
});

test('validates persisted state shape', () => {
  assert.ok(isValidGameState(JSON.parse(JSON.stringify(createInitialState()))));
  assert.ok(!isValidGameState(null));
  assert.ok(!isValidGameState({ ...createInitialState(), turn: 'x' }));
  assert.ok(!isValidGameState({ ...createInitialState(), board: [[]] }));
});
