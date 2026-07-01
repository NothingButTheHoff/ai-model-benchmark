# Getting started

To benchmark a new model, start the agent in this directory and use the following prompt

`Create a new working directory and name it the same as the current model. All new files should go into this directory. Once the directory has been created, start the work based on the instructions found in
  INSTRUCTIONS.md`

## Benchmark Results

Each row summarizes one run, pulled from that run's `README.md`. Missing values are `N/A`.

| Run                      | Model             | Reasoning |   Cost | API time | Wall time | Input | Output | Lines (+/−) | My rating |                                                                                Comment |
|--------------------------|-------------------|-----------|-------:|---------:|----------:|------:|-------:|------------:|----------:|---------------------------------------------------------------------------------------:|
| Haiku-4.5                | claude-haiku-4-5  | N/A       |  $0.63 |   3m 53s |    6m 47s |   397 |  29.5k |  1146 / 282 |      4/10 |                                                     Fast and quite good for time spent |
| claude-sonnet-4-5        | claude-sonnet-4-5 | N/A       |  $1.69 |   7m 20s |     9m 8s |   382 |  26.7k |  1751 / 308 |      5/10 |                                                                   Slow but ok solution |
| claude-sonnet-4-6-low    | claude-sonnet-4-6 | low       |  $0.72 |   3m 50s |    6m 49s |   435 |  15.3k |   925 / 382 |      9/10 |                                                            Great solution vs cost/time |
| claude-sonnet-4-6-medium | claude-sonnet-4-6 | medium    |  $1.08 |   6m 36s |     8m 7s |   450 |  25.5k |  1487 / 356 |      8/10 |    Cheap, but very good solution. Not top score due to time spend and lack of features |
| claude-sonnet-4-6-xhigh  | claude-sonnet-4-6 | xhigh     |  $1.89 |   7m 54s |   15m 28s |   399 |  29.8k |  1266 / 376 |      8/10 |                                                   Slow and expensive but nice solution |
| claude-opus-4-6-medium   | claude-opus-4-6   | medium    |  $1.18 |   3m 47s |     6m 6s |   436 |  13.7k |   927 / 376 |      7/10 |                 Failed to set correct colors on pieces. Base features, so not the best |
| claude-opus-4-6-max      | claude-opus-4-6   | max       |  $3.15 |  12m 56s |   27m 31s |   442 |  51.9k |   886 / 386 |      6/10 |                                           Too much time spent and lacking features $$$ |
| claude-opus-4-8-low      | claude-opus-4-8   | low       |  $0.82 |   2m 20s |     3m 9s |  5.4k |  11.9k |     711 / 0 |      7/10 |                                                Fast, cheap, but a bit limited solution |
| claude-opus-4-8-medium   | claude-opus-4-8   | medium    |  $1.39 |   4m 29s |    5m 51s |  5.5k |  23.1k |    1484 / 8 |      8/10 |                                      Only code structure to keep it out of #1 position |
| claude-opus-4-8-high     | claude-opus-4-8   | high      |  $2.03 |   6m 56s |     8m 1s |  5.6k |  35.3k |   1943 / 11 |      7/10 |                           Good solution. But not full score due to time spend and cost |
| gpt-5-codex-low          | gpt-5.5           | low       | ~$0.15 |   2m 29s |       N/A | 27.1k |  11.3k |     931 / 0 |      7/10 |         Great result based on cost/price. Code structure is rather poor with few files |
| gpt-5-codex-medium       | gpt-5.5           | medium    | ~$0.27 |   4m 26s |       N/A | 35.6k |  19.1k |         N/A |      6/10 | Almost the same as low effort but almost twice the time and price. Deleted the readme! |
| gpt-5-codex-high         | gpt-5.5           | high      | ~$0.50 |   8m 14s |       N/A | 37.2k |    22k |    2517 / 0 |       7/8 |             Codewise the biggest solution. Nice game, but not very good code structure |

Notes:
- Reasoning level is taken from the run directory name (per `INSTRUCTIONS.md`); runs without a level suffix show `N/A`.
- Input/Output are non-cache token counts as reported by `/cost`; `gpt-5.4-mini-low` reports total session tokens instead. Cache read/write tokens are omitted for brevity — see each run's `README.md`.
- Lines (+/−) = lines added / removed.
- `gpt-5-codex` cost is estimated from the provided session token usage because metered limits/pricing were reported as unavailable.
- `gpt-5` cost is estimated from nearby Codex benchmark cost-per-API-time rows because `/cost` was unavailable.
