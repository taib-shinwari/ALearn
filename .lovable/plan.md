# Plan

Big batch — grouping into 4 shippable areas. Confirm scope before I build.

## 1. Chess Play — pre-game setup + board UX

**Right panel becomes a setup form (game not started until "Play" pressed):**
- Engine Strength slider — only 100 and 200 ELO selectable (step=100, min=100, max=200)
- Color: White / Random / Black (segmented buttons)
- Timer (grouped blocks):
  - No Timer
  - Bullet: 1m, 1|1, 2|1
  - Blitz: 3|2, 5m, 5|5
  - Rapid: 10m, 15|10, 30m, 10|5, 20m, 60m
- Variant: Standard / Chess960 (Fischer Random)
- Toggles: Evaluation Bar, Threat Arrows, Suggestion Arrows, Move Feedback, Engine
- Play button at bottom

**Board behavior:**
- Don't re-sort pieces array on each move — keep stable identity per piece so only position transitions animate (currently `fenToPieces` rebuilds from FEN every move causing visual resort). Track pieces by stable id mapped through moves.
- Click piece: tint square light-blue (not border), show move dots on legal destinations
- Drag pieces (HTML5 drag or pointer events) — same highlight/dots while dragging
- After Play: right panel switches to **Moves list** in PGN-pair format:
  ```
  1. d4   | d5
  2. c4   | dxc4
  ```
- Timers: white below board, black above (flips with orientation)

**Engine:** simple JS engine. 100 ELO = random legal move. 200 ELO = random with light material awareness (avoid hanging queen, take free pieces). No Stockfish.

**960:** chess.js supports Chess960 via custom starting FEN — generate valid back-rank, init game with it.

**Toggles initially wired but non-functional placeholders** (Evaluation Bar / Threat Arrows / Suggestion Arrows / Move Feedback / Engine analysis) — UI present, real logic deferred. ✅ confirm this is OK, otherwise I'd need a real engine.

## 2. Full-page dialogs (no separate route)

Convert these dialogs to full-screen overlays rendered in place, no URL slug, no X close button — the app's back button / hardware back closes them:
- Active Recall
- Add (word/collection)
- Word Edit
- (others using `Dialog` in the same flow)

Intercept browser back via `history.pushState` + `popstate` so back closes the overlay first, then navigates.

## 3. Collections — Add button

- On collection/folder pages (Verb, Adjective, Nederlands root, etc.) add an **Add icon button** on the right side of the breadcrumb row (or below-right if narrow). Icon only.
- Click → small menu: **Word** or **Collection**
- Word → opens (full-page) word editor
- Collection → name + (optional) parent

## 4. Word detail polish

- Top toolbar order: **Language · Speak · Bookmark · Favorite · Edit** (currently Speak · Language · …)
- Container text in word/collection cards: center-aligned
- Card action buttons (Add, Select, etc.): icon-only

---

## Technical notes

- New file: `src/components/chess/ChessSetupPanel.tsx` — form state lifted, emits `GameConfig` on Play
- New file: `src/lib/chessEngine.ts` — `pickMove(game, elo)`
- New file: `src/lib/chess960.ts` — random Fischer back-rank → FEN
- New file: `src/components/chess/ChessClock.tsx` — increments + low-time styling
- New file: `src/components/chess/MovesList.tsx`
- Edit `ChessPlayView.tsx` — orchestrate setup → play; remove status/new-game buttons during setup
- Edit `Chessboard.tsx` — stable piece ids (don't re-derive from FEN every render), click selection tint + legal-move dots, HTML5 drag handlers
- New file: `src/components/ui/full-page-dialog.tsx` — fullscreen overlay + back-button interception
- Migrate Add/Edit/Recall dialog usages to it

## Out of scope / confirm

- Real Stockfish/eval (deferred — placeholder toggles only)
- Move sounds, premoves, draw/resign buttons
- Persisting unfinished games

OK to proceed with the above? Anything you want trimmed (e.g. drop 960, drop timers for now) so I can land a smaller first pass?