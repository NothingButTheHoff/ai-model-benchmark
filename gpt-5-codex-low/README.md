# Browser Chess

A two-player browser chess game built with Vite, React, and CSS. The chess rules engine is implemented from scratch without external chess logic or board UI libraries.

## Features

- Standard 8x8 board with correct starting position.
- Turn tracking and legal move highlighting.
- Full custom move validation for standard piece movement.
- King safety filtering for all legal moves.
- Castling, including blocked path, moved king/rook, check, and through-check restrictions.
- En passant.
- Pawn promotion with queen, rook, bishop, and knight choices.
- Check, checkmate, and stalemate detection.
- Captured piece display, recent move list, reset button, and localStorage persistence.

## Run

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Build

```bash
npm run build
```

## Verification

Production build passes:

```bash
npm run build
```

Focused engine checks were also run for Fool's Mate checkmate detection, en passant availability, and kingside castling availability.

## Verdict

# \+ 
- super fast
- nice features
- clean an pretty nice UI, not overkill
- cheap!!

# –
- code structure (few files, but acceptable considering the price)
- small UI glitch (transparancy)
- no points on captured pieces or "last move" indicator

## Cost Report

`/cost` output was not available directly in this shell environment, but the session summary provided after the run was:

```text
Model:                gpt-5.5 (reasoning low, summaries auto)
Directory:            ~/dev/private/ai-model-benchmark
Permissions:          Workspace (Ask for approval)
Agents.md:            <none>
Account:              API key configured (run codex login to use ChatGPT)
Collaboration mode:   Default
Session:              019f008a-de31-7062-80d5-647bd93d3b43

Token usage:          38.4K total  (27.1K input + 11.3K output)
Context window:       94% left (27.7K used / 258K)
Limits:               data not available yet
```

Estimated cost: approximately `$0.15`, using an assumed text-token rate of `$1.25 / 1M input tokens` and `$10.00 / 1M output tokens`:

```text
(27,100 / 1,000,000 * 1.25) + (11,300 / 1,000,000 * 10.00) = $0.146875
```
