# Chess — claude-opus-4-6-medium

A fully functional two-player chess game built with Vite + React. Custom game engine with no external chess libraries.

## Features

- Complete chess rules: all standard moves, en passant, castling (king/queenside), pawn promotion
- Check, checkmate, and stalemate detection
- Legal move highlighting with dots and capture rings
- King check indicator (red highlight)
- Captured pieces display
- Game state persistence via localStorage
- Reset game button

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Build

```bash
npm run build
npm run preview
```

## Verdict

# \+
- Cost/speed vs solution is good.
- Ok features, but mostly basic

# –
- no extra features
- white pieces on both sides (filled/transparent)

## Cost

| Metric | Value |
|--------|-------|
| Total cost | $1.18 |
| API time | 3m 47s |
| Wall time | 6m 6s |
| Lines changed | 927 added, 376 removed |
| Model | claude-opus-4-6 |
| Input tokens | 436 |
| Output tokens | 13.7k |
| Cache read | 1.1m |
| Cache write | 47.3k |
