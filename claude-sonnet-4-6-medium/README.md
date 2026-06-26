# Chess — claude-sonnet-4-6-medium

A fully functional two-player browser chess game built with Vite + React. No external chess libraries — the engine is written from scratch.

## Features

- Complete chess rules: standard moves for all 6 piece types
- En passant
- Castling (kingside and queenside) with all rule checks (can't castle through/into check)
- Pawn promotion (choose Queen, Rook, Bishop, or Knight)
- Check, checkmate, and stalemate detection
- LocalStorage persistence — refresh the page without losing your game
- Visual indicators: selected piece, valid move dots, capture highlights, check highlight
- Captured pieces display for both players
- Turn indicator with game status

## Tech Stack

- Vite 6
- React 19
- Plain CSS (no UI frameworks)
- No chess logic libraries

## Running Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Building for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  engine/
    pieces.js      — piece/color constants, Unicode symbols
    board.js       — board initialization and helpers
    moves.js       — move generation for all pieces
    rules.js       — check/checkmate/stalemate detection
    gameState.js   — state management, localStorage, move application
  components/
    Board.jsx          — 8x8 grid, click handling, selection
    Square.jsx         — single square with all visual states
    Piece.jsx          — Unicode piece renderer
    CapturedPieces.jsx — captured piece display
    TurnIndicator.jsx  — turn/check/status display
    PromotionModal.jsx — pawn promotion piece selector
  App.jsx    — root component
  App.css    — chess UI styles
```
## Verdict

# \+
- Great solution
- nice UI
- Good code structure

# –
- fairly big code base
- no extra features like points, moves or last move
## Cost Report

```
Session

Total cost:            $1.08
Total duration (API):  6m 36s
Total duration (wall): 8m 7s
Total code changes:    1487 lines added, 356 lines removed
Usage by model:
   claude-sonnet-4-6:  450 input, 25.5k output, 1.1m cache read, 95.2k cache write ($1.08)
```
