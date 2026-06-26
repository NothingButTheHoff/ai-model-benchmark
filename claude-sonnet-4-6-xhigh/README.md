# Chess — Browser Two-Player Chess Game

A fully-featured two-player chess game built with Vite + React + CSS. No external chess libraries — the engine is written from scratch.

## Features

- Complete chess engine with all standard rules
- En passant, castling (kingside & queenside), pawn promotion
- Check, checkmate, and stalemate detection
- Valid move highlighting on piece selection
- Captured pieces display with material advantage score
- Turn indicator
- Game state persisted to `localStorage` (refresh-safe)
- Reset / New Game button

## How to Run

### Prerequisites

- Node.js 18+ and npm

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## How to Play

1. Click a white piece to select it — valid moves appear as dots/rings on the board.
2. Click a highlighted square to move.
3. For pawn promotion, a modal appears to choose Queen, Rook, Bishop, or Knight.
4. The turn indicator at the top shows whose turn it is.
5. Check and checkmate are announced in the status bar.
6. Click **Reset Game** to start over.

## Tech Stack

- Vite 8
- React 19
- CSS (no CSS frameworks)
- No chess logic libraries

---

## Verdict

# +
- Pretty nice UI
- All functions in place.
- Good code structure
- Good usage of components and splitting of functionality.
- Able to fix its own mistakes. Overall a good solution.
- showing value of captured pieces
- modular structured codebase

# –
- some color/contrast could've been better
- failed to clean up unused functions and variables.
- failed to count value of pieces when promoting
- don't show last move
- a lot of code
- missed cleanup of unused references

## Cost Report

```
Session

  Total cost:            $1.89
  Total duration (API):  7m 54s
  Total duration (wall): 15m 28s
  Total code changes:    1266 lines added, 376 lines removed
  Usage by model:
     claude-sonnet-4-6:  399 input, 29.8k output, 3.2m cache read, 125.8k cache write ($1.89)
```
