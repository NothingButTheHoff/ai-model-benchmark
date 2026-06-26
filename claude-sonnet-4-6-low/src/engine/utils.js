export const inBounds = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

export const cloneBoard = (board) => board.map(row => row.map(cell => cell ? { ...cell } : null));

export const cloneState = (state) => ({
  ...state,
  board: cloneBoard(state.board),
  castlingRights: {
    white: { ...state.castlingRights.white },
    black: { ...state.castlingRights.black },
  },
  capturedPieces: {
    white: [...state.capturedPieces.white],
    black: [...state.capturedPieces.black],
  },
  enPassantTarget: state.enPassantTarget ? { ...state.enPassantTarget } : null,
  promotionPending: state.promotionPending ? { ...state.promotionPending } : null,
});

export const opponent = (color) => color === 'white' ? 'black' : 'white';
