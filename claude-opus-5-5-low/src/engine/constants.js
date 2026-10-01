export const WHITE = 'w';
export const BLACK = 'b';

export const PAWN = 'p';
export const KNIGHT = 'n';
export const BISHOP = 'b';
export const ROOK = 'r';
export const QUEEN = 'q';
export const KING = 'k';

export const PROMOTION_PIECES = [QUEEN, ROOK, BISHOP, KNIGHT];

export const GAME_STATUS = {
  ACTIVE: 'active',
  CHECK: 'check',
  CHECKMATE: 'checkmate',
  STALEMATE: 'stalemate',
};

export const BACK_RANK = [ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK];

export const opponent = (color) => (color === WHITE ? BLACK : WHITE);
