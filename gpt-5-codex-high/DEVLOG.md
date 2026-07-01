# Development Log

## Architecture

The app is split into a pure chess engine and React rendering layer:

- `src/chessEngine.js` owns board state, legal move generation, move application, castling rights, en passant targets, promotion, captured pieces, and terminal status.
- `src/App.jsx` owns selection state, promotion choice UI, persistence, and board rendering.
- `src/chessEngine.test.mjs` validates the highest-risk rule paths with Node `assert`.

The board uses an 8x8 array indexed as `[row][col]`, with row `0` representing rank 8 and row `7` representing rank 1. Pieces are small serializable objects: `{ type, color }`.

## Rule Handling

Legal moves are produced in two passes. The engine first creates pseudo-legal moves for the selected piece, then simulates each move and rejects any move that leaves the moving side's king in check. This keeps pins, king movement, check evasions, and discovered attacks consistent across all pieces.

Castling is generated only when the king and rook are on their home squares, castling rights still exist, all required intermediate squares are empty, the king is not already in check, and the king does not cross or land on an attacked square.

En passant is represented as the skipped square after a two-square pawn move. The opposing pawn may capture into that square only on the immediately following turn, and the captured pawn is removed from its adjacent square.

Promotion is flagged by the engine when a pawn reaches the final rank. The React layer pauses for the player to choose queen, rook, bishop, or knight, then applies the move with the selected piece type.

Checkmate and stalemate are computed after every finalized state by checking whether the current player is in check and whether any legal move remains.

## Verification Notes

The engine tests cover:

- Initial legal move count.
- En passant capture and captured-piece accounting.
- Kingside and queenside castling.
- Rejection of castling through check.
- Knight promotion.
- Fool's mate checkmate.
- Corner stalemate.

The UI stores the full serializable game state in `localStorage` and rehydrates it defensively on load. Invalid saved data falls back to a fresh game rather than crashing the app.
