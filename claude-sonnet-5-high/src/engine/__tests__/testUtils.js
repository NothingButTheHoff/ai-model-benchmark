import { algebraicToSquare } from '../board.js';
import { generateLegalMoves } from '../moveGen.js';
import { applyMove } from '../game.js';

// Builds a game state from 8 row strings (rank 8 first), where uppercase =
// white, lowercase = black, '.' = empty. Piece letters follow the standard
// p/n/b/r/q/k convention. Test-only helper for constructing edge-case
// positions without playing out full games.
export function stateFromLayout(rows, overrides = {}) {
  const board = rows.map((rowStr) =>
    rowStr.split('').map((ch) => {
      if (ch === '.') return null;
      return { type: ch.toLowerCase(), color: ch === ch.toUpperCase() ? 'w' : 'b' };
    })
  );

  return {
    board,
    turn: 'w',
    castlingRights: {
      w: { kingSide: false, queenSide: false },
      b: { kingSide: false, queenSide: false },
    },
    enPassantTarget: null,
    capturedPieces: { w: [], b: [] },
    status: 'ongoing',
    winner: null,
    lastMove: null,
    ...overrides,
  };
}

// Plays an algebraic from/to move against `state`, throwing if illegal.
// Optionally pass a promotion piece type for pawn-promotion moves.
export function playMove(state, from, to, promotion) {
  const fromSq = algebraicToSquare(from);
  const toSq = algebraicToSquare(to);
  const legal = generateLegalMoves(state, fromSq);
  const found = legal.find((mv) => mv.to.row === toSq.row && mv.to.col === toSq.col);
  if (!found) {
    throw new Error(`Illegal move ${from}-${to}`);
  }
  const finalMove = promotion ? { ...found, promotion } : found;
  return applyMove(state, finalMove);
}
