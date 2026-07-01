import { WHITE, BLACK, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING } from '../engine/constants';

const SYMBOLS = {
  [WHITE]: { [KING]: '♔', [QUEEN]: '♕', [ROOK]: '♖', [BISHOP]: '♗', [KNIGHT]: '♘', [PAWN]: '♙' },
  [BLACK]: { [KING]: '♚', [QUEEN]: '♛', [ROOK]: '♜', [BISHOP]: '♝', [KNIGHT]: '♞', [PAWN]: '♟' },
};

export function pieceSymbol(piece) {
  if (!piece) return '';
  return SYMBOLS[piece.color][piece.type];
}

export const PIECE_NAMES = {
  [QUEEN]: 'Queen',
  [ROOK]: 'Rook',
  [BISHOP]: 'Bishop',
  [KNIGHT]: 'Knight',
};
