export const COLORS = { WHITE: 'white', BLACK: 'black' };

export const PIECES = {
  KING: 'king',
  QUEEN: 'queen',
  ROOK: 'rook',
  BISHOP: 'bishop',
  KNIGHT: 'knight',
  PAWN: 'pawn',
};

export const INITIAL_BOARD = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));

  const backRank = [
    PIECES.ROOK, PIECES.KNIGHT, PIECES.BISHOP, PIECES.QUEEN,
    PIECES.KING, PIECES.BISHOP, PIECES.KNIGHT, PIECES.ROOK,
  ];

  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRank[col], color: COLORS.BLACK };
    board[1][col] = { type: PIECES.PAWN, color: COLORS.BLACK };
    board[6][col] = { type: PIECES.PAWN, color: COLORS.WHITE };
    board[7][col] = { type: backRank[col], color: COLORS.WHITE };
  }

  return board;
};

export const INITIAL_STATE = () => ({
  board: INITIAL_BOARD(),
  turn: COLORS.WHITE,
  castlingRights: {
    white: { kingside: true, queenside: true },
    black: { kingside: true, queenside: true },
  },
  enPassantTarget: null, // { row, col } of the square a pawn can capture into
  halfMoveClock: 0,
  fullMoveNumber: 1,
  capturedPieces: { white: [], black: [] },
  status: 'playing', // 'playing' | 'check' | 'checkmate' | 'stalemate'
  promotionPending: null, // { from, to } when promotion needed
});
