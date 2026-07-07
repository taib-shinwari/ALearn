## Goals

1. **Lessons hierarchy** (slug-based, consistent with the rest of the app):
   ```
   /Language/<Lang>/Lessons                              → CEFR levels grid (A1–C2)
   /Language/<Lang>/Lessons/A1                           → units grid (named, e.g. "Getting Started")
   /Language/<Lang>/Lessons/A1/Getting-Started           → lessons (Alphabet, Pronunciation, Hello…)
   /Language/<Lang>/Lessons/A1/Getting-Started/The-Alphabet
                                                          → sub-lessons (Vowels, Consonants, Practice, Lesson)
   /Language/<Lang>/Lessons/A1/Getting-Started/The-Alphabet/Vowels
                                                          → exercise runner (sequence of steps)
   ```
   First-time visit to `/Lessons` redirects to `A1/Getting-Started/The-Alphabet`.

2. **Locking & bypass**
   - A1 unlocked by default. A2…C2 locked until prior level complete.
   - Inside a level, units unlock sequentially. Inside units, lessons unlock sequentially. Sub-lessons inside a lesson run linearly.
   - **Bypass**: 3 quick clicks on a locked card forces unlock (persisted in `localStorage` under `lessonProgress:bypass`). Visual hint: small lock icon dims.

3. **Exercise types** (8–12, used as a step `kind` in lesson JSON):
   `learn`, `flashcard`, `multipleChoice`, `matchPairs`, `buildTranslation`, `fillBlank`, `typeAnswer`, `listenChoose`, `listenType`, `orderSentence`, `imageSelect`, `speaking`. Each rendered by a dedicated component; lesson author picks any subset.

4. **A1 seed content** (English target, UI any of en/nl/ar):
   - Unit "Getting Started" with: The Alphabet, Pronunciation, Hello, Greetings, Introducing Yourself, Yes & No, Numbers 0-10, Goodbye.
   - "The Alphabet" sub-lessons: Vowels, Consonants, Special Letters, Practice, Lesson.
   - Each populated mixing `learn`, `flashcard`, `multipleChoice`, `matchPairs`, `imageSelect`, `buildTranslation`. No `listenType`/`typeAnswer` for non-Latin scripts in A1.

5. **Fix Chess labels** showing only buttons. Use `t("lesson")`, `t("chessPuzzles")`, `t("play")` and ensure CardButton renders centered text reliably.

## Files

**New**
- `Server/Data/Language/<Lang>/Lessons/A1/Getting-Started/<lesson>/<sublesson>.json` — step arrays.
- `Server/API/Lessons.ts` — glob-load lesson tree, expose `getLevels(lang)`, `getUnits`, `getLessons`, `getSubLessons`, `getSteps`.
- `@/Library/lessonsUnlock.ts` — unlock/bypass persistence (extends existing `lessonProgress.ts`).
- `@/Component/Lesson/LessonRunner.tsx` — drives step sequence.
- `@/Component/Lesson/Exercises/*.tsx` — one per exercise kind.

**Edited**
- `@/Component/Lesson/LessonsView.tsx` — replace old browse with level/unit/lesson/sub-lesson grid, lock + triple-click bypass, first-visit redirect.
- `@/Page/Navigation.tsx` — route the new path depths to the right view.
- `@/Library/navigation.ts` — slug ↔ browsePath mapping for the new depth.
- `@/Component/View/Chess.tsx` — use `t()` for menu labels.

## Lesson step JSON shape

```json
[
  { "kind": "learn", "word": "A", "ipa": "/eɪ/", "audio": "...", "image": "..." },
  { "kind": "flashcard", "front": "A", "back": "/eɪ/" },
  { "kind": "multipleChoice", "prompt": "Which is the first letter?", "options": ["A","B","C","D"], "answer": 0 },
  { "kind": "matchPairs", "pairs": [["A","/eɪ/"], ["B","/biː/"]] },
  { "kind": "buildTranslation", "prompt": "Hello, how are you?", "tokens": ["Hello","how","are","you","goodbye"], "answer": [0,1,2,3] },
  { "kind": "imageSelect", "prompt": "Apple", "options": [{"image":"...","correct":true},{"image":"..."}] }
]
```

## Scope notes
- This turn ships the framework + A1/Getting-Started/The-Alphabet content end-to-end and the Chess label fix. Other A1 lessons get stub JSON (one `learn` step) so navigation works; they can be filled in later turns to keep this turn shippable.
- All UI text uses existing `t()` keys; new keys added to all three label files.
- No backend/Cloud changes.

Approve and I'll build it.
