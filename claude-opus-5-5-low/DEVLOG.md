# Development Log

## Architecture

- **Engine (`src/engine`)** is pure JavaScript with no React imports, so it can be unit-tested with `node --test`.
  - `board.js`: board creation, cloning, king lookup.
  - `moves.js`: pseudo-legal move generation per piece, attack detection, and legal-move filtering.
  - `game.js`: immutable game-state transitions (`makeMove`), castling-right bookkeeping, status computation.
  - `storage.js`: `localStorage` load/save with shape validation and try/catch around every access.
- **State management**: a single serializable game-state object (`board`, `turn`, `castlingRights`, `enPassantTarget`, `captured`, `status`, `lastMove`). `makeMove` returns a new object and never mutates. The `useChessGame` hook holds it in `useState` and persists it via `useEffect` on every change. UI-only state (selected square, pending promotion, error message) stays in the hook and is not persisted.

## Edge cases

- **Legality**: every pseudo-legal move is applied to a cloned board and discarded if the mover's own king is attacked. This handles pins, discovered checks, and en passant exposing the king in one place.
- **En passant**: a double pawn push stores the skipped square as `enPassantTarget`. The target is cleared on the next move, so the capture is only possible immediately. Applying the move removes the pawn beside the moving pawn rather than on the target square.
- **Castling**: rights are tracked per side and revoked when the king moves, a rook leaves its corner, or a rook is captured on its corner. Generation requires the king not in check, empty squares between king and rook, and the king's transit/destination squares not attacked. For queen side, b1/b8 must be empty but may be attacked.
- **Promotion**: the engine flags promotion moves and rejects them without a valid piece type. The UI opens a picker dialog before committing (with cancel).
- **Check/checkmate/stalemate**: after each move, status is computed from "side to move has any legal move" combined with "side to move is in check".

## Error handling

- `makeMove` throws on illegal moves, invalid promotion piece, or when the game is over. The hook catches and shows the message instead of crashing.
- Corrupt or tampered `localStorage` data fails validation and the game falls back to a fresh start.

## Challenges

- Constant collision: `BISHOP` and `BLACK` are both `'b'`. This is safe because piece type and color are separate fields, but it needed care in validation code.
- Queen-side castling safety rule (b-file may be attacked) is easy to get wrong; covered by a unit test.

## Verification

- 10 engine unit tests (initial move count, Fool's mate, en passant incl. expiry, castling both sides, castling through/out of/into check, castling-rights loss, promotion, stalemate, pins).
- `npm run build` succeeds.
