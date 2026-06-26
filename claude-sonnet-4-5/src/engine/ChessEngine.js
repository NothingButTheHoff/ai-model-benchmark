export const PIECES = {
  PAWN: 'pawn',
  ROOK: 'rook',
  KNIGHT: 'knight',
  BISHOP: 'bishop',
  QUEEN: 'queen',
  KING: 'king'
};

export const COLORS = {
  WHITE: 'white',
  BLACK: 'black'
};

export class ChessEngine {
  constructor(initialState = null) {
    if (initialState) {
      this.board = initialState.board;
      this.currentTurn = initialState.currentTurn;
      this.moveHistory = initialState.moveHistory || [];
      this.capturedPieces = initialState.capturedPieces || { white: [], black: [] };
      this.castlingRights = initialState.castlingRights || {
        white: { kingSide: true, queenSide: true },
        black: { kingSide: true, queenSide: true }
      };
      this.enPassantTarget = initialState.enPassantTarget || null;
    } else {
      this.board = this.createInitialBoard();
      this.currentTurn = COLORS.WHITE;
      this.moveHistory = [];
      this.capturedPieces = { white: [], black: [] };
      this.castlingRights = {
        white: { kingSide: true, queenSide: true },
        black: { kingSide: true, queenSide: true }
      };
      this.enPassantTarget = null;
    }
  }

  createInitialBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));

    const backRow = [PIECES.ROOK, PIECES.KNIGHT, PIECES.BISHOP, PIECES.QUEEN,
                     PIECES.KING, PIECES.BISHOP, PIECES.KNIGHT, PIECES.ROOK];

    for (let col = 0; col < 8; col++) {
      board[0][col] = { type: backRow[col], color: COLORS.BLACK };
      board[1][col] = { type: PIECES.PAWN, color: COLORS.BLACK };
      board[6][col] = { type: PIECES.PAWN, color: COLORS.WHITE };
      board[7][col] = { type: backRow[col], color: COLORS.WHITE };
    }

    return board;
  }

  getPiece(row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) return null;
    return this.board[row][col];
  }

  isValidPosition(row, col) {
    return row >= 0 && row <= 7 && col >= 0 && col <= 7;
  }

  getValidMoves(row, col) {
    const piece = this.getPiece(row, col);
    if (!piece || piece.color !== this.currentTurn) return [];

    let moves = [];

    switch (piece.type) {
      case PIECES.PAWN:
        moves = this.getPawnMoves(row, col, piece.color);
        break;
      case PIECES.ROOK:
        moves = this.getRookMoves(row, col, piece.color);
        break;
      case PIECES.KNIGHT:
        moves = this.getKnightMoves(row, col, piece.color);
        break;
      case PIECES.BISHOP:
        moves = this.getBishopMoves(row, col, piece.color);
        break;
      case PIECES.QUEEN:
        moves = this.getQueenMoves(row, col, piece.color);
        break;
      case PIECES.KING:
        moves = this.getKingMoves(row, col, piece.color);
        break;
    }

    return moves.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col, piece.color));
  }

  getPawnMoves(row, col, color) {
    const moves = [];
    const direction = color === COLORS.WHITE ? -1 : 1;
    const startRow = color === COLORS.WHITE ? 6 : 1;

    const oneStep = row + direction;
    if (this.isValidPosition(oneStep, col) && !this.getPiece(oneStep, col)) {
      moves.push({ row: oneStep, col });

      if (row === startRow) {
        const twoSteps = row + 2 * direction;
        if (!this.getPiece(twoSteps, col)) {
          moves.push({ row: twoSteps, col });
        }
      }
    }

    [-1, 1].forEach(offset => {
      const captureRow = row + direction;
      const captureCol = col + offset;
      if (this.isValidPosition(captureRow, captureCol)) {
        const target = this.getPiece(captureRow, captureCol);
        if (target && target.color !== color) {
          moves.push({ row: captureRow, col: captureCol });
        }

        if (this.enPassantTarget &&
            this.enPassantTarget.row === captureRow &&
            this.enPassantTarget.col === captureCol) {
          moves.push({ row: captureRow, col: captureCol, isEnPassant: true });
        }
      }
    });

    return moves;
  }

  getRookMoves(row, col, color) {
    return this.getLinearMoves(row, col, color, [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ]);
  }

  getBishopMoves(row, col, color) {
    return this.getLinearMoves(row, col, color, [
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ]);
  }

  getQueenMoves(row, col, color) {
    return this.getLinearMoves(row, col, color, [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ]);
  }

  getLinearMoves(row, col, color, directions) {
    const moves = [];

    for (const [dRow, dCol] of directions) {
      let currentRow = row + dRow;
      let currentCol = col + dCol;

      while (this.isValidPosition(currentRow, currentCol)) {
        const target = this.getPiece(currentRow, currentCol);

        if (!target) {
          moves.push({ row: currentRow, col: currentCol });
        } else {
          if (target.color !== color) {
            moves.push({ row: currentRow, col: currentCol });
          }
          break;
        }

        currentRow += dRow;
        currentCol += dCol;
      }
    }

    return moves;
  }

  getKnightMoves(row, col, color) {
    const moves = [];
    const offsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    for (const [dRow, dCol] of offsets) {
      const newRow = row + dRow;
      const newCol = col + dCol;

      if (this.isValidPosition(newRow, newCol)) {
        const target = this.getPiece(newRow, newCol);
        if (!target || target.color !== color) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    return moves;
  }

  getKingMoves(row, col, color) {
    const moves = [];
    const offsets = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];

    for (const [dRow, dCol] of offsets) {
      const newRow = row + dRow;
      const newCol = col + dCol;

      if (this.isValidPosition(newRow, newCol)) {
        const target = this.getPiece(newRow, newCol);
        if (!target || target.color !== color) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    const castlingMoves = this.getCastlingMoves(row, col, color);
    moves.push(...castlingMoves);

    return moves;
  }

  getCastlingMoves(row, col, color) {
    const moves = [];

    if (this.isInCheck(color)) return moves;

    const rights = this.castlingRights[color];
    const baseRow = color === COLORS.WHITE ? 7 : 0;

    if (rights.kingSide) {
      const rook = this.getPiece(baseRow, 7);
      if (rook && rook.type === PIECES.ROOK && rook.color === color) {
        if (!this.getPiece(baseRow, 5) && !this.getPiece(baseRow, 6)) {
          if (!this.isSquareUnderAttack(baseRow, 5, color) &&
              !this.isSquareUnderAttack(baseRow, 6, color)) {
            moves.push({ row: baseRow, col: 6, isCastling: true, isKingSide: true });
          }
        }
      }
    }

    if (rights.queenSide) {
      const rook = this.getPiece(baseRow, 0);
      if (rook && rook.type === PIECES.ROOK && rook.color === color) {
        if (!this.getPiece(baseRow, 1) && !this.getPiece(baseRow, 2) && !this.getPiece(baseRow, 3)) {
          if (!this.isSquareUnderAttack(baseRow, 2, color) &&
              !this.isSquareUnderAttack(baseRow, 3, color)) {
            moves.push({ row: baseRow, col: 2, isCastling: true, isKingSide: false });
          }
        }
      }
    }

    return moves;
  }

  isSquareUnderAttack(row, col, defendingColor) {
    const attackingColor = defendingColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.getPiece(r, c);
        if (piece && piece.color === attackingColor) {
          const moves = this.getRawMoves(r, c, piece);
          if (moves.some(m => m.row === row && m.col === col)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  getRawMoves(row, col, piece) {
    switch (piece.type) {
      case PIECES.PAWN:
        return this.getPawnAttackMoves(row, col, piece.color);
      case PIECES.ROOK:
        return this.getRookMoves(row, col, piece.color);
      case PIECES.KNIGHT:
        return this.getKnightMoves(row, col, piece.color);
      case PIECES.BISHOP:
        return this.getBishopMoves(row, col, piece.color);
      case PIECES.QUEEN:
        return this.getQueenMoves(row, col, piece.color);
      case PIECES.KING:
        return this.getKingBasicMoves(row, col, piece.color);
      default:
        return [];
    }
  }

  getPawnAttackMoves(row, col, color) {
    const moves = [];
    const direction = color === COLORS.WHITE ? -1 : 1;

    [-1, 1].forEach(offset => {
      const captureRow = row + direction;
      const captureCol = col + offset;
      if (this.isValidPosition(captureRow, captureCol)) {
        moves.push({ row: captureRow, col: captureCol });
      }
    });

    return moves;
  }

  getKingBasicMoves(row, col, color) {
    const moves = [];
    const offsets = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];

    for (const [dRow, dCol] of offsets) {
      const newRow = row + dRow;
      const newCol = col + dCol;

      if (this.isValidPosition(newRow, newCol)) {
        const target = this.getPiece(newRow, newCol);
        if (!target || target.color !== color) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    return moves;
  }

  findKing(color) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece(row, col);
        if (piece && piece.type === PIECES.KING && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  }

  isInCheck(color) {
    const king = this.findKing(color);
    if (!king) return false;
    return this.isSquareUnderAttack(king.row, king.col, color);
  }

  wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
    const piece = this.getPiece(fromRow, fromCol);
    const captured = this.getPiece(toRow, toCol);

    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = null;

    const inCheck = this.isInCheck(color);

    this.board[fromRow][fromCol] = piece;
    this.board[toRow][toCol] = captured;

    return inCheck;
  }

  makeMove(fromRow, fromCol, toRow, toCol, promotionPiece = null) {
    const piece = this.getPiece(fromRow, fromCol);
    if (!piece || piece.color !== this.currentTurn) {
      return false;
    }

    const validMoves = this.getValidMoves(fromRow, fromCol);
    const move = validMoves.find(m => m.row === toRow && m.col === toCol);

    if (!move) {
      return false;
    }

    const captured = this.getPiece(toRow, toCol);
    if (captured) {
      this.capturedPieces[this.currentTurn].push(captured);

      if (captured.type === PIECES.ROOK) {
        const opponentColor = this.currentTurn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
        const opponentBaseRow = opponentColor === COLORS.WHITE ? 7 : 0;
        if (toRow === opponentBaseRow) {
          if (toCol === 0) {
            this.castlingRights[opponentColor].queenSide = false;
          } else if (toCol === 7) {
            this.castlingRights[opponentColor].kingSide = false;
          }
        }
      }
    }

    this.enPassantTarget = null;

    if (piece.type === PIECES.PAWN) {
      if (Math.abs(fromRow - toRow) === 2) {
        this.enPassantTarget = {
          row: (fromRow + toRow) / 2,
          col: fromCol
        };
      }

      if (move.isEnPassant) {
        const capturedPawnRow = this.currentTurn === COLORS.WHITE ? toRow + 1 : toRow - 1;
        const capturedPawn = this.getPiece(capturedPawnRow, toCol);
        this.capturedPieces[this.currentTurn].push(capturedPawn);
        this.board[capturedPawnRow][toCol] = null;
      }

      const promotionRow = this.currentTurn === COLORS.WHITE ? 0 : 7;
      if (toRow === promotionRow) {
        if (promotionPiece) {
          this.board[toRow][toCol] = { type: promotionPiece, color: piece.color };
          this.board[fromRow][fromCol] = null;
        } else {
          return { needsPromotion: true };
        }
      } else {
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
      }
    } else if (piece.type === PIECES.KING) {
      this.board[toRow][toCol] = piece;
      this.board[fromRow][fromCol] = null;

      this.castlingRights[this.currentTurn].kingSide = false;
      this.castlingRights[this.currentTurn].queenSide = false;

      if (move.isCastling) {
        const baseRow = this.currentTurn === COLORS.WHITE ? 7 : 0;
        if (move.isKingSide) {
          const rook = this.getPiece(baseRow, 7);
          this.board[baseRow][5] = rook;
          this.board[baseRow][7] = null;
        } else {
          const rook = this.getPiece(baseRow, 0);
          this.board[baseRow][3] = rook;
          this.board[baseRow][0] = null;
        }
      }
    } else if (piece.type === PIECES.ROOK) {
      this.board[toRow][toCol] = piece;
      this.board[fromRow][fromCol] = null;

      const baseRow = this.currentTurn === COLORS.WHITE ? 7 : 0;
      if (fromRow === baseRow) {
        if (fromCol === 0) {
          this.castlingRights[this.currentTurn].queenSide = false;
        } else if (fromCol === 7) {
          this.castlingRights[this.currentTurn].kingSide = false;
        }
      }
    } else {
      this.board[toRow][toCol] = piece;
      this.board[fromRow][fromCol] = null;
    }

    this.moveHistory.push({
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      piece: piece.type,
      captured
    });

    this.currentTurn = this.currentTurn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;

    return true;
  }

  isCheckmate() {
    if (!this.isInCheck(this.currentTurn)) return false;
    return this.hasNoLegalMoves();
  }

  isStalemate() {
    if (this.isInCheck(this.currentTurn)) return false;
    return this.hasNoLegalMoves();
  }

  hasNoLegalMoves() {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece(row, col);
        if (piece && piece.color === this.currentTurn) {
          const moves = this.getValidMoves(row, col);
          if (moves.length > 0) {
            return false;
          }
        }
      }
    }
    return true;
  }

  getGameState() {
    return {
      board: this.board.map(row => [...row]),
      currentTurn: this.currentTurn,
      moveHistory: [...this.moveHistory],
      capturedPieces: {
        white: [...this.capturedPieces.white],
        black: [...this.capturedPieces.black]
      },
      castlingRights: {
        white: { ...this.castlingRights.white },
        black: { ...this.castlingRights.black }
      },
      enPassantTarget: this.enPassantTarget ? { ...this.enPassantTarget } : null
    };
  }
}
