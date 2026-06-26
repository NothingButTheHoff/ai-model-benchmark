# Browser Chess

A two-player browser chess game built with Vite, React, and a custom JavaScript chess engine.

## Run

```bash
npm install
npm run dev
```

Build a production bundle with:

```bash
npm run build
```

## Features

- Full 8x8 board with standard starting position.
- Legal move validation from a custom engine, without chess libraries.
- En passant, castling, promotion, check, checkmate, and stalemate handling.
- Valid move highlights, captured pieces, turn/status display, and reset control.
- Active game persistence through `localStorage`.


## Verdict

# \+
- good solution with ok features
- Clean ui

# –
- more or less similar to the solution with low effort
- small ui glitch
- deleted readme and created a new with only own stats, without any permission or asking. DANGEROUS!!

## Cost

The benchmark requested `/cost`; the supplied session summary is recorded here instead.

| Metric | Value |
| --- | --- |
| Model | `gpt-5.5` |
| Reasoning | `medium` |
| Summaries | `auto` |
| Directory | `~/dev/private/ai-model-benchmark` |
| Permissions | `Workspace (Ask for approval)` |
| Agents.md | `<none>` |
| Account | `API key configured (run codex login to use ChatGPT)` |
| Collaboration mode | `Default` |
| Session | `019f0097-c278-76b1-be2c-0c24f6ea2901` |
| Token usage | `54.7K total (35.6K input + 19.1K output)` |
| Context window | `89% left (39.9K used / 258K)` |
| Limits | `data not available yet` |
| Time spent | `4m 26s` |

Estimated token cost: about `$0.27` using a simple `$5 / 1M tokens` blended estimate against `54.7K` total tokens. Actual billing may differ because Codex/ChatGPT plan pricing, cached input, reasoning, and model-specific input/output rates were not available from the session summary.
