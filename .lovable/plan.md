## 1. Chess board interaction

**Click-to-grab micro-animation** (`Chessboard.tsx`)
- On click, briefly scale the piece (≈120ms transform: `scale(1.1)` + slight lift shadow) then return — visual "pick up & drop back" while still showing the move-dot overlay for legal targets.
- Keep current "show dots" behavior.

**Bigger pieces**
- Increase piece SVG size from current `~78%` of square to `92%` of square in `Chessboard.tsx`.

**Move icons in board overlay**
- When viewing a move (review or freeform), render a classification badge at top-right of the moved-to piece (overlay div inside the square).
- Icons: `*` for Best/Brilliant, `x` for Miss, `??` Blunder, `?!` Inaccuracy, `!` Great, `!!` Brilliant — using the existing classification colors.

## 2. Engine strengthening (`src/lib/chessEngine.ts`)

- Add quiescence search (captures only) on top of current alpha-beta minimax.
- Increase max depth from 3 → 4 at top ELO, with iterative deepening + simple move ordering (MVV-LVA + previous best move first).
- Better eval: piece-square tables (already partial) + mobility + king safety (pawn shield) + passed pawn bonus.
- ELO scaling: keep 100–1000 range; lower ELOs add blunder probability and shallower depth (depth 1 + 30% random at 100, depth 4 at 1000).

## 3. Analysis view rebuild (`ChessPlayView.tsx`, `analysis/AnalysisReport.tsx`)

**Replace eval bar with Highcharts-style chart**
- Add `highcharts` + `highcharts-react-official` deps.
- Replace the two-line eval chart with an **area chart** in the user's screenshot style:
  - dark bg, white smoothed area for white advantage, black area below, mid-line at 0
  - colored dots per move using classification color
  - green vertical line marks current move
- Chart is the centerpiece of the report; remove the prior two SVG lines.

**Layout — sub-containers (Cards)**
Each in its own `Card`:
1. Accuracy (white vs black, %)
2. Estimated Rating (white vs black)
3. Move Classification breakdown (counts per type)
4. Eval Chart (the Highcharts area chart)

In classification card: **only the text color** changes per type, not the row background. On the board overlay, the square's color tints with the classification color and an icon shows top-right.

**Review button** uses the standard shadcn `<Button>` component (not custom-styled div).

## 4. Move list + sound panel (above moves list)

New `MoveSoundPanel.tsx` rendered above `MovesList`:
- Plays the move sound when a new move is made (capture/move/check/castle/promote).
- Shows: last move SAN + classification icon + color, then the next 2–3 follow-up moves in notation underneath.
- Hovering a follow-up shows a `HoverCard` with a mini `Chessboard` preview of that position.

## 5. Freeform interaction in analysis/review

- Allow the user to make moves on the board at any history index.
- If the move differs from the mainline next move, branch as a **variation** under that ply:
  ```text
  1. e4 e5
     |_ 1... c5     (user side-line from move 2)
        2. Nf3 ...
  2. Nf3 Nc6
  ```
- Data model: each move node gets optional `variations: MoveNode[][]`. New `MoveTree` type replaces flat array.
- Navigation:
  - Clicking a move (mainline or variation) jumps to that node.
  - "Next" advances within the current branch; if user is inside a variation, next stays in that variation.
  - Going back to the start and playing a new move creates a new top-level variation off ply 0.
- Render moves list as nested tree with `|_` prefix for variations, indented.

## 6. Lessons restructure

**Language home cards** (`HomePage.tsx`)
- For each course language, show TWO buttons: **Lesson** and **Dictionary**.
- Remove the "Add" card from this view (move to the Dictionary page).

**Lessons page (`/lessons/:lang`)** (`LessonsPage.tsx` rewrite)
- Remove the page title and back button. Keep breadcrumbs.
- Render **Sections** as 2D `<Button>` cards in a responsive grid (no zig-zag path, no 3D, no stars):
  - Left: section number (e.g. `01`)
  - Middle: section name (`Beginner`)
  - Right: `12 Lessons`
- Clicking a section reveals its lessons inline (or routes to `/lessons/:lang?section=N`) as a grid of `<Button>` cards:
  - Top: lesson number / item count badge
  - Bottom: thin container with lesson title (e.g. `Alphabet (1)`)
  - No stars.
- Order is enforced — early lessons unlocked, later ones locked.
- Clicking a locked lesson opens an `AlertDialog`: "This lesson is locked. Proceed anyway?" with Cancel / Proceed.

**Lesson runner** at `/lesson/:lang/:lessonId` (single route)
- The lessons grid does NOT use its own slug — only the runner uses `/lesson/...`.
- Existing quiz logic preserved.

**Section data**
- Group existing `courseData[lang].topics` by section (Beginner / Intermediate / Advanced) using a simple bucket function (first N → Beginner, next N → Intermediate, rest → Advanced) until explicit metadata is added.

## 7. Files

**New**
- `src/components/chess/MoveSoundPanel.tsx`
- `src/components/chess/analysis/EvalChart.tsx` (Highcharts)
- `src/lib/moveTree.ts` (variation tree helpers)
- `src/pages/LessonRunnerPage.tsx` (split out of LessonsPage)

**Edited**
- `src/lib/chessEngine.ts` — stronger search + eval
- `src/components/chess/Chessboard.tsx` — bigger pieces, click bounce, classification overlay
- `src/components/chess/ChessPlayView.tsx` — variation tree state, freeform moves, swap chart, Review uses `<Button>`
- `src/components/chess/MovesList.tsx` — tree rendering with `|_` variations, classification text color only
- `src/components/chess/analysis/AnalysisReport.tsx` — Card sub-containers, Highcharts chart
- `src/pages/HomePage.tsx` — Lesson + Dictionary buttons, remove Add
- `src/pages/LessonsPage.tsx` — section/lesson grid, locked dialog, no title/back
- `src/App.tsx` — `/lesson/:lang/:lessonId` route

**Deps**
- `bun add highcharts highcharts-react-official`

## Notes / open assumptions

- Highcharts has a free non-commercial license; if you need a different chart lib (Recharts, visx), say so before I install.
- "Brilliant" mapping for `*` vs Best — I'll use `*` for Best, `★` for Brilliant unless you prefer otherwise.
- Section bucketing uses a heuristic until you give explicit grouping per course.
