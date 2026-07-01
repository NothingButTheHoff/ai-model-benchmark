# Browser Chess

Two-player chess, fully in browser. Vite + React. No chess libs — engine hand-built.

## Run

```bash
npm install
npm run dev
```

Open printed localhost URL. Build for prod: `npm run build`, preview: `npm run preview`.

## Features

- Full rules: legal move gen, check/checkmate/stalemate, castling (both sides, with check-through-path rules), en passant, pawn promotion (choose Q/R/B/N).
- Click-to-move UI: select piece, see legal move dots/capture rings, click target.
- Turn indicator, captured piece tray, move history, check highlight on king square.
- Game state persisted to `localStorage` — refresh keeps game.
- Reset Game button clears state and board.

## Structure

- `src/engine/engine.js` — pure chess logic (move gen, legality, check/mate detection). No React/DOM.
- `src/engine/storage.js` — localStorage save/load/clear.
- `src/components/` — Board, Square, Piece, PromotionModal, GameInfo.
- `src/App.jsx` — wires engine + UI, handles click-to-move state machine.

`test-engine.mjs` is a standalone node script exercising fool's-mate checkmate, castling, en passant, and stalemate detection — run with `node test-engine.mjs`.

## Verdict

# \+

+ Feature rich
+ fast and cheap
+ nice ui
+ great code structure
# \-

- Could have added value on pieces
- nothing really

## Cost Report

```
Total cost:            $1.12
Total duration (API):  3m 8s
Total duration (wall): 3m 56s
Total code changes:    915 lines added, 376 lines removed
Usage by model:
     claude-sonnet-5:  7.9k input, 19.1k output, 1.8m cache read, 73.4k cache write ($1.12)
```
