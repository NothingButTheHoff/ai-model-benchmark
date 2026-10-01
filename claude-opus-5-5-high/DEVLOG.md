# Development Log

## Approach

1. Scaffolded a minimal Vite + React project by hand. The only runtime dependencies are `react` and `react-dom`. The only dev dependencies are `vite` and `@vitejs/plugin-react`.
2. Built the engine first as pure JavaScript modules with no React imports, so Node can test it directly.
3. Verified the engine with perft tests before writing any UI.
4. Built the UI on top of a single custom hook.
5. Ran an end-to-end smoke test in headless Chromium. Playwright ran from a temporary directory outside the project, so it is not a project dependency.

## State management

The game state is a plain, serializable object:

```js
{
  board,            // 8x8 array of { type, color } | null; row 0 = rank 8
  turn,             // 'w' | 'b'
  castlingRights,   // { w: { kingSide, queenSide }, b: { ... } }
  enPassantTarget,  // square that can be captured onto en passant, or null
  capturedBy,       // { w: [types], b: [types] }
  lastMove,         // { from, to } for highlighting
  status,           // 'playing' | 'check' | 'checkmate' | 'stalemate'
}
```

- **Immutable transitions.** `makeMove(state, from, to, promotion)` returns a new state, or `null` when the move is illegal. It never throws on bad input. The UI keeps the current state when it gets `null`.
- **Engine and UI are separate.** `useChessGame` owns the React state. This includes the game state, the selected square and a pending promotion. It also saves the game state to `localStorage` in an effect after every change. Components are presentational and receive props only.
- **Derived data is not stored.** Legal moves for the selected piece are computed with `useMemo`. The checked king square and material balance are derived when the app renders.
- **Persistence is defensive.** When the app loads a saved game, it validates the full shape: board dimensions, piece types, exactly one king per side, castling rights, squares and captured lists. Invalid data is removed. The app does not trust `status` from storage. It recomputes `status` from the position instead.

## Edge cases

- **Legality.** Each piece first generates pseudo-legal moves. The engine applies every candidate move to a copy of the board and rejects it if the mover's king is attacked afterward. This one rule covers pins, moving into check, discovered checks, and the en passant "horizontal pin" case.
- **Attack detection.** `isSquareAttacked` looks outward from the target square for each attacker type: pawns, knights, the king, and sliders along rays. It does not generate opponent moves. This is fast, and it avoids recursion through castling generation.
- **En passant.** A pawn double step sets `enPassantTarget` to the skipped square. Any other move clears it, so the capture is only available immediately. The move is flagged `isEnPassant`, and `applyMoveToBoard` removes the pawn beside the capturing pawn (same row as `from`, column of `to`).
- **Castling.** The `CASTLING_SIDES` table describes each side: the rook column, the king and rook targets, the squares that must be empty, and the squares that must not be attacked. Castling is generated only if all of these are true:
  - the side still has its castling right
  - the king is on e1 or e8 and not in check
  - the rook is present
  - the squares between king and rook are empty
  - the squares the king passes through and lands on are not attacked
  On the queen side, b1/b8 must be empty but may be attacked. Rights are lost when the king moves, and when any move starts or ends on a rook's home corner. This also covers a rook that is captured on its corner.
- **Promotion.** Pawn moves to the last rank are flagged `isPromotion`. The engine rejects a promotion move unless it gets a valid choice (`q`/`r`/`b`/`n`). In the UI, the hook stores the move as `pendingPromotion` and opens a modal. The move is committed only after the player picks a piece. Escape, Cancel or a click on the backdrop cancels the move.
- **Game end.** After every move, `computeStatus` checks whether the side to move has a legal move and whether its king is in check. The result is checkmate, stalemate, check or playing. `makeMove` rejects all moves after the game ends.

## Verification

- `npm test` runs 15 tests. These include **perft** node counts on four standard positions: the start position, "Kiwipete", the en-passant-pin endgame, and a promotion-heavy position (up to 43,238 nodes). Each count matches the published reference value. Perft checks every rule interaction across many positions at once, so it is the strongest test of a move generator.
- Targeted tests cover each castling restriction, en passant timing, promotion choice validation, checkmate, stalemate, check, invalid input, and validation of persisted state.
- A browser smoke test played a Scholar's Mate and reloaded in the middle of the game to confirm persistence. It also promoted a pawn through the dialog, injected corrupt `localStorage` data, and checked for console errors (none).

## Challenges

- **Piece glyph colors.** Unicode outline glyphs (♔) look poor on dark squares, and some platforms render ♟ as a color emoji. All pieces use the filled glyphs with a text-presentation selector (`U+FE0E`) and `font-variant-emoji: text`. CSS sets the color: white pieces get a light fill with a dark outline shadow, and black pieces get a dark fill.
- **Castling and attack recursion.** If castling used full move generation to find attacked squares, castling generation would call itself recursively. The ray-based attack check avoids this.
- **Layout.** The side panel wrapped under the board at desktop widths because its width was a percentage inside a container that sized to its content. Giving the layout container an explicit width fixed this.
