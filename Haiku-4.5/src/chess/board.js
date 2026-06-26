import { Piece, PIECE_TYPES, COLORS } from './piece';

export class Board {
  constructor() {
    this.squares = Array(64).fill(null);
    this.initialize();
  }

  initialize() {
    // Clear board
    this.squares = Array(64).fill(null);

    // Place pawns
    for (let i = 0; i < 8; i++) {
      this.squares[8 + i] = new Piece(PIECE_TYPES.PAWN, COLORS.WHITE);
      this.squares[48 + i] = new Piece(PIECE_TYPES.PAWN, COLORS.BLACK);
    }

    // Place back ranks
    const backRank = [
      PIECE_TYPES.ROOK,
      PIECE_TYPES.KNIGHT,
      PIECE_TYPES.BISHOP,
      PIECE_TYPES.QUEEN,
      PIECE_TYPES.KING,
      PIECE_TYPES.BISHOP,
      PIECE_TYPES.KNIGHT,
      PIECE_TYPES.ROOK
    ];

    for (let i = 0; i < 8; i++) {
      this.squares[i] = new Piece(backRank[i], COLORS.WHITE);
      this.squares[56 + i] = new Piece(backRank[i], COLORS.BLACK);
    }
  }

  getSquare(row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) return null;
    return this.squares[row * 8 + col];
  }

  setSquare(row, col, piece) {
    if (row < 0 || row > 7 || col < 0 || col > 7) return;
    this.squares[row * 8 + col] = piece;
  }

  clone() {
    const newBoard = new Board();
    newBoard.squares = this.squares.map(p => p ? p.clone() : null);
    return newBoard;
  }
}
