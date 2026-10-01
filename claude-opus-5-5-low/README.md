# Browser Chess

Two-player chess in the browser, built with Vite + React + CSS. The rules engine is written from scratch (no chess libraries).

## Features

- Full move validation, including en passant, castling (with check/through-check rules), and promotion (Queen/Rook/Bishop/Knight picker)
- Check, checkmate, and stalemate detection
- Valid-move indicators, last-move and check highlighting, turn indicator, captured pieces
- Game state persisted in `localStorage`; "Reset Game" button clears it

## Running

Requires Node.js 18+.

```bash
npm install
npm run dev      # start dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # serve the production build
npm test         # run engine unit tests (node:test)
```

## Project structure

```
src/
  engine/      Pure game logic (no React): board, move generation, game state, storage, tests
  hooks/       useChessGame — bridges engine and UI, handles selection/promotion/persistence
  components/  Board, StatusBar, CapturedPieces, PromotionDialog
  App.jsx      Layout
```

## Cost

```
Total cost:            $0.63
Total duration (API):  2m 29s
Total duration (wall): 5m 10s
Total code changes:    898 lines added, 0 lines removed
Usage by model:
   claude-sonnet-4-5:  795 input, 23 output, 0 cache read, 0 cache write ($0.0027)
     claude-opus-5-5:  20 input, 17.7k output, 294.9k cache read, 43.0k cache write ($0.63)
Prompt cache (main):   10 requests · 87% of input tokens from cache · 1 miss (12.9k tokens re-cached)
```
