# Development Log

## Approach

I built the engine first and the UI second, deliberately. Chess rules are where
the difficulty lives; the UI is a thin presentation layer once the engine is
correct. Getting an objective correctness signal early (perft) meant I could
build the interface on a foundation I trusted.

## Architecture

### Engine (pure functions, no React)

The engine is a set of pure functions over plain JSON-serializable state. No
classes, no mutation of inputs — every move produces a brand-new state object.
This buys three things: trivial `localStorage` persistence (just
`JSON.stringify`), trivial undo/history (keep old states), and trivial testing
in Node.

State shape:

```js
{
  board,                                  // 8x8 array, cells null | { type, color }
  turn,                                   // 'w' | 'b'
  castling: { wK, wQ, bK, bQ },           // booleans
  enPassant: { row, col } | null,         // target square behind a double-pushed pawn
  halfmove, fullmove,                     // clocks (50-move rule, move number)
}
```

**Board orientation** is fixed and documented once in `constants.js`:
row 0 = rank 8 (Black's back rank, top), row 7 = rank 1 (White's back rank).
White pawns move toward smaller row indices. Pinning this down early avoided a
whole class of "which way is up" bugs.

### State management in the UI

A single hook, `useChessGame`, owns everything: the `game` object, the selected
square, and any pending promotion. The board components are entirely
presentational and receive a precomputed `Map` of legal target squares, so
rendering move hints is a cheap lookup. The hook persists the game to
`localStorage` in a `useEffect` keyed on the game, and loads from it lazily in
the `useState` initializer.

## How the tricky rules were handled

### Move generation & legality

I split it into two layers. `generatePseudoMoves` produces all moves ignoring
whether they leave the king in check. `legalMoves` then filters them by actually
*applying* each move to a cloned state and asking "is my king attacked now?".
This "make-move-then-test" approach is slower than computing pins analytically,
but it is dramatically simpler to get right and, as perft confirmed, correct.

### Check detection without recursion

`isSquareAttacked` is computed directly — it walks knight offsets, king offsets,
pawn-attack squares, and slides along rook/bishop directions — rather than by
generating the opponent's moves. This was a deliberate choice: castling
generation needs to ask "is this square attacked?", and if attack detection were
built on move generation, castling logic could recurse into itself. Keeping
attack detection standalone breaks that cycle cleanly.

### Castling

Generated as part of king moves. The checks, in order: king on its home square
and not currently in check; the relevant right still held; the correct rook
present; the squares between are empty; and the squares the king passes through
*and* lands on are not attacked. Castling rights are revoked whenever the king
moves, a rook leaves its home square, **or** a rook is captured on its home
square — that last case is easy to forget and perft on the Kiwipete position
catches it.

### En passant

The double-push records the *passed-over* square as `enPassant` in the resulting
state. When generating pawn captures, an empty diagonal target that matches the
`enPassant` square produces an en-passant move that stores the captured pawn's
real square (which is on the moving pawn's own row, not the destination). Move
application removes the pawn from that separate square. The legality filter
handles the rare en-passant discovered-check automatically, because it tests the
resulting board like any other move.

### Promotion

Pawn moves reaching the last rank are flagged `isPromotion` with a default of
Queen (so move generation and perft work without UI involvement). The UI
intercepts a promotion move, shows a modal, and re-issues the move with the
chosen piece type before committing it.

### Checkmate vs. stalemate

After each move, the engine computes the status for the side now to move: if it
has no legal moves, it's checkmate when in check and stalemate otherwise. The
50-move rule reports a draw when the halfmove clock reaches 100.

## Verifying correctness

The single most valuable decision was using **perft** as the primary test.
Counting legal-move sequences to a fixed depth and comparing to published
reference numbers exercises every rule simultaneously — a single wrong number
means a bug somewhere in move generation, application, or check detection.

- Initial position: depth 1–4 → 20 / 400 / 8902 / 197281 ✅
- Kiwipete position: depth 1–3 → 48 / 2039 / 97862 ✅

Both matched on the first green run after the targeted edge-case tests passed,
which gave high confidence the engine is rule-complete. Targeted tests cover en
passant removal, castling rook movement, castling-through-check refusal,
promotion piece selection, back-rank checkmate, and stalemate.

## Challenges

- **Orientation bookkeeping.** Mapping (row, col) to ranks/files and pawn
  direction is the easiest place to introduce subtle, hard-to-spot errors.
  Documenting the convention in one place and deriving everything from it (pawn
  direction, start ranks, promotion ranks, home rows) kept it consistent.
- **Castling-right revocation on rook capture.** My first mental model only
  revoked rights when a rook *moved*. Perft on Kiwipete (which has rook captures
  available) would have flagged it; thinking through the perft setup prompted me
  to handle the captured-rook case up front.
- **En passant target square vs. captured square.** Keeping the destination
  square and the captured-pawn square distinct in the move object made
  application unambiguous.

## Possible extensions

Threefold-repetition detection, drag-and-drop piece movement, undo/redo (the
immutable states make this nearly free), and PGN export.
