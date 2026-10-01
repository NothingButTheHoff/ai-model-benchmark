import { BLACK, PROMOTION_TYPES, WHITE } from '../src/engine/constants.js';
import { computeStatus, makeMove } from '../src/engine/game.js';
import { getAllLegalMoves } from '../src/engine/moves.js';

const FILES = 'abcdefgh';

export const square = (name) => ({ row: 8 - Number(name[1]), col: FILES.indexOf(name[0]) });

export function stateFromFen(fen) {
  const [placement, turn, castling, enPassant] = fen.split(' ');
  const board = placement.split('/').map((rank) => {
    const row = [];
    for (const char of rank) {
      if (/\d/.test(char)) row.push(...Array(Number(char)).fill(null));
      else row.push({ type: char.toLowerCase(), color: char === char.toUpperCase() ? WHITE : BLACK });
    }
    return row;
  });

  const state = {
    board,
    turn: turn === 'w' ? WHITE : BLACK,
    castlingRights: {
      [WHITE]: { kingSide: castling.includes('K'), queenSide: castling.includes('Q') },
      [BLACK]: { kingSide: castling.includes('k'), queenSide: castling.includes('q') },
    },
    enPassantTarget: enPassant === '-' ? null : square(enPassant),
    capturedBy: { [WHITE]: [], [BLACK]: [] },
    lastMove: null,
  };
  return { ...state, status: computeStatus(state) };
}

export function playMoves(state, moves) {
  return moves.reduce((current, notation) => {
    const next = makeMove(current, square(notation.slice(0, 2)), square(notation.slice(2, 4)), notation[4]);
    if (!next) throw new Error(`Illegal move in test sequence: ${notation}`);
    return next;
  }, state);
}

export function perft(state, depth) {
  if (depth === 0) return 1;
  let nodes = 0;
  for (const move of getAllLegalMoves(state)) {
    const promotions = move.isPromotion ? PROMOTION_TYPES : [undefined];
    for (const promotion of promotions) {
      nodes += perft(makeMove(state, move.from, move.to, promotion), depth - 1);
    }
  }
  return nodes;
}
