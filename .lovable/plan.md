# Combined Fixes Plan

## Part 1 — Chess

### 1. Engine & Elo
- **`src/lib/stockfish.ts`**: Add `sfEvaluateAt(fen, { depth, skill, movetime, multiPV })` and `sfBestMove(fen, { skill, depth, movetime })` helpers that send `setoption name Skill Level value N` and `setoption name UCI_LimitStrength value true` + `UCI_Elo` to the worker before `go`. Cap UCI_Elo at Stockfish's supported range (1320–3190) and use Skill Level 0 + very short movetime for sub-1320 "true beginner" play.
- **`ChessPlayView.tsx`**: Map slider Elo to engine params:
  - `elo <= 400`: Skill 0, movetime 50ms, depth 1, inject random legal move 40% of time at 100 Elo, 20% at 200, 10% at 400.
  - `400 < elo < 1320`: Skill `round((elo-400)/100)` (0–9), movetime 80–200ms.
  - `elo >= 1320`: UCI_LimitStrength true, UCI_Elo = elo, depth scales with elo.
  - Hard cap slider/setup max at **3200**.
- **Estimated Rating & Classification mismatch** (`analysis/classification.ts`): Re-derive rating from accuracy curve (`rating = clamp(400 + accuracy*28 - blunders*40 - mistakes*15, 100, 3200)`) and ensure classification uses post-move eval from the *mover's* perspective (sign flip bug). Fix CPL sign so White and Black are evaluated symmetrically.

### 2. Performance & Stability
- **Report Card hide crash**: In `ChessPlayView.tsx`, the analyse effect likely keeps a Stockfish worker alive / re-runs on unmount. Add `sfTerminate()` on unmount + guard `setState` after unmount with `mounted` ref. Wrap `AnalysisReport` toggle in conditional render that doesn't unmount `EvalChart` mid-calculation (use `hidden` class or memoize).
- **Verify Stockfish**: Add a one-time `console.info("[sf] ready", id)` in `stockfish.ts` worker init; expose `window.__sfPing()` for quick check. Ensure single worker reused per session, not spawned per move (current code spawns per `sfEvaluate` call — switch to a pooled persistent worker with a request queue).

### 3. Piece Interaction & Premoves
- **Click-to-move**: In `Chessboard.tsx` `handleSquare`, when a piece is already selected and target is a legal square, execute the move. Currently selection works but second click doesn't commit — fix the legal-squares lookup so click path uses the same `legalSquares` set as the drag path.
- **Premove visuals**:
  - Add `premoveHighlight` (red) distinct from `lastMove` (light blue) in `Chessboard.tsx`.
  - Allow `beginPieceDrag` / `handleSquare` to accept player moves during opponent's turn when `allowPremoves` setting is on; route through a new `onPremove(from,to,promotion)` prop instead of `onMove`.
  - **Optimistic capture**: In `ChessPlayView.tsx`, maintain `premoveOverlay` state — a shadow board derived from current FEN with the premove applied locally for rendering only. Pass to `Chessboard` via a new `displayFenOverride` prop.
  - **Premove queue**: Store `pendingPremoves: Array<{from,to,promo}>`. After each opponent move, try `chess.move(premove[0])`; if illegal, clear entire queue + overlay + red highlight, restoring captured piece naturally because overlay is dropped.

## Part 2 — Dictionary & Lessons

### 1. Empty by default
- **`src/data/courseData.ts` / dictionary source**: Stop seeding default words/categories. Only the **Alphabet** category remains. Replace any "default words" array with `[]` and update `DictionarySection.tsx` empty-state copy.
- Reset existing localStorage on first load via a versioned key (`dict.v2.initialized`) so existing users get the empty state.

### 2. New-word tracking
- **`LessonsView.tsx`**: Today every render of a question marks all words green. Change `newIds` to be computed **per question step**: a word is green only if `!markedWords.has(id)` *at the moment the question first mounts*. After advancing to the next question, that word is already in `markedWords` so it renders normal. Add it to dictionary on question advance/complete, not on render.

### 3. Intelligent category routing
- New helper `src/lib/dictionaryRouting.ts`:
  - `routeWord(word, defaultPath, customCategories)`:
    1. Determine default path from word metadata (e.g., `Noun/Fruit`).
    2. Scan user's custom categories; for each, compute a theme signature (set of POS + semantic tag of contained words).
    3. If a custom category's signature matches the new word's `{pos, semanticTag}`, route there instead of creating the default.
    4. Otherwise create/use default path.
- Wire into the auto-add flow in `LessonsView.tsx` (replace direct `addWord` call).

### 4. Header progress bar
- **`Layout.tsx`**: Increase the in-header `<Progress>` width from current size to `min-w-[280px] max-w-[480px] flex-1` with `h-2.5` for taller bar.

## Technical Notes

- Stockfish worker pooling: keep one global `Worker` in `stockfish.ts`, with a message-id queue, instead of `new Worker()` per call. This alone removes most of the lag.
- All premove rendering is local-only; never mutate the authoritative `chess.js` instance until the opponent has actually moved.
- Sign convention for CPL: always `cpl = max(0, bestEvalForMover - playedEvalForMover)` where evals are converted to mover's POV before subtraction.

## Files to Edit
- `src/lib/stockfish.ts` (pool + strength options)
- `src/components/chess/ChessPlayView.tsx` (elo map, premove queue + overlay, unmount safety)
- `src/components/chess/Chessboard.tsx` (click-to-move fix, premove red highlight, opponent-turn interaction gating, display-FEN override)
- `src/components/chess/ChessSetupPanel.tsx` (cap 3200)
- `src/components/chess/analysis/classification.ts` (CPL sign + rating formula)
- `src/components/chess/analysis/AnalysisReport.tsx` (mount safety / hidden toggle)
- `src/components/lessons/LessonsView.tsx` (new-word per-step + routing call)
- `src/lib/dictionaryRouting.ts` (new)
- `src/components/settings/sections/DictionarySection.tsx` (empty state)
- `src/data/courseData.ts` (strip seed words)
- `src/components/Layout.tsx` (header progress width)
