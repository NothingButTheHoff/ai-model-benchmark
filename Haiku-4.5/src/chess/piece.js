export const PIECE_TYPES = {
  PAWN: 'pawn',
  KNIGHT: 'knight',
  BISHOP: 'bishop',
  ROOK: 'rook',
  QUEEN: 'queen',
  KING: 'king'
};

export const COLORS = {
  WHITE: 'white',
  BLACK: 'black'
};

export class Piece {
  constructor(type, color) {
    this.type = type;
    this.color = color;
  }

  clone() {
    return new Piece(this.type, this.color);
  }
}
