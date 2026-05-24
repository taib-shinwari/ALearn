# Plan

## 1. Enable Quranic Arabic as a learnable course
**Why missing:** `getLearnableLanguages()` in `src/pages/CoursesPage.tsx` (line 21‑23) hard‑filters to only `nl`/`en`.

- Allow `ar` as a target language. Keep the 3‑language mutual exclusion: a language used as interface cannot be a target, and vice‑versa.
- Seed minimal Quranic Arabic word data so the Learning Path has something to point at (small starter set: greetings, common nouns, a few verbs). Stored under existing `courseData` shape (add `ar` words to subcategories or a parallel `ar` course bundle keyed by `toLang`).
- Update `learningUnits.ts` so lessons resolve their content based on the *active* target language (currently subcategory ids are Dutch‑centric).

## 2. Persistent learning‑path progress
**Current state:** progress is derived from `reviews` in `AppContext`, which already persists to `localStorage`. But lesson “completed/locked” is recomputed each render from word‑level reviews only — explicit lesson completion (e.g. checkpoints) and per‑lesson stars aren't stored.

- Add a `pathProgress` slice to `AppContext`:
  ```ts
  pathProgress: Record<string /* lessonId */, {
    stars: 0|1|2|3;
    completedAt?: number;
    attempts: number;
  }>
  ```
- Persist via the existing `localStorage` effect (already in place).
- Update `lessonProgress()` in `learningUnits.ts` to merge word‑review derived progress *and* explicit `pathProgress`.
- After a Practice session that was launched from a lesson, mark that lesson complete (pass `lessonId` through `practiceScope`).
- Locked state uses persisted progress, so refresh keeps the right node highlighted.

## 3. Refactor Learning Path UI → Brilliant style
Replace the current zig‑zag in `src/components/LearningPath.tsx` with a Brilliant‑inspired layout:

```text
┌─ Section: Everyday Basics ──────────────┐
│ ┌────────────────────────────────────┐  │
│ │ ◐  Unit 1 · Say Hello              │  │
│ │     Greetings & goodbyes           │  │
│ │     ●●●○  3 / 4 lessons            │  │
│ │     [ Continue ]                   │  │
│ └────────────────────────────────────┘  │
│ ┌────────────────────────────────────┐  │
│ │ 🔒 Unit 2 · People & Pets          │  │
│ └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

- Stacked **unit cards** with progress ring + subtitle + Continue CTA.
- Tapping a card expands inline to show its 1–2 lessons (chips with state: done / current / locked).
- Section header is a slim chapter title, no big gradient banner.
- Glass styling consistent with the rest of the app (matches Core memory rules).
- Current lesson has a subtle pulse; locked units are dimmed with a lock icon.

## 4. Remove "About" from Settings
- Delete the `about` entry from `SETTINGS_CATEGORIES` in `src/components/settings/constants.ts`.
- Remove the `case "about"` branch and import from `SettingsPage.tsx`.
- Delete `src/components/settings/sections/AboutSection.tsx`.

## 5. "Call AI" button — talk to a tutor
A floating Call button (phone icon, glass styling) available on Home / Learning Path / inside a lesson.

- Opens a full‑screen call UI: animated orb, live caption, mute / end‑call controls.
- Uses **Lovable AI** via a `chat` edge function streaming responses.
- Voice in: Web Speech API `SpeechRecognition` (browser native, no extra deps).
- Voice out: `SpeechSynthesis` with a voice matching the active target language (`ar`, `nl`, `en`).
- System prompt is target‑language aware: *"You are a friendly tutor helping the user practice {targetLang}. Speak mostly in {targetLang}, fall back to {interfaceLang} for explanations. Keep replies under 2 sentences."*
- No backend persistence of the conversation (in‑memory only) — matches "no XP/streaks/subs" minimalism.

Requires enabling **Lovable Cloud** + **Lovable AI Gateway** (no API keys needed from the user).

## Files touched
- `src/pages/CoursesPage.tsx` — allow `ar` target
- `src/data/courseData.ts` — seed minimal Arabic content (or new `src/data/arabicCourse.ts`)
- `src/data/learningUnits.ts` — target‑lang aware + merge persisted progress
- `src/context/AppContext.tsx` — add `pathProgress` slice + setter
- `src/components/LearningPath.tsx` — Brilliant‑style card layout
- `src/pages/PracticePage.tsx` — accept `lessonId` in scope, mark complete on finish
- `src/components/settings/constants.ts`, `src/pages/SettingsPage.tsx`, delete `AboutSection.tsx`
- `src/components/AICallButton.tsx` *(new)* + `src/components/AICallOverlay.tsx` *(new)*
- `src/components/Layout.tsx` — mount the floating Call button
- `supabase/functions/ai-tutor/index.ts` *(new edge function)* — streams to Lovable AI Gateway

## Out of scope (per your message)
No XP, streaks, leaderboards, subscriptions, hearts, or gem economy.
