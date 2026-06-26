# DEVLOG

## Architecture

Two clean layers:

- `src/engine.js` — pure, stateless chess engine. Functions take a state object and
  return new state; no React, no DOM. Easy to test in isolation (did so via perft).
- `src/App.jsx` — React UI. Holds engine state in `useState`, renders board, handles
  clicks, persists to `localStorage` via `useEffect`.

### State shape

A single plain-object state: `board` (8x8 array of `{type,color}|null`), `turn`,
`castling` rights flags, `enPassant` target square, `captured` lists, and derived
`status`/`winner`. Plain JSON → trivially serializable for persistence. Board row 0 is
rank 8 (black's back rank) so array order matches on-screen top-to-bottom rendering.

Moves are computed, never mutated in place — `applyMove` clones the board and returns a
fresh state. Immutability keeps React re-renders correct and makes perft testing easy.

## Edge cases

**Move legality** is two-phase: `pseudoMoves` generates geometric moves per piece, then
`legalMovesFor` simulates each on a cloned board and rejects any leaving its own king in
check. `isAttacked` powers check detection by scanning outward from a square for each
attacker type.

**En passant**: a double pawn push sets `enPassant` to the skipped square. Pawn capture
generation allows moving onto that square; `applyMove` removes the pawn behind the target.

**Castling**: king move of two squares. Rights tracked per side, cleared when king/rook
moves or the rook square is captured. Generation checks the squares between are empty and
that the king is not in, and does not pass through, check (`isAttacked` on each square).

**Promotion**: flagged on pawn moves reaching the back rank. UI shows a picker; the chosen
piece is passed into `applyMove`.

**Checkmate vs stalemate**: after each move, `allLegalMoves` for the side to move — if
empty, it's checkmate when in check, otherwise stalemate.

## Challenges

- Getting castling check-rules right (king can't castle out of, through, or into check)
  required checking each transit square, not just the destination.
- Verifying correctness without a reference lib: implemented perft and matched the known
  starting-position node counts (20 / 400 / 8902), which exercises captures, castling, en
  passant, and check filtering together.

## Verification

`npm run build` succeeds. Perft depths 1–3 match reference values.
