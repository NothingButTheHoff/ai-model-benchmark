import assert from 'node:assert/strict';
import {
  BLACK,
  WHITE,
  applyMove,
  createCustomState,
  createEmptyBoard,
  createInitialState,
  getLegalMoves,
} from './chessEngine.js';

const at = (square) => ({
  col: square.charCodeAt(0) - 97,
  row: 8 - Number(square[1]),
});

function move(state, from, to, promotion = null) {
  return applyMove(state, at(from), at(to), promotion);
}

function piece(type, color) {
  return { type, color };
}

function movesFor(state, square) {
  const coord = at(square);
  return getLegalMoves(state, coord.row, coord.col).map((legalMove) => legalMove.to);
}

function hasMove(state, from, to) {
  const target = at(to);
  return movesFor(state, from).some((moveTarget) => moveTarget.row === target.row && moveTarget.col === target.col);
}

function legalMoveCount(state) {
  let count = 0;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      count += getLegalMoves(state, row, col).length;
    }
  }
  return count;
}

function boardWithKings() {
  const board = createEmptyBoard();
  board[7][4] = piece('k', WHITE);
  board[0][4] = piece('k', BLACK);
  return board;
}

{
  const state = createInitialState();
  assert.equal(legalMoveCount(state), 20, 'initial position has 20 legal moves');
  assert.equal(state.status.message, 'White to move.');
}

{
  let state = createInitialState();
  state = move(state, 'e2', 'e4');
  state = move(state, 'a7', 'a6');
  state = move(state, 'e4', 'e5');
  state = move(state, 'd7', 'd5');

  assert.equal(hasMove(state, 'e5', 'd6'), true, 'en passant target is legal');
  state = move(state, 'e5', 'd6');

  const d6 = at('d6');
  const d5 = at('d5');
  assert.deepEqual(state.board[d6.row][d6.col], piece('p', WHITE));
  assert.equal(state.board[d5.row][d5.col], null);
  assert.deepEqual(state.captured.w, [piece('p', BLACK)]);
}

{
  const board = boardWithKings();
  board[7][0] = piece('r', WHITE);
  board[7][7] = piece('r', WHITE);
  board[0][0] = piece('r', BLACK);
  board[0][7] = piece('r', BLACK);
  let state = createCustomState({
    board,
    castling: { w: { k: true, q: true }, b: { k: true, q: true } },
  });

  assert.equal(hasMove(state, 'e1', 'g1'), true, 'white kingside castle is legal');
  assert.equal(hasMove(state, 'e1', 'c1'), true, 'white queenside castle is legal');

  state = move(state, 'e1', 'g1');
  assert.deepEqual(state.board[7][6], piece('k', WHITE));
  assert.deepEqual(state.board[7][5], piece('r', WHITE));
  assert.equal(state.castling.w.k, false);
  assert.equal(state.castling.w.q, false);
}

{
  const board = boardWithKings();
  board[7][7] = piece('r', WHITE);
  board[5][5] = piece('r', BLACK);
  const state = createCustomState({
    board,
    castling: { w: { k: true, q: false }, b: { k: false, q: false } },
  });

  assert.equal(hasMove(state, 'e1', 'g1'), false, 'castling through an attacked square is illegal');
}

{
  const board = boardWithKings();
  board[1][0] = piece('p', WHITE);
  let state = createCustomState({ board });
  state = move(state, 'a7', 'a8', 'n');
  assert.deepEqual(state.board[0][0], piece('n', WHITE));
}

{
  let state = createInitialState();
  state = move(state, 'f2', 'f3');
  state = move(state, 'e7', 'e5');
  state = move(state, 'g2', 'g4');
  state = move(state, 'd8', 'h4');

  assert.equal(state.status.checkmate, true, 'fools mate is checkmate');
  assert.equal(state.status.winner, BLACK);
}

{
  const board = createEmptyBoard();
  board[0][0] = piece('k', BLACK);
  board[2][2] = piece('k', WHITE);
  board[2][1] = piece('q', WHITE);
  const state = createCustomState({ board, turn: BLACK });

  assert.equal(state.status.stalemate, true, 'classic corner stalemate is detected');
  assert.equal(state.status.winner, null);
}

console.log('All chess engine tests passed.');
