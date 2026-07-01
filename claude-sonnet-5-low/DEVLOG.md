# Development Log

## Architecture

Engine (`src/engine/engine.js`) fully separate from React. State is a plain object:
`{ board, turn, castling, enPassant, captured, history, status, winner }`. Board is
8x8 array, row 0 = rank 8. Engine exports pure functions (`createInitialState`,
`getLegalMoves`, `getAllLegalMoves`, `makeMove`) — no mutation of input state,
always returns new state. This keeps React's `useState` model trivial: `setState(s => makeMove(s, move))`.

Move generation: pseudo-legal moves per piece (ignoring self-check), then filtered
by simulating each move and checking if own king ends up attacked
(`isSquareAttacked`, ray-cast per direction + knight/pawn/king offsets — no
magic bitboards, this is a hobby-scale engine not a search engine).

## Edge cases

- **Castling**: tracked via `castling: {wK,wQ,bK,bQ}` booleans, revoked on king/rook
  move or rook capture. Legality check requires: rook present, squares between
  empty, king not currently in check, and king doesn't pass through or land on an
  attacked square (checked via `isSquareAttacked` on each transit square).
- **En passant**: `enPassant` field on state holds the capturable square, set only
  right after a pawn double-step and cleared every move after (since it's
  recomputed fresh from `move.doubleStep` each `applyMoveRaw` call, no stale-state bug).
- **Promotion**: pseudo-legal move generator emits 4 separate move objects (one per
  promotion piece) when a pawn reaches the last rank. UI collects all 4 candidates
  matching the clicked target square and pops a modal; the chosen one is passed
  back into `makeMove`.
- **Checkmate/stalemate**: after each move, compute `getAllLegalMoves` for the
  opponent. Zero moves + in check = checkmate; zero moves + not in check = stalemate.

## Verification

No test framework wired in (kept deps minimal per constraints). Wrote a
throwaway `test-engine.mjs` run via plain `node` against the engine module
directly — covers fool's mate (checkmate), a full castling sequence, an en
passant capture, and a constructed stalemate position. All passed on first
full run after one bug fix (see below). Also did a manual `vite build` and a
smoke-served `curl` of the dev server.

## Bugs hit during build

- Initial `isInCheck` check for castling legality was called before `board`
  was destructured from `state` in one spot — caught immediately by the node
  test throwing on the castle-through-check condition. Fixed by using `board`
  consistently from the closure.
- First en-passant capture attempt cleared the wrong pawn (used `to.row` for
  captured pawn lookup instead of offsetting by the capturing pawn's color) —
  caught by test asserting the captured square was empty.

## Persistence

`localStorage`, JSON-serialized full state, single fixed key. Wrapped in
try/catch (private browsing / quota can throw) — persistence degrades silently
rather than crashing the app.
