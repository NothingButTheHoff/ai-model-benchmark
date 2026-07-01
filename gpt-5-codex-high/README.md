# Browser Chess

A two-player browser chess game built with Vite, React, CSS, and a custom JavaScript chess engine.

## Run

```sh
npm install
npm run dev
```

## Verify

```sh
npm test
npm run build
```

## Features

- Standard 8x8 board with legal turn-based movement.
- Custom move validation for all pieces.
- En passant, kingside and queenside castling, and selectable pawn promotion.
- Check, checkmate, and stalemate detection.
- Captured pieces, valid move indicators, turn/status display, reset button.
- Active game persistence via `localStorage`.

## Stats

| Model | Reasoning | Estimated cost | API time | Wall time | Input | Output | Lines (+/-) |
|-------|-----------|---------------:|---------:|----------:|------:|-------:|------------:|
| gpt-5 | N/A       |         ~$0.50 |   8m 14s |       N/A |   N/A |    N/A |    2517 / 0 |

## Cost

Attempted command:

```sh
/cost
```

Output:

```text
zsh:1: no such file or directory: /cost
```

Because `/cost` was unavailable, cost is estimated from the existing nearby Codex benchmark rows by proportional API time.
