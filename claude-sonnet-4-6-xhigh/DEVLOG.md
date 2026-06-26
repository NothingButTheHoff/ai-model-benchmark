# Development Log — Chess Benchmark

**Model:** claude-sonnet-4-6 (effort: xhigh)  
**Date:** 2026-06-09

---

## Architecture

### Directory structure

```
src/
  engine/
    chess.js          # Pure game logic — no React deps
  hooks/
    useChessGame.js   # State management + localStorage
  components/
    Board.jsx         # Grid of Square components
    Square.jsx        # Individual square with piece, indicators
    Piece.jsx         # Unicode symbol rendering
    CapturedPieces.jsx
    PromotionModal.jsx
    StatusBar.jsx
  utils/
    boardUtils.js
  App.jsx
  App.css
  index.css
```

### Engine design

The chess engine (`src/engine/chess.js`) is purely functional — all state is immutable. Key functions:

- `createInitialState()` — constructs initial board + game metadata
- `generatePseudoMoves(state, row, col)` — all moves ignoring check
- `applyMoveToState(state, move)` — clones and applies a move
- `getLegalMoves(state, color)` — filters pseudo-moves by applying each and checking if own king remains in check
- `applyMove(state, move)` — applies move and recomputes game status (check/checkmate/stalemate)

No move objects are mutated; every transition returns a new state object. This made React state management straightforward.

### State management

`useChessGame` hook holds:
- `gameState` — full engine state (board, turn, castling rights, en passant target, captured pieces, status)
- `selectedSquare` — which square the user clicked
- `validMoves` — legal moves for the selected piece
- `promotionState` — pending promotion `{ from, to }` triggering the modal

`gameState` is serialized to `localStorage` on every change. On mount, the hook tries to hydrate from storage before falling back to `createInitialState()`.

---

## Edge case implementations

### En passant

The engine stores an `enPassantTarget: [row, col]` — the square a capturing pawn would land on (not the square the double-pushed pawn occupies). This is set when a pawn makes a double push; cleared on every other move.

In `generatePseudoMoves` for pawns, after checking diagonal captures I additionally check if the diagonal target matches `enPassantTarget`. If so, an `{ enPassant: true, capturedPawnRow }` move is added.

In `applyMoveToState`, en passant moves remove the captured pawn from `capturedPawnRow` (same row as the capturing pawn, not the landing square).

### Castling

Castling eligibility checks in `generatePseudoMoves` (KING case):
1. King is on its starting square and has not moved (`castlingRights[color].kingside/queenside`)
2. Squares between king and rook are empty
3. King is not currently in check
4. The two squares the king traverses are not attacked by the opponent

`castlingRights` is revoked when the king moves (both sides), when a rook moves (its side), or when a rook is captured (that side for the rook's owner).

In `applyMoveToState`, a castling move also relocates the rook.

### Check detection

`isSquareAttacked(board, row, col, attackerColor)` checks all attacker piece types:
- Knights: 8 fixed offsets
- Sliding pieces (rook/bishop/queen): ray-cast until blocked
- Pawns: attack diagonally in their direction (white attacks upward/decreasing row)
- King: 8 adjacent squares (prevents kings from standing adjacent)

`isInCheck(board, color)` finds the king and calls `isSquareAttacked`.

`getLegalMoves` filters every pseudo-move by applying it to a cloned board and checking `isInCheck` for the moving side. This handles all pin cases and discovered check correctly without any special-case logic.

### Checkmate and stalemate

After applying a move, the engine computes legal moves for the next player. If none:
- King in check → checkmate (opponent wins)
- King not in check → stalemate (draw)

### Pawn promotion

Promotion moves are generated as four separate pseudo-moves (one per promotable piece) all targeting the same `[toRow, toCol]`. The UI calls `needsPromotion(state, from, to)` to detect when the user's target has promotion variants, then shows a modal. Once the user picks a piece, `findMove(state, from, to, pieceType)` retrieves the exact move object and applies it.

---

## Challenges

**Legality filtering performance:** For each candidate move, I clone the board and run check detection. With up to ~30 pieces and 8-directional ray casts, this is O(moves × board). Acceptable for interactive play — a typical position has ~30 legal moves, each check costs ~O(64) square visits. No noticeable lag.

**Castling through check:** The standard says the king cannot pass through or land on an attacked square. I verify the two intermediate squares individually using `isSquareAttacked` before adding the castling move. The king's own starting square is covered by the "not currently in check" guard already applied.

**Pawn attack direction:** The `isSquareAttacked` pawn check had to compute which row a pawn of `attackerColor` would have to be on to attack `(row, col)`. White pawns attack upward (from a higher row number toward lower), so to check if `(row, col)` is attacked by a white pawn, look at `(row+1, col±1)`. Got this backwards initially and had to flip.

**Label inversion in CapturedPieces:** Initial render had "White captured" and "Black captured" labels swapped. Caught during Playwright verification and fixed before finalizing.
