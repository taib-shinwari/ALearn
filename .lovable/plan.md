# Chess polish, Analysis redesign, and Lessons

## 1. Chess board/UX fixes (`Chessboard.tsx`, `ChessPlayView.tsx`)

- **Drag image**: render only the piece glyph (transparent background, no square). Use an offscreen `<img>` of the piece SVG sized to the square, centered under the cursor via `setDragImage(img, w/2, h/2)`.
- **Smoother performance**: memoize square components, avoid re-rendering the whole board on hover, throttle eval-bar updates.

## 2. Move-time display (`MovesList.tsx`, `ChessPlayView.tsx`)

- Only record/show per-move times when a clock/timer is enabled (`config.minutes > 0`).
- Format inside each cell as `e4  2s` (SAN first, time after, right-aligned with spacing) instead of the current `2s e4`.

## 3. Move-list hover flicker (analysis mode)

- Cause: hovering re-renders the board which re-mounts piece `<img>` and re-runs animation. Fix by:
  - Stable React `key`s per piece (id-based, not index).
  - Memoize `Chessboard` with `React.memo` and only update on FEN/lastMove change.
  - Disable transitions while in analysis preview.

## 4. Analysis view (replaces current game-over panel)

When user clicks **Analyse Game**:

- Hide: moves list, clocks/timer, Rematch, New Game, the Analyse button itself.
- Show a vertical Analysis panel:

```
Player:       White           Black
Accuracy       92.4%          88.1%

By phase
 Opening       95%             92%
 Middlegame    90%             86%
 Endgame        -               -

Estimated rating   1450        1320

Move classification
 Brilliant !!     0     1
 Great    !      0     0
 Book     📖     5     5
 Best     ★     15    21
 Excellent 👍   18    18
 Good     ✓      5     2
 Inaccuracy ?!   2     0
 Mistake   ?     0     1
 Miss      ✗     0     0
 Blunder   ??    1     0

[horizontal stacked color bar — one row per player showing % of each class]

[ Review Game ]   ← primary button
```

- **Review** click → restore the timer column + moves list. Each move cell now:
  - shows a small classification icon to the right of the SAN,
  - cell background tinted with the classification color,
  - and when that move is active on the board, an icon badge floats above the destination piece on the board.
- Bottom of the Review view: `Show Report Card` button → returns to the analysis summary above.

### Implementation
- New `src/components/chess/analysis/` folder:
  - `AnalysisReport.tsx` (summary card),
  - `MoveClassificationRow.tsx`,
  - `ClassificationBar.tsx`,
  - `classification.ts` (enum, colors, icons, thresholds based on centipawn loss; phase split by move number; accuracy via standard `100 * exp(-0.04 * avgCPL)` style formula; rating estimate from accuracy).
- `MovesList.tsx`: optional `classifications` prop to render icon + tinted background.
- `Chessboard.tsx`: optional `moveBadge?: { square, kind }` to render the icon overlay on the active square.
- `ChessPlayView.tsx`: add `view: "play" | "analysis" | "review"` state and swap the right column accordingly.

## 5. Re-add Lessons (Duolingo-style)

- Add a `Lessons` tab to the language section reachable from the language page.
- New files:
  - `src/pages/LessonsPage.tsx` — vertical path of lesson "nodes" (locked / current / done), Duolingo-style with the active node highlighted and a pop-up "Start" bubble.
  - `src/components/lessons/LessonNode.tsx`, `LessonPath.tsx`.
  - `src/components/lessons/LessonRunner.tsx` — runs through a small ordered set of word/phrase exercises (multiple choice + tap-to-build sentence) pulled from existing `courseData` / `useCustomWords`.
  - Route added in `App.tsx`: `/language/:lang/lessons` and a card entry on the language home.
- Progress persisted in `localStorage` under `lessons:<lang>` (units completed, XP).

## Technical notes
- No backend changes required. All new state lives in component state + `localStorage`.
- Classification thresholds (centipawn loss vs best move from existing engine):
  Best ≤ 10, Excellent ≤ 25, Good ≤ 50, Inaccuracy ≤ 100, Mistake ≤ 200, Blunder > 200; Brilliant = only best move avoids mate/large loss; Book = move from a small built-in opening list for first 8 plies.
- Accuracy per phase: avg of per-move accuracy in plies 1–16 (Opening), 17–40 (Middle), 41+ (End).
- Rating estimate: `round(400 + accuracy * 22)` clamped 100–2800 (rough, transparent heuristic).
