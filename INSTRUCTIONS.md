# Project Instructions: Vibe Coding Benchmark - Browser Chess

## Objective
Create a fully functional, two-player chess game running entirely in the browser. The purpose of this project is to evaluate your ability to handle complex state management, strict game logic, and UI rendering without relying on pre-built domain libraries.

## Working Directory (MANDATORY — DO FIRST)
* **Create a NEW directory before any other work.** No chess code, no file writes, nothing happens until your run directory exists. This is the first action you take.
* **Name it the fully qualified model name including reasoning level(Codex) or effort level (Claude)**, e.g. `gpt-5.4-mini-low` (components: model family + version + variant + reasoning level).
* **NEVER overwrite, modify, write into, or delete an existing directory.** Every existing directory belongs to another run and is off-limits.
* **If a directory with your target name already exists, STOP.** Do not reuse it. Create a distinct new directory instead.
* **All new files go inside your directory only.**

## Core Features
* **Complete Chess Board:** Render a standard 8x8 board with all pieces in their correct starting positions.
* **Custom Game Engine:** You must build the move-validation and game-state engine from scratch. Keep track of whose turn it is and validate all player moves.
* **Strict Rule Adherence:** Your engine must successfully implement standard moves AND complex edge cases, specifically:
    * En Passant
    * Castling (Kingside and Queenside, including rule checks like moving out of/through check)
    * Pawn Promotion (allow the user to select Queen, Rook, Bishop, or Knight)
    * Check, Checkmate, and Stalemate detection.
* **Persistence:** The game state must be saved to the browser (e.g., `localStorage`) so that refreshing the page does not reset an active game.
* **UI Components:** Include clear visual indicators for valid moves when a piece is selected, a turn indicator (White/Black's turn), captured pieces, and a "Reset Game" button.

## Coding Standards & Architecture
* Use common coding standards for clean code.
* Structure the code in a human-readable, modular way (e.g., separate the game logic/engine from the React UI components).
* Ensure rigorous error handling so the application does not crash upon invalid user inputs.

## Tech Stack & Constraints
* **Stack:** Vite + React + CSS.
* **STRICT CONSTRAINT:** Dependencies must be kept at an absolute bare minimum. **You are explicitly forbidden from using external chess logic or chess UI libraries** (e.g., no `chess.js`, `react-chessboard`, etc.). You must write the engine yourself.

## Benchmark Isolation (MANDATORY)
This is a competitive benchmark. Your solution must be produced entirely on your own. See **Working Directory (MANDATORY — DO FIRST)** above: always create a new directory, never overwrite an existing one.
* **You MUST NOT use, read, open, list, copy, or take inspiration from any other model's solution.** Every sibling directory in this repository (e.g., `gpt-5/`, `opus-4-1/`, `opus-4-8/`, and any others) contains another model's work and is strictly off-limits.
* **You MUST NOT inspect the contents of any directory other than your own.** Do not `ls`, `cat`, `grep`, `find`, read files, or otherwise access anything outside the working directory you create for yourself.
* Work only inside your own working directory plus the shared `INSTRUCTIONS.md` and `README.md` at the repo root. Nothing else in the repo may be accessed.
* Any reference to, or reuse of, another solution invalidates the benchmark result.

## Deliverables & Workflow
1.  **Iterate and Verify:** Iterate, verify, and refactor your code until you have a working, bug-free version that builds successfully.
2.  **README.md:** Create a standard readme explaining how to run the project.
3.  **DEVLOG.md:** Create a file documenting your development process. Include your architectural decisions for the state management, how you tackled the complex edge cases (like En Passant/Castling), and any challenges you faced during generation.
4.  **Cost Reporting:** At the end of the session, run `/cost` and add its output to the `README.md`.
