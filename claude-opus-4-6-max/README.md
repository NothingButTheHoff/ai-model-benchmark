# Chess — Browser-Based Two-Player Game

A fully functional two-player chess game running entirely in the browser, built with Vite + React + CSS. All game logic is implemented from scratch with no external chess libraries.

## Features

- Complete 8x8 board with all pieces in correct starting positions
- Custom chess engine with full move validation
- En passant, castling (kingside & queenside), pawn promotion
- Check, checkmate, and stalemate detection
- Visual indicators for valid moves, selected piece, last move, and check
- Turn indicator and captured pieces display
- Game state persistence via localStorage
- Board coordinate labels (files a-h, ranks 1-8)
- Reset Game button

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## Architecture

```
src/
  engine/index.js         Pure chess logic (no React dependency)
  hooks/useChessGame.js   State management + localStorage persistence
  components/
    Board.jsx             8x8 grid rendering
    GameInfo.jsx          Turn indicator, status, captured pieces
    PromotionDialog.jsx   Piece selection for pawn promotion
  App.jsx                 Main composition
  App.css                 All styles
```
## Verdict

# + 
- Quite nice ui


# \-
- All white pieces (fill/transparent)
- no tracking of piece values
- wasted a lot of time
- expensive

## Cost

| Metric | Value |
|---|---|
| Total cost | $3.15 |
| Duration (API) | 12m 56s |
| Duration (wall) | 27m 31s |
| Code changes | 886 lines added, 386 lines removed |
| Model | claude-opus-4-6 |
| Usage | 442 input, 51.9k output, 2.3m cache read, 113.3k cache write |
