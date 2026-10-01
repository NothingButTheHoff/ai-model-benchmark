import { BISHOP, KING, KNIGHT, PAWN, QUEEN, ROOK, WHITE } from '../engine/index.js';

const TEXT_PRESENTATION = '\uFE0E';

const GLYPHS = {
  [KING]: '♚',
  [QUEEN]: '♛',
  [ROOK]: '♜',
  [BISHOP]: '♝',
  [KNIGHT]: '♞',
  [PAWN]: '♟',
};

const NAMES = {
  [KING]: 'king',
  [QUEEN]: 'queen',
  [ROOK]: 'rook',
  [BISHOP]: 'bishop',
  [KNIGHT]: 'knight',
  [PAWN]: 'pawn',
};

export const colorName = (color) => (color === WHITE ? 'White' : 'Black');

export const pieceLabel = ({ type, color }) => `${colorName(color)} ${NAMES[type]}`;

export function Piece({ type, color, className = '' }) {
  return (
    <span className={`piece piece--${color === WHITE ? 'white' : 'black'} ${className}`} aria-hidden="true">
      {GLYPHS[type]}
      {TEXT_PRESENTATION}
    </span>
  );
}
