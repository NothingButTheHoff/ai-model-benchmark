# Browser Chess

A two-player chess game that runs in the browser. It uses Vite, React and plain CSS. The move-validation engine is written from scratch, with no chess libraries.

## Features

- Full rules: legal move validation, castling (both sides, with the out-of/through/into-check rules), en passant, promotion to queen/rook/bishop/knight, and check, checkmate and stalemate detection.
- Click a piece to see its legal moves. Dots mark quiet moves and rings mark captures. The last move and a king in check are highlighted.
- Turn indicator, game status, captured pieces with material advantage, and a Reset Game button.
- The game is saved to `localStorage`, so refreshing the page keeps the current game. Corrupt or tampered saved data is discarded, and a new game starts.

## Requirements

- Node.js 20+ and npm

## Getting started

```bash
npm install
npm run dev       # start the dev server (http://localhost:5173)
npm run build     # production build into dist/
npm run preview   # serve the production build
npm test          # run the engine tests (node:test, no extra dependencies)
```

## Project structure

```
src/
  engine/           Pure game logic (no React, no DOM)
    constants.js    Colors, piece types, values, statuses
    board.js        Board creation and coordinate helpers
    moves.js        Move generation, attack detection, legality filtering
    game.js         Game state transitions (makeMove), castling rights, status
    validation.js   Shape validation for persisted state
    index.js        Public engine API
  storage/          localStorage persistence
  hooks/            useChessGame: connects the engine, the UI state and persistence
  components/       Presentational React components
  App.jsx, App.css  Layout and styling
test/               Engine tests, including perft node counts
```

## Cost

```
Total cost:            $1.23
Total duration (API):  4m 51s
Total duration (wall): 19m 51s
Total code changes:    1185 lines added, 0 lines removed
Usage by model:
     claude-sonnet-5:  1.0k input, 23 output, 0 cache read, 0 cache write ($0.0023)
     claude-opus-5-5:  56 input, 32.6k output, 1.2m cache read, 65.8k cache write ($1.23)
Prompt cache (main):   28 requests · 95% of input tokens from cache · 1 miss (last 19m 4s ago, 12.3k tokens re-cached)
```
