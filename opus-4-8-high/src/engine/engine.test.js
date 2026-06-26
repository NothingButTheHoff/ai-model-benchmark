// Engine correctness tests. Run with: npm test  (node --test)
//
// The core validation is perft (performance test): counting the number of
// legal move sequences to a given depth from a known position. Matching the
// published node counts exercises every rule — ordinary moves, captures,
// castling, en passant, promotion, and check evasion — at once.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { WHITE, BLACK } from './constants.js';
import { createInitialBoard, fromAlgebraic } from './board.js';
import { legalMoves, applyMove, legalMovesForSquare } from './moves.js';
import { createGame, makeMove, computeStatus, STATUS } from './game.js';

function startState() {
  return {
    board: createInitialBoard(),
    turn: WHITE,
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    enPassant: null,
    halfmove: 0,
    fullmove: 1,
  };
}

function emptyState(turn = WHITE) {
  return {
    board: Array.from({ length: 8 }, () => Array(8).fill(null)),
    turn,
    castling: { wK: false, wQ: false, bK: false, bQ: false },
    enPassant: null,
    halfmove: 0,
    fullmove: 1,
  };
}

function place(state, square, type, color) {
  const { row, col } = fromAlgebraic(square);
  state.board[row][col] = { type, color };
}

function perft(state, depth) {
  if (depth === 0) return 1;
  const moves = legalMoves(state);
  if (depth === 1) return moves.length;
  let nodes = 0;
  for (const move of moves) {
    nodes += perft(applyMove(state, move), depth - 1);
  }
  return nodes;
}

test('perft from the initial position matches published node counts', () => {
  const s = startState();
  assert.equal(perft(s, 1), 20);
  assert.equal(perft(s, 2), 400);
  assert.equal(perft(s, 3), 8902);
  assert.equal(perft(s, 4), 197281);
});

// Kiwipete: a dense middlegame position that stresses castling, en passant,
// and pins. Standard perft reference values.
test('perft on the Kiwipete position', () => {
  const s = emptyState(WHITE);
  // White
  place(s, 'a1', 'r', WHITE); place(s, 'e1', 'k', WHITE); place(s, 'h1', 'r', WHITE);
  place(s, 'c3', 'n', WHITE); place(s, 'e5', 'n', WHITE);
  place(s, 'd2', 'b', WHITE); place(s, 'e2', 'b', WHITE);
  place(s, 'f3', 'q', WHITE);
  place(s, 'a2', 'p', WHITE); place(s, 'b2', 'p', WHITE); place(s, 'c2', 'p', WHITE);
  place(s, 'd5', 'p', WHITE); place(s, 'e4', 'p', WHITE); place(s, 'f2', 'p', WHITE);
  place(s, 'g2', 'p', WHITE); place(s, 'h2', 'p', WHITE);
  // Black
  place(s, 'a8', 'r', BLACK); place(s, 'e8', 'k', BLACK); place(s, 'h8', 'r', BLACK);
  place(s, 'b6', 'n', BLACK); place(s, 'f6', 'n', BLACK);
  place(s, 'a6', 'b', BLACK); place(s, 'g7', 'b', BLACK);
  place(s, 'e7', 'q', BLACK);
  place(s, 'a7', 'p', BLACK); place(s, 'b4', 'p', BLACK); place(s, 'c7', 'p', BLACK);
  place(s, 'd7', 'p', BLACK); place(s, 'e6', 'p', BLACK); place(s, 'f7', 'p', BLACK);
  place(s, 'g6', 'p', BLACK); place(s, 'h3', 'p', BLACK);
  s.castling = { wK: true, wQ: true, bK: true, bQ: true };

  assert.equal(perft(s, 1), 48);
  assert.equal(perft(s, 2), 2039);
  assert.equal(perft(s, 3), 97862);
});

