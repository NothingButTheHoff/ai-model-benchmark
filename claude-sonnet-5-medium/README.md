# Browser Chess

Two-player chess, fully playable in one browser tab. Custom-built move-validation
engine (no chess libraries) with a React UI on top.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`). Two players share
the board and take turns clicking pieces.

Other scripts:

```bash
npm run build    # production build to dist/
npm run preview  # serve the production build locally
npm run lint     # oxlint
```

## Features

- Full rule set: legal-move filtering, check/checkmate/stalemate detection,
  castling (both sides, with all the "can't castle through/into check" checks),
  en passant, and pawn promotion (choose queen/rook/bishop/knight).
- Click a piece to see its legal moves highlighted; click a highlighted square
  to move.
- Captured-piece tray for each side, turn indicator, check/checkmate/stalemate
  banner, and a Reset Game button.
- Game state is saved to `localStorage` after every move, so refreshing the
  page resumes the game in progress.

See `DEVLOG.md` for architecture notes and how the trickier rules were handled.


## Verdict

# \+

+ OK UI, but some mistakes
+ good code structure
+ good features
+ good verification, but steals time from implementation

# \-

- liked the "low" effort solution better, so not worth it


## Cost report

```
Total cost:            $2.36
Total duration (API):  5m 58s
Total duration (wall): 8m 54s
Total code changes:    1160 lines added, 378 lines removed
Usage by model:
     claude-sonnet-5:  9.1k input, 31.1k output, 4.6m cache read, 133.2k cache write ($2.36)
```
