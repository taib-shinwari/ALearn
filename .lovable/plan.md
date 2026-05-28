
# Better-than-Duolingo: phased roadmap

Two focus bets, executed in phases:
1. **Smarter learning engine** — adaptive, weakness-targeted, mastery-based.
2. **Deeper AI voice tutor** — natural call you can pick up anytime, with gentle live correction.

Path structure shifts from a linear list to a **non-linear skill tree** where Speaking / Listening / Vocab / Grammar branches advance independently.

---

## Phase 1 — Skill-tree foundation + mastery model

Goal: replace the linear unit list with a real tree, and track *mastery per skill node* (not just "lesson done").

**Skill tree**
- New data model in `src/data/skillTree.ts`:
  - `SkillNode { id, title, branch: 'speaking'|'listening'|'vocab'|'grammar', tier: number, prereqs: string[], lessons: PathLesson[] }`
  - Migrate current `PATH_SECTIONS` content into nodes, tagging each by branch.
- New `SkillTree.tsx` component replacing `LearningPath.tsx`:
  - Visual tree (CSS grid by tier, SVG connector lines between prereqs).
  - A node unlocks when *all prereqs* hit mastery ≥ 2 stars (not just "completed").
  - Branches render side by side on desktop, stacked on mobile.
- Keep `Container` + `Button` aesthetic — no custom palette.

**Mastery model**
- Extend `LessonProgressEntry` with `masteryLevel: 0–5` and `lastPracticedAt`.
- Mastery decays over time (half-life ~10 days) so nodes can become "rusty" and resurface — Brilliant doesn't do this; Duolingo does it poorly.
- Helper `lib/mastery.ts` exposes `getNodeMastery(node, progress, reviews)` used by the tree to color nodes (locked / available / learning / mastered / rusty).

**Persistence**
- Store `pathProgress` and `reviews` in Lovable Cloud (table `user_progress`) keyed by `user_id`, mirrored to localStorage for offline. New migration + RLS so each user only reads/writes their own row.

---

## Phase 2 — Adaptive practice engine

Goal: every session targets *your* weaknesses, not the next item in a list.

- Rewrite `lib/spacedRepetition.ts` into `lib/adaptiveEngine.ts`:
  - SM-2-style intervals **plus** weakness weighting: items with low accuracy or slow response get boosted priority.
  - Mixed sessions: 60% due reviews, 30% new from current node, 10% interleaved from sibling nodes (interleaving beats blocking — research-backed, neither competitor does it well).
- Per-exercise calibration: track which exercise *types* the user fails (e.g. listening vs typing) and bias future sessions toward those.
- Add new exercise types in `components/practice/exerciseGenerator.ts`:
  - `tap-tiles` (build sentence from word tiles)
  - `dictation` (full sentence, not just word)
  - `match-pairs`
- Session length adapts to recent accuracy (5–15 items).
- End-of-session screen shows mastery delta per skill node touched.

---

## Phase 3 — AI voice call tutor (the headline feature)

Goal: tap the Call button → instant, natural voice conversation in the target language with gentle correction.

**Conversation flow**
- Refactor `AICallOverlay.tsx` into a continuous loop instead of push-to-talk:
  - Browser STT → send transcript → stream LLM reply → TTS plays → auto-restart STT on silence.
  - Visual: animated orb that pulses while listening / speaking, transcript ticker below.
- "Hang up" + "mute" buttons. Long-press orb to interrupt the AI.

**Backend (`supabase/functions/ai-tutor`)**
- Switch to **streaming** via AI SDK (`streamText`, `toUIMessageStreamResponse`) so first audio plays in <1s.
- System prompt upgrades:
  - Knows the user's current skill node, recent mistakes, target vocab → naturally weaves them in.
  - Replies in 1–2 sentences, always asks a follow-up.
  - Tracks corrections in a structured side-channel tool call `recordCorrection({ original, corrected, rule })` so we can show a post-call debrief.
- After hang-up: **call summary screen** — list of corrections, new words encountered, mastery bumps applied automatically.

**Voice quality**
- Keep browser SpeechSynthesis as fallback.
- Add optional higher-quality TTS via Lovable AI Gateway later (Phase 5).

---

## Phase 4 — Stories & immersion (lightweight)

Short bonus we can ship cheaply once the engine + tutor exist:
- AI-generated mini-stories (4–6 sentences) at the user's level, using their known vocab.
- Tap any word → translation + add-to-review.
- One new story per day per language. Stored in `cached_stories` table, regenerated on demand.

---

## Phase 5 — Polish

- Premium TTS voice via gateway.
- Pronunciation scoring (compare STT transcript to expected phonemes, basic char-distance heuristic — no extra API).
- Keyboard shortcuts on practice screen (1–4 to pick MC option, Enter to check).
- Tree zoom/pan on mobile.
- Empty-state and onboarding polish for new languages.

---

## Technical details

**Data**
- `skillTree.ts`: branches `speaking | listening | vocab | grammar`. Each existing subcategory becomes 1–3 nodes (lesson + review + checkpoint).
- New table `user_progress` (`user_id uuid pk`, `path_progress jsonb`, `reviews jsonb`, `updated_at`). RLS: user can rw own row only. GRANTs for `authenticated` + `service_role`.
- Local cache in `AppContext` syncs on login, debounced writes on change.

**Adaptive engine selection formula (sketch)**
```text
score(item) = w_due * overdueness
            + w_weak * (1 - accuracy)
            + w_type * typeWeakness(item.type)
            - w_recent * recencyPenalty
pick top-N by score, then shuffle within score bands
```

**AI tutor streaming**
- Edge function uses `streamText` + `toUIMessageStreamResponse` from `npm:ai` per the AI SDK pattern. Client uses `fetch` + `ReadableStream` (no `useChat` needed since we render to TTS, not chat bubbles).
- Tool: `recordCorrection` with Zod schema; results accumulate in client state and feed the debrief screen.

**Files touched**
- New: `src/data/skillTree.ts`, `src/components/SkillTree.tsx`, `src/lib/mastery.ts`, `src/lib/adaptiveEngine.ts`, `src/components/practice/exercises/{TapTiles,Dictation,MatchPairs}.tsx`, `src/components/ai-tutor/{CallOrb,Debrief}.tsx`, `src/pages/StoryPage.tsx`.
- Edited: `LearningPath.tsx` → replaced, `AppContext.tsx`, `AICallOverlay.tsx`, `exerciseGenerator.ts`, `PracticePage.tsx`, `HomePage.tsx`, `supabase/functions/ai-tutor/index.ts`.
- Migrations: `user_progress` table + RLS + GRANTs.

---

## Suggested first slice (start here after you approve)

**Phase 1 only**: skill-tree data model + visual tree + mastery scoring + cloud-persisted progress. This alone already differentiates from all three competitors. We then iterate phase by phase based on what feels best in your hands.
