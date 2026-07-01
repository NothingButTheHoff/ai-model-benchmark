# Browser Chess

A fully functional two-player chess game that runs entirely in the browser. The move-validation and game-state engine is implemented from scratch — no chess logic or chess UI libraries are used.

## Features

- Complete 8x8 board with standard starting position, rendered with Unicode chess glyphs (no image assets).
- From-scratch move generation and legality checking (pins, checks, and all).
- En passant, castling (kingside/queenside, including the "can't castle out of/through/into check" rules), and pawn promotion with a piece picker (Queen/Rook/Bishop/Knight).
- Check, checkmate, and stalemate detection.
- Turn indicator, captured-piece tally with material advantage, legal-move highlighting, last-move highlighting.
- Game state persists to `localStorage`, so a page refresh resumes the in-progress game.
- Reset Game button (with a confirmation prompt) to start over.

## Running it

```bash
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

Other scripts:

```bash
npm run build    # production build
npm run preview  # preview the production build
npm run lint     # oxlint
npm run test     # engine unit tests (Node's built-in test runner)
```

## Tech stack

Vite + React + plain CSS. Dependencies are kept to the framework/tooling minimum — no chess libraries, no UI kit, no test framework beyond Node's built-in `node:test`/`node:assert`.

## Project structure

```
src/
  engine/          pure-JS chess engine (no React, no DOM)
    board.js       board representation & coordinate helpers
    attacks.js     attacked-square computation (shared by checks & castling)
    moveGen.js     pseudo-legal + legal move generation, castling, en passant
    game.js        game state, applyMove, check/checkmate/stalemate status
    __tests__/     engine unit tests
  hooks/
    useGame.js     React state wrapper: selection, promotion flow, persistence
  components/      Board, Square, GameInfo, CapturedPieces, PromotionModal
  App.jsx
```

See `DEVLOG.md` for architecture notes and how the trickier rules were implemented.

## Verdict

# \+
- test coverage
+ calculates piece value 

# \-
- boring UI
- all white pieces!!
- time and cost!!! 

## Cost

```
Session

Total cost:            $3.90
Total duration (API):  10m 30s
Total duration (wall): 11m 59s
Total code changes:    1476 lines added, 377 lines removed
Usage by model:
     claude-sonnet-5:  9.3k input, 58.0k output, 7.4m cache read, 209.5k cache write ($3.90)
```
