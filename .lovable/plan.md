## 1. Lesson & Dictionary Theme Unification

Goal: make the Lesson and Dictionary folder views look like the root home view — same background, padding, typography, no black panel.

- `src/components/lessons/LessonsView.tsx`: remove its own `bg-*`/dark wrapper, drop hardcoded `bg-black`/`bg-zinc-950`, inherit `bg-background text-foreground` from `Layout`. Use the same outer container spacing (`px-4 md:px-6 py-6`) as `HomePage` root grid.
- Dictionary folder view (rendered via `HomePage` path `["language", lang, "dictionary"]`): same change — remove dark wrapper, reuse the home grid spacing and `CardButton` rounded-full grid styling.
- Both views render their folder grids inside the existing `HomePage` shell so the navbar/breadcrumb sits on the same background, no nested theme.
- Verify against `src/index.css` tokens; no new colors introduced.

## 2. Chess Engine Rewrite (bitboard + NNUE-flavored eval)

File: `src/lib/chessEngine.ts` (full rewrite, keep the existing `getEngineMove(fen, elo)` and `evaluatePosition(fen)` exports so callers don't change).

Core architecture:
- **Bitboard representation** — 12 `BigInt` boards (one per piece type/color) plus occupancy boards. Move generation built on bit-twiddling (precomputed knight/king attack tables, magic-style ray lookups for sliders implemented as classical ray scans for simplicity).
- **Search**: negamax with alpha-beta, iterative deepening from depth 1 up to the ELO-mapped cap.
- **Transposition table**: Zobrist hashing (random 64-bit keys per piece/square + side + castling + ep), 1M-entry array keyed by `key & mask`, storing `{key, depth, score, flag, bestMove}`.
- **PVS** (principal variation search) — first move searched full window, rest with null window then re-search on fail-high.
- **Null-move pruning** — R=2, disabled in endgame / when in check.
- **Late Move Reductions** — reduce depth for quiet moves after the first 3 at depth ≥ 3.
- **Quiescence search** — captures + promotions + checks, stand-pat with delta pruning.
- **Move ordering**: TT move → MVV-LVA captures → killer moves (2 per ply) → history heuristic.
- **NNUE-flavored eval** at top strength: small handcrafted "accumulator" — piece-square tables + tapered eval (mg/eg) + mobility + king safety (pawn shield, attacker count) + bishop pair + passed/doubled/isolated pawns + rook on open file. Wrapped in `evaluateNNUE(board)` so it can be swapped for a real NNUE blob later without touching search. We do not ship real NNUE weights (binary asset); the function name and layered API matches an NNUE pipeline so the eval bar/arrows consume one source of truth.
- **ELO scaling (100–2000)**: maps to `(maxDepth, randomness, blunderChance, useQS, useNullMove)`. Below 800 we inject blunders by picking from top-N with weighted noise; at 2000 full search, no noise.

Engine exports used by UI:
- `getEngineMove(fen, elo) → {from,to,promotion?}`
- `evaluatePosition(fen) → centipawnsFromWhitePOV` (used by eval bar + chart)
- `getBestLine(fen, depth) → Move[]` (used by analysis arrows + "next optimal lines")

All synchronous, but search is time-bounded (`softTime` derived from ELO) so the UI doesn't freeze. Wrap top-level call in `requestIdleCallback` fallback in `ChessPlayView` when starting engine think.

## 3. Analysis Feedback Panel

Files: `src/components/chess/MoveDetailPanel.tsx`, `src/components/chess/analysis/AnalysisReport.tsx`.

When analysis mode is active AND feedback toggle is on, the panel above the moves list shows for the currently selected move:
1. **Header row**: piece glyph + SAN + classification badge (`*`, `!!`, `!`, `?!`, `?`, `??`, `x`) colored per `CLASS_META`.
2. **Explanation line**: short generated string based on classification + eval delta + tactical hints (e.g. "Best — develops the knight and contests the center", "Blunder — drops the rook to Nxe5", "Miss — missed Qxh7# mate in 1"). Generator is a pure function `explainMove(prevEval, newEval, bestLine, playedMove, board)` in `analysis/classification.ts`.
3. **Next optimal lines**: top 2 engine lines from the position before the move, rendered as SAN sequences (3–4 plies each), hover shows mini-board preview via `HoverCard` (already wired).

Eval bar + suggestion arrows on the board both read from the same `evaluatePosition` / `getBestLine` calls so they stay in sync with what the panel shows.

## 4. Chess.com-Style Pointer Drag

File: `src/components/chess/Chessboard.tsx`.

Replace current mouse/touch handlers with unified **Pointer Events**:
- `onPointerDown` on a piece: `setPointerCapture`, record `{startX, startY, square, pointerId}`, immediately render the piece centered on the cursor (translate by `cursor - squareCenter`) and show move dots. No scale animation.
- `onPointerMove`: if total movement < `DRAG_THRESHOLD` (6px), treat as potential click (piece stays "lifted" at cursor but we don't mark as dragging yet). Past threshold, set `isDragging=true` and follow cursor.
- `onPointerUp`:
  - If never crossed threshold AND released on the same square → click-select (keep selection + dots).
  - If released on a legal target square → play move.
  - If released elsewhere → snap back, keep selection if click-mode, clear if drag-mode.
- `onPointerCancel` / loss of capture → snap back.
- Drag image is the piece SVG with its square background tint preserved (already the case via the piece div); no native HTML5 drag.
- Right-click (`onContextMenu`) reserved for arrows / premove cancel (section 5).

This removes the dual click+HTML5-drag code paths and fixes corner-grab offset.

## 5. Multi-Premove FIFO Queue

File: `src/components/chess/ChessPlayView.tsx` (state) + `Chessboard.tsx` (rendering/input).

State: `premoves: Array<{from, to, promotion?}>` as FIFO queue.

Behavior:
- When it's not the user's turn, attempting a move pushes onto `premoves` if it's pseudo-legal in the projected board (apply queued premoves in sequence on a scratch `Chess` instance to validate the next one).
- Affected squares (every `from` and `to` across the queue) are tinted **red** (`bg-red-500/35`) on the board overlay. Last queued destination gets a brighter red border.
- On engine move completion → `tryFlushPremoves`: pop head, attempt to play; if legal, play it and trigger the engine again (so chained premoves work); if illegal, clear the entire queue.
- **Right-click on any premove square** → cancel entire queue (Chess.com behavior). Right-drag still draws arrows when no premove exists on that square.
- Passive interactions (arrow drawing, square highlight via right-click on empty squares, shift-click highlight) remain available at all times regardless of turn.

## Technical Details

- New helper module `src/lib/bitboard.ts` for board representation + move generation so `chessEngine.ts` stays focused on search/eval.
- Zobrist keys initialized once at module load with a seeded PRNG (deterministic across reloads for reproducible TT behavior in tests).
- `evaluatePosition` memoized per-FEN with an LRU of 512 entries to avoid re-evaluating during analysis chart rendering.
- Premove validation uses `chess.js` `Chess` clones (cheap enough for queue length ≤ 5; cap queue at 5).
- Drag threshold and tint colors exposed as constants at the top of `Chessboard.tsx` for easy tuning.
- No new dependencies.

## Files

Created:
- `src/lib/bitboard.ts`

Edited:
- `src/lib/chessEngine.ts` (rewrite)
- `src/components/chess/Chessboard.tsx` (pointer drag, premove rendering)
- `src/components/chess/ChessPlayView.tsx` (premove FIFO, engine think scheduling)
- `src/components/chess/MoveDetailPanel.tsx` (richer feedback)
- `src/components/chess/analysis/classification.ts` (`explainMove`)
- `src/components/chess/analysis/AnalysisReport.tsx` (consume `getBestLine`)
- `src/components/lessons/LessonsView.tsx` (theme unification)
- `src/pages/HomePage.tsx` (dictionary view wrapper cleanup, shared container)
