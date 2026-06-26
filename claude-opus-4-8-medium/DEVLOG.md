# Development Log

## Architecture

Two hard separations drove every decision:

1. **Engine vs. UI.** `src/engine/chess.js` is pure JavaScript with no React and
   no DOM. It exposes functions over a plain state object: `initialState`,
   `getLegalMoves`, `getAllLegalMoves`, `applyMove`, `isInCheck`, plus
   serialization helpers. The React layer never reaches into board internals to
   decide legality — it only renders state and calls engine functions. This made
   the engine independently testable (see perft below).

2. **State as a single plain object.** The game state is one serializable object:

   ```
   { board, turn, castling, enPassant, halfmove, fullmove,
     history, captured, status, winner }
   ```

   Because it is plain data, persistence is `JSON.stringify`/`parse` with no
   custom marshalling, and React state updates are immutable clones
   (`applyMove` never mutates its input).

### Board representation

An 8x8 array, `board[row][col]`, row 0 = rank 8 (black's back rank, top of
screen), row 7 = rank 1. White moves toward smaller row indices. Each occupied
cell is `{ type, color }`. I considered a 0x88 or bitboard layout but a plain 2D
array is the most readable and is fast enough for a two-player UI — the engine
runs perft(4) (≈197k nodes) in well under a second.

### State management in React

`App.jsx` holds the canonical engine state plus transient UI state (selected
square, computed legal moves for the selection, last move, pending promotion).
The board is fully derived from engine state on each render; legal-move hints
come straight from `getLegalMoves`, so what the UI shows and what the engine
allows can never drift apart. A `useEffect` persists the engine state to
`localStorage` on every change, and the initializer hydrates from it on load.

## Tackling the tricky rules

### Legal vs. pseudo-legal moves

Move generation is two-phase. `pseudoMovesForPiece` generates moves ignoring
king safety. `getLegalMoves` then plays each onto a cloned board and keeps it
only if the mover's king is not in check afterward. This single filter handles
pins, moving into check, and the requirement to resolve an existing check —
without any special-case pin detection code.

Check itself is detected by `isSquareAttacked`, which probes outward from the
king's square for each attacker geometry (pawn diagonals, knight jumps, sliding
rays for bishop/rook/queen, adjacent king). Reusing this one function for "is
the king in check" and "does the king pass through an attacked square while
castling" kept the logic consistent.

### En passant

`applyMove` clears the en passant target each turn, then sets it only on a
double pawn push (to the square the pawn skipped). A pawn capture onto that
target square is flagged `enPassant`, and applying it removes the captured pawn
from the *mover's* starting row rather than the destination square. The capture
is generated only when `state.enPassant` matches, so the right-to-capture
naturally expires after one move.

### Castling

Generated as a king move with a `castle: 'K' | 'Q'` flag, gated by four checks:
castling rights still available, the squares between king and rook empty, and
the king not currently in check / not passing through / not landing on an
attacked square (using `isSquareAttacked`). Rights are revoked in
`updateCastlingRights` whenever the king or a rook moves, **or when a rook is
captured on its home square** — an easy case to miss. `applyMove` moves the rook
alongside the king.

### Promotion

`pseudoMovesForPiece` expands a pawn reaching the last rank into four moves, one
per promotion piece, each tagged with `flags.promotion`. The UI detects the flag
on the chosen destination, shows `PromotionDialog`, and commits the matching
move once the player picks a piece. The engine treats promotion uniformly during
perft, which is why the move counts include under-promotions.

### Checkmate / stalemate / draw

After each move, `updateStatus` asks for all legal moves of the side to move. No
moves + in check = checkmate; no moves + not in check = stalemate; otherwise
check or ongoing. Fifty-move rule triggers a draw at `halfmove >= 100`.

## Verification

Correctness was the main risk for a hand-written engine, so I validated with
**perft** (recursive legal-move enumeration) against published reference counts:

- Start position: depth 1–4 → 20 / 400 / 8902 / 197281 ✅
- "Kiwipete" position (dense castling, en passant, promotion): depth 1–3 →
  48 / 2039 / 97862 ✅

Matching Kiwipete in particular gave high confidence that castling legality, en
passant, promotions, and pin handling are all correct, since that position is
specifically designed to expose those bugs. Test lives in `perft.test.mjs`.

## Challenges

- **Castling-rights edge cases.** The capture-a-rook-on-its-corner case was the
  one that perft initially caught — Kiwipete numbers were off until rights were
  revoked on rook capture, not just rook movement.
- **En passant orientation.** Getting the captured-pawn row right (mover's row,
  not the destination row) required care given the row-0-is-rank-8 layout.
- **Keeping UI and engine in lockstep.** Deriving hints directly from
  `getLegalMoves` rather than re-implementing any movement rules in the UI
  avoided a whole class of divergence bugs.

## Possible extensions

Threefold-repetition draws, insufficient-material draws, drag-and-drop, board
flip for the side to move, and PGN export.
