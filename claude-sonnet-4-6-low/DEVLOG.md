# DEVLOG — claude-sonnet-4-6-low

## Architecture

Split into two layers:

**Engine (`src/engine/`)**
- `constants.js` — piece/color enums, initial board/state factory
- `utils.js` — pure helpers (clone, bounds check, opponent)
- `moveGenerator.js` — `getPseudoLegalMoves`: generates all candidate moves per piece without checking if the king is left in check. Handles sliding pieces, knight L-shapes, pawn double push, en passant squares, and pseudo-legal castling squares.
- `gameEngine.js` — `getLegalMoves`: filters pseudo-legal moves by simulating each on a cloned board and checking if the mover's king is in check afterward. `applyMove`: applies a move to full game state, updates castling rights, en passant target, captured pieces, turn, and computes new game status. `isInCheck`: scans all opponent pseudo-legal moves for king attacks.
- `storage.js` — thin localStorage wrapper (save/load/clear JSON game state)

**UI (`src/components/`)**
- `Board.jsx` — 8x8 grid of `Square` components; derives legal-move set and last-move highlight from props
- `Square.jsx` — single cell; renders piece, legal-dot (empty square), or legal-capture ring (enemy square)
- `Piece.jsx` — renders Unicode chess symbols, white/black styled differently
- `StatusBar.jsx` — turn indicator, game status message, Reset button
- `CapturedPieces.jsx` — lists pieces captured by each side
- `PromotionDialog.jsx` — modal overlay with 4 piece buttons on pawn promotion

State lives entirely in `App.jsx` via `useState`. No global store needed.

## Edge Case Implementation

**En Passant**
En passant target is stored as the square the capturing pawn moves *into* (the square behind the double-pushed pawn). When a pawn double-pushes, `enPassantTarget = { row: (from.row + to.row) / 2, col }`. The move generator adds an `enPassant: true` flag to diagonal pawn moves that land on this square. `applyMove` then removes the captured pawn from `from.row` (not `to.row`) at `to.col`.

**Castling**
Castling rights tracked per color per side. Three conditions checked:
1. King and rook haven't moved (rights flags updated on any king/rook move or rook capture)
2. Squares between king and rook are empty (checked in move generator)
3. King not currently in check, and doesn't pass through an attacked square (checked in `getLegalMoves` by simulating the king at the intermediate square)

**Pawn Promotion**
Detected in `App.jsx` before calling `applyMove`: if a pawn reaches the back rank, the promotion dialog opens and the move is held in `pendingPromotion`. On piece selection, `applyMove` is called with the chosen piece type.

**Check/Checkmate/Stalemate**
After every move, `getGameStatus` checks if the new current player has any legal moves. If not: checkmate if in check, stalemate otherwise.

## Challenges

- **Castling legality**: pseudo-legal generator needs to emit castling moves so the legality filter can simulate them. The intermediate-square check requires a separate simulation at the pass-through square.
- **En passant removal**: the captured pawn is not on `to.row`; it's on `from.row` at `to.col`. Easy to get wrong.
- **Stale castling rights after rook capture**: when an opponent captures a rook, the castling rights for that rook must be removed, checked via the destination square on rook captures.
