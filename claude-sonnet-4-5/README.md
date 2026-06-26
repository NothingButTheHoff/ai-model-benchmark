# Browser Chess Game

A fully functional two-player chess game built entirely in the browser using Vite, React, and vanilla CSS. Features a custom-built chess engine with complete rule implementation including all special moves.

## Features

- **Complete Chess Rules**: All standard moves plus special cases:
  - En Passant
  - Castling (Kingside and Queenside)
  - Pawn Promotion with piece selection dialog
  - Check, Checkmate, and Stalemate detection
- **Game State Persistence**: Uses localStorage to save game state - refresh the page without losing your game
- **Visual Indicators**: 
  - Highlighted selected pieces
  - Valid move indicators
  - Turn display
  - Check/Checkmate/Stalemate status
- **Captured Pieces Display**: Track captured pieces for both players
- **Clean UI**: Responsive chess board with Unicode chess pieces

## How to Run

### Development Mode

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to the URL shown (typically `http://localhost:5173`)

### Production Build

```bash
npm run build
npm run preview
```

## Game Controls

- Click a piece to select it (only pieces matching the current turn can be selected)
- Click a highlighted square to move the selected piece
- Click the selected piece again to deselect it
- Click "Reset Game" to start a new game (requires confirmation)

## Project Structure

```
src/
├── engine/
│   └── ChessEngine.js      # Core chess logic and rules
├── components/
│   ├── ChessBoard.jsx      # Main game component
│   ├── ChessBoard.css
│   ├── Square.jsx          # Individual board square
│   ├── Square.css
│   ├── CapturedPieces.jsx  # Captured pieces display
│   ├── CapturedPieces.css
│   ├── PromotionDialog.jsx # Pawn promotion UI
│   └── PromotionDialog.css
├── App.jsx
└── App.css
```

## Technical Details

- **No External Chess Libraries**: Chess engine built from scratch without using chess.js or similar libraries
- **Modular Architecture**: Clean separation between game logic (engine) and UI (React components)
- **State Management**: React hooks for UI state, ChessEngine class for game state
- **Persistence**: localStorage for automatic game state saving

## Dependencies

- React 18.3.1
- Vite 8.0.16

No chess-specific libraries used.

---

## Cost Report

**Session Statistics:**
- Total cost: $1.69
- Total duration (API): 7m 20s
- Total duration (wall): 9m 8s
- Total code changes: 1751 lines added, 308 lines removed

**Usage by model:**
- claude-sonnet-4-5: 382 input, 26.7k output, 3.3m cache read, 81.3k cache write ($1.69)

---

## Evaluation

Pretty good UI, with some minor flaws. Very good code structure with good usage of reusable components. all features in place. Good verification of solution. Some slop (unused vars). Overall a good solution. Not sure why all the markdowns, though
