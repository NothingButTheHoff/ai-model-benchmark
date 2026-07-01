# Development Log

## Architecture

Engine and UI are fully separated:

- `src/engine/` — pure JS, no React, no DOM. `constants.js` (board setup,
  piece/color codes), `moveGenerator.js` (pseudo-legal move rules + attack
  detection + legal-move filtering), `gameEngine.js` (top-level state:
  `createInitialState`, `applyMove`, `getLegalMoves`, check/mate/stalemate
  status), `storage.js` (localStorage read/write).
- `src/components/` — presentational React components (`Board`, `Square`,
  `CapturedPanel`, `PromotionModal`, `StatusBar`) that only render props and
  fire callbacks.
- `App.jsx` owns the one piece of mutable state (the game state object) and
  wires user clicks to engine calls. It never touches board rules directly.

State is treated as immutable: `applyMove(state, from, move)` returns a new
state object rather than mutating in place. This made the check-detection
logic (simulate a move on a cloned board, see if it leaves the mover's own
king in check) straightforward and safe to reuse for filtering castling and
en passant candidates too.

## Move legality

Two-phase generation:

1. **Pseudo-legal moves** (`getPseudoLegalMoves`) — obey each piece's movement
   pattern (slides for bishop/rook/queen, steps for knight/king, pawn's
   forward/double/capture/en-passant rules) but don't check for exposing the
   king.
2. **Legal moves** (`getLegalMovesForSquare`) — takes the pseudo-legal set,
   expands pawn promotions into 4 concrete moves (one per promotable piece),
   adds castling candidates, then simulates each move on a cloned board and
   discards any that leave the mover's king in check.

`isSquareAttacked` is the shared primitive used both for check detection and
for castling's "can't pass through/land on an attacked square" rule — it
walks outward from a target square looking for attacking pieces of a given
color, rather than generating full move lists for every enemy piece.

## Tricky rules

- **En passant**: tracked via `enPassantTarget` on game state, set only when
  the previous move was a pawn double-step, and cleared every other move
  (since it stored fresh per `applyMove` call rather than mutated, this is
  automatic — no separate "did the window expire" check needed).
- **Castling**: rights are booleans per side per color, revoked when the king
  or that rook moves, and also revoked if a rook is captured on its home
  square. Legality additionally checks the king isn't currently in check and
  doesn't pass through or land on an attacked square.
- **Promotion**: the UI detects "multiple legal moves land on the same target
  square" (which only happens for the four promotion choices) and opens a
  modal instead of committing immediately; the chosen piece type is matched
  back against the precomputed move list.
- **Checkmate/stalemate**: computed once per `applyMove` call by generating
  all legal moves for the side about to move and checking whether that side
  is currently in check — zero moves + in check = checkmate, zero moves + not
  in check = stalemate.

## Persistence

Game state is JSON-serializable by construction (plain objects/arrays, no
class instances), so persistence is just `JSON.stringify`/`parse` into
`localStorage`, saved via a `useEffect` on every state change and loaded once
as the `useState` initializer.

## Testing approach

Rather than trust the engine by inspection alone, I wrote a throwaway Node
script exercising it directly against known positions: Fool's Mate
(checkmate), an en passant capture, kingside castling, a manually-constructed
pawn-one-step-from-promotion position, and a manually-constructed stalemate
position. All five passed before wiring up the UI. I then smoke-tested the
actual browser UI with Playwright: made a move, confirmed the status text and
highlighting updated, reloaded the page to confirm persistence, and clicked
Reset to confirm it returns to the starting position.

## Challenges

- Getting the check-detection simulation to handle castling and en passant
  correctly required a dedicated `simulateMove` helper in the move generator
  that understands those two moves' side effects (rook relocation, captured
  pawn removal), separate from the "real" `applyMove` in `gameEngine.js`
  which also handles bookkeeping (captured-piece lists, castling rights,
  status). Keeping these two board-mutation paths in sync was the main
  source of early bugs.
- Node's native ESM resolution requires explicit file extensions, which
  collided with the extension-less imports used throughout (fine for
  Vite/bundler resolution). Worked around it with a tiny custom loader for
  the throwaway test script rather than changing the app's import style.
