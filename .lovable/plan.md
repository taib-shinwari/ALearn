A big batch of changes spread across lessons, alphabet, dictionary, chess, and routing. Grouped below so we can confirm scope before I start.

## 1. Alphabet (English + others)

Replace the current static alphabet table with interactive activities:

- **Listen & Write** (English): TTS speaks a letter, user types it. Validate case-insensitively, show ✓ / ✗, advance.
- **Match Pairs** (memory cards): grid of face-down cards; flip two at a time to match uppercase ↔ lowercase of the same letter. Round ends when all pairs matched.
- A small picker at the top of the alphabet screen lets the user choose which activity to run; default rotates between them per session.
- Arabic alphabet stays as a viewer for now (letters don't have upper/lowercase); we can add a "listen & tap the letter you heard" variant in a follow-up.

## 2. Lessons flow

### Breadcrumbs
`Beginner > Greetings` instead of `Beginner > Lesson`. Pull the actual lesson title from the data instead of the literal string `"Lesson"` in `Layout.tsx`'s crumb builder.

### Lesson UI
Add proper question types and a footer action bar:

- **Multiple Choice Questions** as a new lesson step type alongside whatever exists today. Options are tappable; selecting one highlights it. `Check` stays disabled until an option is selected.
- **Footer buttons**
  - Mobile: stacked, `Check` on top, `Skip` below.
  - Desktop: side-by-side, `Skip` left, `Check` right.
  - `Check` starts disabled (muted), enables once an answer is chosen.
- **Wrong answer state**
  - Hide `Skip`.
  - Show the correct answer inline ("Correct answer: …").
  - Show a `Report` icon button (flag icon) for users to report bad questions.
  - `Check` becomes `Continue`.
  - Re-queue the missed question to reappear at the end of the lesson.
- **Correct answer**: `Check` becomes `Continue`, advance to next step.

## 3. Dictionary categorization

Today the dictionary lands directly on subcategories like "Greetings". Insert a part-of-speech layer above it:

`Dictionary > Vocabulary > Noun / Adjective / Verb / Phrase / … > Greetings > word`

We'll tag each existing subcategory in `courseData.ts` with a `partOfSpeech` field, then group the subcategory list under those headings. Untagged items fall under "Other" until tagged.

## 4. Arabic (MSA) lessons

Add a parallel set of beginner-level lessons for Arabic (Modern Standard Arabic) mirroring the structure of the English ones (greetings, numbers, basic phrases), with Arabic script + transliteration + audio. Scope for v1: the Beginner section only; Intermediate/Advanced come later.

## 5. Add Language (with Pashto)

In the language picker, add a **+** button that opens a sheet listing additional languages a user can enable. Include **Pashto** marked as "Preview — limited content". Selecting it adds it to the user's active languages and routes into a stub language home that explains content is still being added.

## 6. Chess lessons — one star at a time

In `ChessLessonView`, force sequential stars regardless of `freeOrder`: only the next uncollected star is rendered. Total per lesson stays at 3 (update `randomStars`/`stars` defaults so each lesson resolves to exactly 3 stars).

## 7. Route casing — partial

I want to push back on part of this one:

- **Route paths** (`/settings` → `/Settings`, `/recall` → `/Recall`, `/sign` → `/Sign`): doable. I'll update the router, `navigate(...)` calls, and the `startsWith` checks in `Layout.tsx`. URLs become capitalized.
- **Folder and file names** (`src/` → `Src/`, `components/` → `Components/`, etc.): I'd recommend **against** this. React/Vite/Tailwind/shadcn all assume lowercase `src`, and case-sensitive Linux deploys (including Lovable's) will break on mixed casing. Convention across the entire JS ecosystem is lowercase folders.

  If you still want it after seeing that, say so and I'll do it — but I'd like to skip it by default.

## Technical notes

- Lesson question-queue logic lives in whatever lesson runner powers `lessonProgress`; I'll extend it to support a `requeueOnWrong` flag and an MCQ step type.
- Dictionary grouping is pure data + a render pass in the dictionary view — no schema changes.
- Pashto/Arabic content will be seeded with a small starter set; not full coverage.
- Chess single-star: just change the `activeStars` memo to always take `[stars[nextIdx]]` and seed 3 stars per lesson.
- Route renames touch `App.tsx` routes, every `navigate("/settings"|"/recall"|"/sign")`, and the `location.pathname.startsWith(...)` guards in `Layout.tsx`.

## Confirm before I build

1. OK to **skip** renaming `src/` and component folders, and only capitalize the URL routes?
2. For the Add-Language `+`, is a simple in-app toggle list fine, or do you want it persisted to your Cloud account?
3. Arabic + Pashto starter content: I'll seed ~10 beginner phrases each. Want more?