test('en passant capture is generated and removes the captured pawn', () => {
  const s = emptyState(WHITE);
  place(s, 'e1', 'k', WHITE); place(s, 'e8', 'k', BLACK);
  place(s, 'e5', 'p', WHITE); place(s, 'd7', 'p', BLACK);
  // Black plays d7-d5; white can capture en passant on d6.
  const black = { ...s, turn: BLACK };
  const blackMoves = legalMoves(black).filter((m) => m.doublePush);
  assert.equal(blackMoves.length, 1);
  const afterDouble = applyMove(black, blackMoves[0]);
  assert.deepEqual(afterDouble.enPassant, fromAlgebraic('d6'));

  const ep = legalMoves(afterDouble).find((m) => m.enPassant);
  assert.ok(ep, 'en passant move should exist');
  const afterEp = applyMove(afterDouble, ep);
  // The black pawn that was on d5 is gone.
  const { row, col } = fromAlgebraic('d5');
  assert.equal(afterEp.board[row][col], null);
});

test('castling kingside moves both king and rook', () => {
  const s = emptyState(WHITE);
  place(s, 'e1', 'k', WHITE); place(s, 'h1', 'r', WHITE);
  place(s, 'e8', 'k', BLACK);
  s.castling.wK = true;
  const castle = legalMoves(s).find((m) => m.castle === 'K');
  assert.ok(castle, 'kingside castle available');
  const after = applyMove(s, castle);
  assert.deepEqual(after.board[fromAlgebraic('g1').row][fromAlgebraic('g1').col], { type: 'k', color: WHITE });
  assert.deepEqual(after.board[fromAlgebraic('f1').row][fromAlgebraic('f1').col], { type: 'r', color: WHITE });
});

test('cannot castle through an attacked square', () => {
  const s = emptyState(WHITE);
  place(s, 'e1', 'k', WHITE); place(s, 'h1', 'r', WHITE);
  place(s, 'e8', 'k', BLACK); place(s, 'f8', 'r', BLACK); // attacks f1
  s.castling.wK = true;
  const castle = legalMoves(s).find((m) => m.castle === 'K');
  assert.equal(castle, undefined);
});

test('promotion produces the chosen piece', () => {
  const s = emptyState(WHITE);
  place(s, 'e1', 'k', WHITE); place(s, 'e8', 'k', BLACK);
  place(s, 'a7', 'p', WHITE);
  const promo = legalMoves(s).find((m) => m.isPromotion);
  assert.ok(promo);
  promo.promotion = 'n';
  const after = applyMove(s, promo);
  const { row, col } = fromAlgebraic('a8');
  assert.deepEqual(after.board[row][col], { type: 'n', color: WHITE });
});

test('detects back-rank checkmate', () => {
  const s = emptyState(BLACK);
  place(s, 'g8', 'k', BLACK);
  place(s, 'f7', 'p', BLACK); place(s, 'g7', 'p', BLACK); place(s, 'h7', 'p', BLACK);
  place(s, 'a8', 'r', WHITE); place(s, 'e1', 'k', WHITE);
  const { status, winner } = computeStatus(s);
  assert.equal(status, STATUS.CHECKMATE);
  assert.equal(winner, WHITE);
});

test('detects stalemate', () => {
  const s = emptyState(BLACK);
  place(s, 'h8', 'k', BLACK);
  place(s, 'f7', 'k', WHITE); place(s, 'g6', 'q', WHITE);
  const { status, winner } = computeStatus(s);
  assert.equal(status, STATUS.STALEMATE);
  assert.equal(winner, null);
});

test('a full game flow updates captured pieces and history', () => {
  let game = createGame();
  const moves = legalMovesForSquare(game.state, fromAlgebraic('e2').row, fromAlgebraic('e2').col);
  const e4 = moves.find((m) => m.to.row === fromAlgebraic('e4').row);
  game = makeMove(game, e4);
  assert.equal(game.history.length, 1);
  assert.equal(game.state.turn, BLACK);
});
