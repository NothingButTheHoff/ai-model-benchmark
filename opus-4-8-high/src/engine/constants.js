// Core constants shared across the chess engine.

export const WHITE = 'w';
export const BLACK = 'b';

// Piece type codes (lowercase, color stored separately).
export const PAWN = 'p';
export const KNIGHT = 'n';
export const BISHOP = 'b';
export const ROOK = 'r';
export const QUEEN = 'q';
export const KING = 'k';

export const BOARD_SIZE = 8;

// Board orientation used everywhere in the engine:
//   row 0 == rank 8 (Black's back rank, top of the board)
//   row 7 == rank 1 (White's back rank, bottom of the board)
//   col 0 == file a, col 7 == file h
//
// White pawns move toward smaller row indices ("up"), Black pawns toward
// larger row indices ("down").

export function opponent(color) {
  return color === WHITE ? BLACK : WHITE;
}
