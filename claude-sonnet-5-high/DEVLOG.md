# Development Log

## Architecture

The engine is deliberately isolated from React: `src/engine/**` has no dependency on React or the DOM, takes a plain-object game state in, and returns a new plain-object game state out. This made the engine trivially unit-testable with Node's built-in test runner and meant the UI layer could be built afterward against a fixed, already-verified API (`createGame`, `getLegalMovesForSquare`, `applyMove`, `computeStatus`).

State shape:

```js
{
  board,            // 8x8 array, row 0 = rank 8, col 0 = file a
  turn,             // 'w' | 'b'
  castlingRights,   // { w: {kingSide, queenSide}, b: {...} }
  enPassantTarget,  // {row, col} | null — the skipped-over square, if any
  capturedPieces,   // { w: [...types], b: [...types] } — pieces of that color captured
  status,           // 'ongoing' | 'check' | 'checkmate' | 'stalemate'
  winner,           // 'w' | 'b' | null
  lastMove,
}
```

State transitions are immutable: `applyMove` clones the board and returns a brand-new state object rather than mutating in place. This made the whole thing easy to reason about and to serialize straight to `localStorage` with `JSON.stringify` — there's no class instance or non-JSON-safe field anywhere in the state.

React state management is a single `useGame` hook (`src/hooks/useGame.js`) that holds the game state plus transient UI state (selected square, computed legal moves for that square, a pending promotion choice). It's intentionally not a `useReducer` — the state transitions are simple enough (select / move / promote / reset) that a handful of `useCallback`s reads more directly than action types would.

## Move generation & legality

Move generation is split into two layers:

1. **Attack squares** (`attacks.js`): for any piece on any square, what squares does it attack? This is the one piece of logic shared by check detection, castling-through-check checks, and (indirectly) legal move filtering. Sliding pieces stop at the first occupied square in each direction — that stopping square counts as attacked regardless of which color occupies it, which is exactly what's needed for detecting whether a king could be captured there.
2. **Pseudo-legal moves → legal moves** (`moveGen.js`): pawns, and everything else, generate pseudo-legal moves first (ignoring whether the mover's own king ends up in check), then each candidate move is simulated on a cloned board and discarded if it leaves the mover's own king attacked. This "generate then filter by simulation" approach is slower than maintaining pin/check state incrementally, but for a UI-driven game (not an engine searching millions of positions) it's simpler and much less error-prone — and it's what caught a subtlety during testing (see below).

Checkmate/stalemate are not special-cased rules — they fall out for free: after a move, if the side to move next has an empty legal-move list, it's checkmate (their king is attacked) or stalemate (it isn't). No separate "is this checkmate" algorithm was needed.

## The trickier rules

- **En passant**: tracked as a single `enPassantTarget` square (the square *behind* the pawn that just double-stepped), set after every move and cleared unless the very next move is a double pawn push. A pawn's diagonal move onto that exact square, when the destination is otherwise empty, is treated as a capture of the pawn one rank behind the destination.
- **Castling**: generated separately from normal king moves because its legality depends on game history (rights) and check state, not just piece placement. Three independent conditions gate it: the corresponding right hasn't been revoked (king or that rook has never moved, and that rook hasn't been captured on its home square), the squares between king and rook are empty, and neither the king's start square, the squares it passes through, nor its destination are attacked. All three are checked before a castling move is even offered as a candidate, so it never needs to be filtered out later.
- **Promotion**: pawn moves that land on the back rank are generated with a placeholder `promotion: 'q'`. The UI intercepts any move with a truthy `promotion` field, opens the picker, and re-dispatches the move with the user's chosen piece type before calling `applyMove`. Promotion choice doesn't affect move legality (a friendly piece, whatever it is, can't check its own king), so the placeholder is safe to use for the legality simulation pass.
- **Discovered pins**: no explicit pin-detection code exists — pins are a consequence of the "simulate the move, check if the mover's own king is attacked afterward" filter. This was validated by accident during manual verification: in a Ruy Lopez line after `Bxc6`, the black d-pawn (pinned to the king along the c6–e8 diagonal) correctly showed exactly one legal move (`dxc6`, capturing the pinning bishop) rather than the two pawn pushes, which would have exposed the king.

## Testing

Engine tests use Node's built-in `node:test` runner (`npm run test`) rather than pulling in a separate test framework, in keeping with the "minimal dependencies" constraint. A small test-only helper (`__tests__/testUtils.js`) builds board positions from 8-row ASCII layouts so edge cases (stalemate, castling-through-check, en passant, underpromotion) can be set up directly without playing out a full game move-by-move. Fourteen tests cover: initial move count, checkmate (fool's mate), stalemate, check-with-an-escape, all four castling legality gates, en passant capture and window expiry, and promotion (including underpromotion and capture-promotion).

The full UI flow (selection, legal-move highlighting, capturing, turn switching, `localStorage` persistence across reload, the promotion modal, and reset) was verified end-to-end by scripting a real browser (Playwright, run from a scratch directory outside the project — not added as a project dependency) against the running dev server, rather than just trusting the unit tests and code review.

## Challenges

The main challenge was resisting the urge to special-case checkmate/stalemate/pins as their own algorithms — the "generate pseudo-legal, then filter by simulating and checking the king" approach handles all of them uniformly, at the cost of being asymptotically wasteful (full-board attack scans per candidate move). That tradeoff is a non-issue at human-playable game sizes and kept the rule implementation surface much smaller and easier to verify.
