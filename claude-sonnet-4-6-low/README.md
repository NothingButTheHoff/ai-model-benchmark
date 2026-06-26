# Chess — claude-sonnet-4-6-low

Two-player browser chess with full rule implementation. Built from scratch with Vite + React.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Features

- Full 8x8 board, all pieces, correct starting positions
- Custom chess engine (zero external chess libraries)
- En passant, castling (kingside/queenside), pawn promotion with piece selection
- Check, checkmate, stalemate detection
- Visual: selected piece highlight, legal move dots/rings, last move highlight
- Captured pieces display for both sides
- Turn indicator with color dot
- localStorage persistence — refresh preserves game state
- Reset Game button

## Verdict

# +
- nice UI and colors
- movements/rules in place
- all rules seems to be in place
- show suggested moved
- shows last move


# - 
- no registration of piece value
- small overlapping ui elements



## Cost

```
Total cost:            $0.72
Total duration (API):  3m 50s
Total duration (wall): 6m 49s
Total code changes:    925 lines added, 382 lines removed
Usage by model:
   claude-sonnet-4-6:  435 input, 15.3k output, 1.1m cache read, 46.5k cache write ($0.72)
```
