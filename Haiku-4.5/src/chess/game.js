import { Board } from './board';
import { Piece, PIECE_TYPES, COLORS } from './piece';
import { getPseudoLegalMoves, getKingMovesWithCastling } from './moves';

export class Game {
  constructor() {
    this.board = new Board();
    this.turn = COLORS.WHITE;
    this.moveHistory = [];
    this.enPassantTarget = null;
    this.castlingRights = {
      [COLORS.WHITE]: { kingside: true, queenside: true },
      [COLORS.BLACK]: { kingside: true, queenside: true }
    };
  }

  getValidMoves(row, col) {
    const piece = this.board.getSquare(row, col);
    let pseudoLegal;

    if (piece && piece.type === PIECE_TYPES.KING) {
      pseudoLegal = getKingMovesWithCastling(this.board, row, col, piece.color, this.castlingRights);
    } else {
      pseudoLegal = getPseudoLegalMoves(this.board, row, col, this.enPassantTarget);
    }

    return pseudoLegal.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col));
  }

  makeMove(fromRow, fromCol, toRow, toCol, promotion = null) {
    const piece = this.board.getSquare(fromRow, fromCol);
    if (!piece || piece.color !== this.turn) return false;

    const validMoves = this.getValidMoves(fromRow, fromCol);
    if (!validMoves.some(m => m.row === toRow && m.col === toCol)) return false;

    // Handle capture
    const captured = this.board.getSquare(toRow, toCol);

    // Handle pawn special moves
    if (piece.type === PIECE_TYPES.PAWN) {
      // En passant
      if (toCol !== fromCol && !captured && toCol === this.enPassantTarget) {
        this.board.setSquare(fromRow, toCol, null);
      }

      // Double pawn push - set en passant target
      if (Math.abs(toRow - fromRow) === 2) {
        this.enPassantTarget = toCol;
      } else {
        this.enPassantTarget = null;
      }

      // Promotion
      if (toRow === (piece.color === COLORS.WHITE ? 0 : 7)) {
        const promotionType = promotion || PIECE_TYPES.QUEEN;
        this.board.setSquare(toRow, toCol, new Piece(promotionType, piece.color));
        this.board.setSquare(fromRow, fromCol, null);
      } else {
        this.board.setSquare(toRow, toCol, piece);
        this.board.setSquare(fromRow, fromCol, null);
      }
    } else {
      this.enPassantTarget = null;

      // Handle castling
      if (piece.type === PIECE_TYPES.KING) {
        if (Math.abs(toCol - fromCol) === 2) {
          // Move rook
          const rookCol = toCol > fromCol ? 7 : 0;
          const newRookCol = toCol > fromCol ? 5 : 3;
          const rook = this.board.getSquare(fromRow, rookCol);
          this.board.setSquare(fromRow, newRookCol, rook);
          this.board.setSquare(fromRow, rookCol, null);
        }
        this.castlingRights[piece.color].kingside = false;
        this.castlingRights[piece.color].queenside = false;
      }

      // Update castling rights
      if (piece.type === PIECE_TYPES.ROOK) {
        if (fromCol === 0) this.castlingRights[piece.color].queenside = false;
        if (fromCol === 7) this.castlingRights[piece.color].kingside = false;
      }
      if (captured && captured.type === PIECE_TYPES.ROOK) {
        if (toCol === 0) this.castlingRights[captured.color].queenside = false;
        if (toCol === 7) this.castlingRights[captured.color].kingside = false;
      }

      this.board.setSquare(toRow, toCol, piece);
      this.board.setSquare(fromRow, fromCol, null);
    }

    this.moveHistory.push({ fromRow, fromCol, toRow, toCol, captured, promotion });
    this.turn = this.turn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    return true;
  }

  wouldBeInCheck(fromRow, fromCol, toRow, toCol) {
    const boardCopy = this.board.clone();
    const piece = boardCopy.getSquare(fromRow, fromCol);
    boardCopy.setSquare(toRow, toCol, piece);
    boardCopy.setSquare(fromRow, fromCol, null);

    // Handle en passant removal
    if (piece.type === PIECE_TYPES.PAWN && toCol !== fromCol && !this.board.getSquare(toRow, toCol)) {
      boardCopy.setSquare(fromRow, toCol, null);
    }

    return this.isInCheck(boardCopy, piece.color);
  }

  isInCheck(board, color) {
    let kingRow = -1, kingCol = -1;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getSquare(r, c);
        if (piece && piece.type === PIECE_TYPES.KING && piece.color === color) {
          kingRow = r;
          kingCol = c;
        }
      }
    }

    if (kingRow === -1) return false;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getSquare(r, c);
        if (piece && piece.color !== color) {
          const moves = getPseudoLegalMoves(board, r, c, this.enPassantTarget);
          if (moves.some(m => m.row === kingRow && m.col === kingCol)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  hasLegalMoves(color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board.getSquare(r, c);
        if (piece && piece.color === color) {
          if (this.getValidMoves(r, c).length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  getGameStatus() {
    const inCheck = this.isInCheck(this.board, this.turn);
    const hasLegal = this.hasLegalMoves(this.turn);

    if (!hasLegal) {
      return inCheck ? 'checkmate' : 'stalemate';
    }
    if (inCheck) return 'check';
    return 'ongoing';
  }

  reset() {
    this.board = new Board();
    this.turn = COLORS.WHITE;
    this.moveHistory = [];
    this.enPassantTarget = null;
    this.castlingRights = {
      [COLORS.WHITE]: { kingside: true, queenside: true },
      [COLORS.BLACK]: { kingside: true, queenside: true }
    };
  }

  toJSON() {
    return {
      board: this.board.squares.map(p => p ? { type: p.type, color: p.color } : null),
      turn: this.turn,
      moveHistory: this.moveHistory,
      enPassantTarget: this.enPassantTarget,
      castlingRights: this.castlingRights
    };
  }

  fromJSON(data) {
    this.board.squares = data.board.map(p => p ? new Piece(p.type, p.color) : null);
    this.turn = data.turn;
    this.moveHistory = data.moveHistory;
    this.enPassantTarget = data.enPassantTarget;
    this.castlingRights = data.castlingRights;
  }
}
