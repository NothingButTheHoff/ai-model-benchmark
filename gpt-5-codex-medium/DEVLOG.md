# Development Log

## Architecture

The app is split into `src/chessEngine.js` and `src/App.jsx`. The engine owns board state, move generation, move application, and game status. React treats the engine as the source of truth and only stores UI concerns such as the selected square and a pending promotion choice.

Board coordinates use zero-based `{ row, col }` pairs with row `0` as Black's back rank and row `7` as White's back rank. Pieces are compact objects with `color` and `type` keys. Game state also tracks castling rights, en passant target, captured pieces, clocks, and the previous move for UI highlighting.

## Rule Handling

Legal moves are generated in two passes. First, each piece creates pseudo-legal moves according to its movement pattern. Then the engine applies each candidate to a cloned state and rejects any move that leaves that side's king in check.

Castling is generated only when the king and rook are still eligible, the path is empty, the king is not currently in check, and neither transit nor destination squares are attacked. En passant stores the target square after a two-square pawn advance and removes the captured pawn from the adjacent file when applied. Promotion is represented as a legal move flag; the UI asks the player to choose queen, rook, bishop, or knight before committing the move.

Checkmate and stalemate are derived from the current side's check state and whether any legal move remains.

## Verification Notes

The implementation was designed for browser-only play with persistence via `localStorage`. Invalid move attempts are ignored by the UI, while the engine throws on illegal direct calls so invalid inputs do not silently corrupt state.

Verification run:

- `npm run build` completed successfully.
- Initial position generated 20 legal moves.
- Targeted engine checks confirmed en passant availability, both castling sides, promotion flagging, Fool's Mate checkmate detection, and a no-legal-move stalemate fixture.
