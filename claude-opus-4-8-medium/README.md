# Browser Chess

A fully functional, two-player chess game running entirely in the browser. The
move-validation and game-state engine is written from scratch — no `chess.js`,
no `react-chessboard`, no external chess logic or UI libraries.

## Features

- Standard 8x8 board with correct starting position and Unicode pieces.
- Custom engine with full rule support:
  - Legal move generation with check/pin filtering
  - **En passant**
  - **Castling** (kingside & queenside, with all the "can't castle out of /
    through / into check" and empty-square rules)
  - **Pawn promotion** (choose Queen, Rook, Bishop, or Knight)
  - **Check, checkmate, and stalemate** detection
  - Fifty-move-rule draw detection
- **Persistence:** the full game state is saved to `localStorage`, so refreshing
  the page resumes the active game.
- UI: legal-move hints (dots for moves, rings for captures), turn indicator,
  check highlight, last-move highlight, captured-pieces tray, move list, and a
  **Reset Game** button.

## Requirements

- Node.js 18+ and npm.

## Run

```bash
npm install
npm run dev
```

Open the printed local URL (default http://localhost:5173).

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Test the engine

A perft (move-enumeration) test verifies the engine against known node counts
from the starting position and the "Kiwipete" position:

```bash
node perft.test.mjs
```

Expected output: all `OK` (start depth 1–4 and Kiwipete depth 1–3).

## How to play

1. Click a piece of the side to move. Legal destinations are highlighted.
2. Click a highlighted square to move. Click another own piece to reselect, or
   click elsewhere to deselect.
3. On promotion, pick the piece from the dialog.
4. Use **Reset Game** to start over.

## Project structure

```
src/
  engine/chess.js        # pure game engine (no React) — all rules live here
  components/
    Board.jsx            # 8x8 grid
    Square.jsx           # single square + piece + hints
    Sidebar.jsx          # turn, status, captures, move list, reset
    PromotionDialog.jsx  # promotion picker modal
  pieces.js              # Unicode glyph mapping
  App.jsx                # state management, input handling, persistence
  styles.css
```
## Verdict

# \+
- Great UI and features!
- OK code structure
- Speed/cost is great when considering solution

# – 
- Could have structure the code a bit better, extracting more code into smaller parts
## Cost Report

```
Total cost:            $1.39
Total duration (API):  4m 29s
Total duration (wall): 5m 51s
Total code changes:    1484 lines added, 8 lines removed
Usage by model:
     claude-opus-4-8:  5.5k input, 23.1k output, 761.6k cache read, 64.2k cache write ($1.39)
```
