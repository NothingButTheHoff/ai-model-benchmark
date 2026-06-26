# Browser Chess

A fully functional, two-player chess game running entirely in the browser.
The move-validation engine and game-state logic are written from scratch — no
external chess libraries.

Built with **Vite + React + plain CSS**.

## Features

- Full 8×8 board with standard starting position and Unicode pieces.
- Custom engine implementing all standard rules **and** the hard edge cases:
  - En passant
  - Castling (kingside & queenside, including the "can't castle out of, through,
    or into check" rules)
  - Pawn promotion (choose Queen, Rook, Bishop, or Knight)
  - Check, checkmate, and stalemate detection
  - 50-move-rule draw
- Click a piece to see **valid move hints** (dots for moves, rings for captures).
- Turn indicator, check/checkmate/stalemate banner, and last-move highlight.
- **Captured pieces** for each side with a material-advantage badge.
- Move history list.
- **Persistence:** the active game is saved to `localStorage`, so refreshing the
  page keeps the game going.
- "Reset Game" button to start over.

## Requirements

- Node.js 18+ (the engine test suite uses the built-in `node:test` runner).

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

### Production build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

### Tests

The engine is validated with [perft](https://www.chessprogramming.org/Perft)
node-count checks (initial position to depth 4, plus the "Kiwipete" position to
depth 3) and targeted edge-case tests.

```bash
npm test
```

## Project structure

```
src/
  engine/            Pure, framework-agnostic chess engine
    constants.js     Piece codes, colors, board orientation
    board.js         Board creation, helpers, algebraic notation
    attacks.js       Square-attack & check detection
    moves.js         Move generation, legality filtering, move application
    game.js          Status, captures, history, persistence (de)serialization
    engine.test.js   Perft + edge-case tests
  components/        Presentational React components
    Board.jsx, Square.jsx, GameStatus.jsx,
    CapturedPieces.jsx, MoveHistory.jsx, PromotionDialog.jsx
  hooks/
    useChessGame.js  State, interaction, and localStorage glue
  pieces.js          Unicode glyph map
  App.jsx, main.jsx, styles.css
```

The design keeps the engine completely independent of React: it is a set of
pure functions operating on plain state objects, which makes it
straightforward to test in Node and reason about.

## Verdict

# \+
- very good chess game
- has all features
- points + moves 
- code structure

# –
- some UI alignment 
- fairly big project

## Cost Report

Output of `/cost` for this session:

```
Total cost:            $2.03
  Total duration (API):  6m 56s
  Total duration (wall): 8m 1s
  Total code changes:    1943 lines added, 11 lines removed
  Usage by model:
       claude-opus-4-8:  5.6k input, 35.3k output, 1.3m cache read, 77.4k cache write ($2.03)
```
