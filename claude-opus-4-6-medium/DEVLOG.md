# DEVLOG — claude-opus-4-6-medium

## Architecture

### State Management
Game state is a single plain object containing:
- `board`: 8x8 array of piece objects (`{type, color}` or `null`)
- `turn`: whose move it is
- `castlingRights`: nested object tracking king/queenside rights per color
- `enPassantTarget`: `[row, col]` of the en passant capture square, or `null`
- `captured`: captured pieces per color
- `status`: `'playing' | 'check' | 'checkmate' | 'stalemate'`
- `pendingPromotion`: set when a pawn reaches the back rank, pauses the game until user selects promotion piece

State is lifted to the `Board` component and persisted to `localStorage` on every change via `useEffect`.

### Engine / UI Separation
Engine code lives in `src/engine/`:
- `constants.js` — piece types, colors, initial board, Unicode symbols
- `moves.js` — raw move generation per piece type, sliding piece logic, attack detection, check/legal move filtering, castling move generation
- `game.js` — higher-level: `makeMove`, `applyPromotion`, `createInitialState`, status resolution

UI components in `src/components/`:
- `Board.jsx` — main game component, handles selection, move execution, promotion flow
- `Square.jsx` — individual square rendering with visual states
- `PromotionDialog.jsx` — modal overlay for piece selection

### Move Validation Approach
1. Generate "raw" moves per piece type (ignoring check)
2. For kings, append castling candidates (with through-check validation)
3. Filter all candidates through `wouldBeInCheck` — simulate the move on a cloned board and test if own king is attacked
4. This approach is simple and correct, though not performance-optimized (fine for human play)

## Edge Cases

### En Passant
- When a pawn double-pushes, `enPassantTarget` is set to the square the capturing pawn would land on
- `enPassantTarget` resets every move (only valid immediately after the double push)
- The `wouldBeInCheck` function correctly removes the captured pawn when simulating en passant

### Castling
- Tracked via `castlingRights` object, updated on king/rook moves and rook captures
- Validates: king not in check, king doesn't pass through or land in check, path is clear
- Queenside castling checks all three squares between king and rook are empty

### Pawn Promotion
- When a pawn reaches the back rank, `makeMove` returns state with `pendingPromotion` set
- Turn does NOT advance until promotion is resolved
- `applyPromotion` places the chosen piece and then resolves game status

### Check/Checkmate/Stalemate
- After every move, `resolveStatus` checks if the new active player is in check and whether they have any legal moves
- No legal moves + in check = checkmate; no legal moves + not in check = stalemate

## Challenges
- Getting the en passant simulation right in `wouldBeInCheck` — need to remove the captured pawn from the correct square (same row as moving pawn, not the destination row)
- Castling through-check validation requires checking intermediate squares, not just origin and destination
- localStorage serialization of the board works cleanly since state is plain objects with no circular references
