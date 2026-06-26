# Development Log

## Architecture Decisions

### Engine Separation
The chess engine (`src/engine/index.js`) is a pure JavaScript module with zero React dependencies. All functions are pure — they take a game state object and return a new state object. This makes the engine testable in isolation (tested via Node.js CLI) and keeps UI concerns out of game logic.

### State Representation
- **Board**: 8x8 array where `board[row][col]` is `null` or `{type, color}`. Row 0 = rank 8 (black's back rank), row 7 = rank 1 (white's back rank).
- **Game State**: Single object containing board, turn, castling rights, en passant target, captured pieces, last move, and status. Fully JSON-serializable for localStorage persistence.
- **Immutable Updates**: Every `makeMove()` call returns a fresh state object with copied board. No mutation of previous state.

### Move Validation Strategy
Two-phase approach:
1. **Pseudo-legal generation**: Generate all moves following piece movement rules (ignoring king safety).
2. **Legality filter**: For each candidate move, simulate it on a board copy and verify the king is not left in check.

This is simple, correct, and fast enough for interactive play. The `hasAnyLegalMove()` function short-circuits on the first legal move found, keeping checkmate/stalemate detection responsive.

## Complex Edge Cases

### En Passant
Tracked via `enPassantTarget` in game state — set to the "passed-through" square when a pawn double-advances, cleared on every other move. The pawn capture check compares diagonal targets against this square. On execution, the captured pawn (on the same rank as the capturing pawn, not the target square) is removed.

### Castling
Five conditions verified:
1. King and relevant rook haven't moved (tracked via `castlingRights`)
2. No pieces between king and rook
3. King not in check
4. King doesn't pass through an attacked square
5. King doesn't land on an attacked square

Castling rights are revoked when: king moves, rook moves from starting square, or a piece is captured on a rook's starting square (covers the case where an opponent captures your rook).

### Pawn Promotion
Detected by checking if a pawn move reaches the last rank. The UI intercepts this before executing the move, shows a selection dialog (Queen/Rook/Bishop/Knight), then completes the move with the chosen piece type.

### Check / Checkmate / Stalemate
`computeStatus()` runs after every move:
- **Check**: King is attacked by any opponent piece (via `isSquareAttacked`)
- **Checkmate**: In check AND no legal move exists for any piece
- **Stalemate**: NOT in check AND no legal move exists

The `isSquareAttacked` function checks all attack vectors: pawn diagonals, knight L-shapes, king adjacency, and sliding pieces (bishop/rook/queen diagonals and straights).

## Testing

All engine logic was verified via Node.js CLI tests covering:
- Initial position move generation (pawns, knights, king)
- En passant capture and board cleanup
- Kingside and queenside castling execution
- Castling blocked by through-check
- Castling blocked when king in check
- Castling rights revoked on rook capture
- Pin handling (pinned bishop restricted to pin diagonal)
- Back-rank checkmate detection
- Stalemate detection
- Fool's mate (full game sequence to checkmate)
- Promotion execution (queen and knight)
- JSON serialization roundtrip (localStorage simulation)

## Challenges

1. **Pawn attack direction in `isSquareAttacked`**: The attacking direction for pawns must be reversed relative to movement direction — a white pawn at (r, c) *attacks* (r-1, c±1), so to check if (r, c) is attacked by a white pawn, look at (r+1, c±1). Getting this wrong causes phantom checks.

2. **Castling through-check squares**: Queenside castling requires b1/b8 to be empty but does NOT require it to be unattacked — only the squares the king passes through (d and c files) must be safe.

3. **En passant capture removal**: The captured pawn is at `board[from.row][to.col]`, not at the en passant target square. The target square is where the capturing pawn lands (the "passed-through" square), but the captured pawn is beside it on the same rank.
