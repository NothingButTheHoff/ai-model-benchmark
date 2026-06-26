# Browser Chess

Two-player chess in the browser. Custom engine, no external chess libraries. Built with Vite + React + CSS.

## Features

- Full 8x8 board with standard starting position
- Custom move-validation engine (written from scratch)
- En passant, castling (with check rules), pawn promotion (Q/R/B/N picker)
- Check, checkmate, and stalemate detection
- Valid-move highlighting, turn indicator, captured pieces, reset button
- Game state persisted to `localStorage` (survives page refresh)

## Run

```bash
cd opus-4-8-low
npm install
npm run dev      # http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview
```

## How to play

Click a piece to see its legal moves (green dots; red outline = capture). Click a
highlighted square to move. On promotion, a picker appears. "Reset Game" clears the
board and storage.

## Verification

Engine validated with perft: 20 moves at depth 1, 400 at depth 2, 8902 at depth 3 —
matching the known reference values for the starting position.

## Verdict

# \+
- ok UI and ok colors. Not too glamorous
- have most of features included
- small and compact codebase
# –
- lacks pieces value
- lack "last move"
- UI not very polished
- code could be cleaner and more modular

## Cost

```
Total cost:            $0.82
Total duration (API):  2m 20s
Total duration (wall): 3m 9s
Total code changes:    711 lines added, 0 lines removed
Usage by model:
     claude-opus-4-8:  5.4k input, 11.9k output, 339.9k cache read, 52.5k cache write ($0.82)
```
