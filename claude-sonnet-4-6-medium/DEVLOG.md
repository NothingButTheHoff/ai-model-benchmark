# DEVLOG — claude-sonnet-4-6-medium

## Architecture Decisions

### State Representation

Board is a plain 8x8 JavaScript array. Row 0 is rank 8 (black's back rank), row 7 is rank 1 (white's back rank). Each cell is `null` or `{ type, color }`. This matches visual layout: board renders top-to-bottom with black at top, no coordinate transformation needed in the render layer.

Game state is a single plain object passed as a React prop tree. No context or global store — the root `App` component owns the state and passes `onMove`/`onPromotion` callbacks down. State updates are immutable (always return new objects); this makes LocalStorage serialization trivial since the state is already JSON-safe.

### Engine Separation

The engine lives in `src/engine/` with zero React imports. This keeps the logic unit-testable and the files small:

- `pieces.js` — constants only
- `board.js` — initialization and pure board helpers (`cloneBoard`, `inBounds`, `findKing`)
- `moves.js` — move generation and attack detection
- `rules.js` — check/checkmate/stalemate (thin wrappers over moves.js)
- `gameState.js` — applies moves to state, handles localStorage

### Move Generation

`getRawMoves` generates pseudo-legal moves (ignores check). `getValidMoves` filters them by applying each move to a cloned board and checking if the moving side's king is still attacked. This is the classical approach: simple to reason about, correct by construction, and fast enough for a browser UI (no search depth involved).

Sliding pieces (bishop, rook, queen) iterate in each direction until they hit the edge or an occupied square. If the occupant is an enemy, the capture is included; the loop breaks either way.

### En Passant

When `applyMove` detects a pawn double-push, it records `enPassantTarget: { row, col }` pointing to the square the capturing pawn will land on (the square behind the pushed pawn). `getRawMoves` checks this target during diagonal pawn capture generation. On `applyMoveToBoard` (used for check validation) and `applyMove` (full state update), the captured pawn is removed from `from.row, move.toCol` — same rank as the moving pawn, destination column.

### Castling

Castling rights tracked as `{ w: { kingside, queenside }, b: { kingside, queenside } }`. Rights are revoked when:
- The king moves (both revoked)
- A rook moves (its side revoked)
- An enemy captures a rook on its starting square (that side revoked)

`getRawMoves` adds castle moves when rights exist and the intermediate squares are empty. `getValidMoves` additionally verifies:
1. King is not currently in check
2. King does not pass through an attacked square (f-file for kingside, d-file for queenside)
3. King does not land in check (standard post-move check filter handles this)

### Pawn Promotion

When a pawn reaches the last rank, `applyMove` sets `promotionPending: { row, col }` and keeps the turn on the current player. The board still has a pawn on the promotion square. `PromotionModal` renders over the board; when the user picks a piece type, `applyPromotion` replaces the pawn, switches turn, and recalculates check/checkmate/stalemate.

No moves are allowed while `promotionPending` is set (Board.jsx early-returns on click).

### Check / Checkmate / Stalemate

- `isInCheck`: find king position, check if any enemy piece attacks it via `isSquareAttacked`
- `isSquareAttacked`: iterate all enemy pieces, generate their raw moves, see if any land on the target square
- `isCheckmate`: in check AND no valid moves
- `isStalemate`: not in check AND no valid moves

`isSquareAttacked` calls `getRawMoves` with `null` gameState to avoid infinite recursion (castling check calls `isSquareAttacked`, which must not call back into castling logic).

### LocalStorage Persistence

State is serialized with `JSON.stringify` on every state change via a `useEffect`. On load, `loadFromLocalStorage` deserializes and validates the basic shape. If validation fails or nothing is stored, `initialGameState()` is used. Reset clears the key and reinitializes.

## Challenges

**En passant capture removal**: The captured pawn is not on the destination square — it's on the same row as the moving pawn. Getting the removal coordinates right (`from.row, move.toCol`) required careful attention. The en passant target square (where the moving pawn lands) vs the captured pawn square are different rows.

**Castling through check**: `getRawMoves` can't do the through-check validation because `isSquareAttacked` itself calls `getRawMoves`, creating a recursion risk. The solution: raw moves include castle candidates with no check validation; `getValidMoves` does the full validation after the fact, using a null gameState for `isSquareAttacked` to prevent castling logic from re-entering.

**Promotion + game-end detection**: After promotion, check/checkmate/stalemate must be computed on the promoted piece's final board, not the pawn-still-present board. The flow is: `applyMove` sets pending state → user chooses piece → `applyPromotion` replaces piece and runs detection. If detection ran in `applyMove`, it would use the wrong board.

**Board coordinate system**: Row 0 = rank 8 is counterintuitive at first, but it means the initial board array visually matches the black-first display. White pawns move in direction `-1` (decreasing row index), black pawns in direction `+1`.
