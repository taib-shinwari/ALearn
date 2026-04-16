

## Plan: Duolingo-Inspired UX Overhaul

### Overview
Replace the current minimal UI with a Duolingo-inspired experience featuring custom Button/Container components, streak tracking, progress visualization, richer course data, and improved navigation flow.

### 1. New Component Architecture

**Replace `src/components/ui/button.tsx`** with the user-provided custom Button (rounded-pill style, black/white border, hover inversion). Adapt the import path from `@/Middle/Library/utils` to `@/lib/utils`.

**Create `src/components/ui/container.tsx`** using the user-provided Container component (for non-interactable card surfaces).

**Update all pages** to use the new `variant` and `size` props (`primary`, `secondary`, `ghost`, etc.) since the API changes slightly.

### 2. Streak System

**Update `AppContext.tsx`** — add to state:
- `streak: number` (consecutive days practiced)
- `lastPracticeDate: string | null` (ISO date string)
- `xp: number` (experience points)

**Logic**: On each `recordReview`, check if `lastPracticeDate` is today (no change), yesterday (increment streak), or older (reset to 1). Award XP per correct answer.

**Display on HomePage**: Show streak flame icon with count, and XP total in the navbar area.

### 3. Progress Tracking Per Category/Subcategory

**Add to AppContext**: derive progress from `reviews` — count words with `learned: true` vs total words per category/subcategory.

**HomePage**: Show progress bars or fraction (e.g., "3/4") on each category card.

**CategoryPage / SubcategoryPage**: Show word-level progress indicators (green dot = learned, gray = new).

### 4. Expanded Course Data

**Expand `courseData.ts`** with more subcategories and words:
- Nouns: add Kleding (clothing), Lichaam (body), Eten (food/meals)
- Adjectives: add Emoties (emotions), Weer (weather)
- Verbs: add Beweging (movement), Communicatie (communication)
- Add a 4th category: **Bijwoord** (Adverb) with subcategories

This gives the app more depth and makes practice sessions feel less repetitive.

### 5. UX Improvements (Duolingo-Inspired)

**HomePage redesign**:
- Top area: greeting ("Hi, Demo!"), streak flame + count, XP badge
- Global practice button prominent with progress ring showing overall completion
- Category grid using Container component with progress indicators
- Remove navbar text buttons; use icons only

**Practice flow improvements**:
- Add a session summary screen at the end (words practiced, accuracy %, XP earned, streak update)
- Animate progress bar transitions
- Add encouraging messages on correct answers (randomized: "Nice!", "Great job!", "Keep going!")

**Word detail page**:
- Use Container for the card instead of raw border div
- Add audio placeholder icon (for future TTS)
- Show example sentence if available

**Navigation**:
- Back buttons use the new ghost Button style
- Consistent page transitions

### 6. Settings Page Enhancement

- Show user profile (name, email)
- Show streak stats and XP
- Logout button
- Dark mode toggle (since the Button component supports dark mode)

### Technical Details

- The custom Button drops `class-variance-authority` and `@radix-ui/react-slot` dependencies for the button — uses plain `cn()` utility instead
- Container is a simple presentational wrapper
- All existing `variant="outline"` / `variant="default"` / `variant="destructive"` / `variant="ghost"` usages across ~10 files need updating to match the new Button API
- Streak/XP state persists via the existing localStorage mechanism in AppContext
- No new dependencies needed

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/ui/button.tsx` | Replace with custom component |
| `src/components/ui/container.tsx` | Create new |
| `src/context/AppContext.tsx` | Add streak, lastPracticeDate, xp |
| `src/data/courseData.ts` | Expand with more words/categories, add example sentences |
| `src/pages/HomePage.tsx` | Redesign with streak, XP, progress |
| `src/pages/PracticePage.tsx` | Add session summary, encouraging messages |
| `src/pages/CategoryPage.tsx` | Add progress indicators, use Container |
| `src/pages/SubcategoryPage.tsx` | Add progress indicators, use Container |
| `src/pages/WordDetailPage.tsx` | Use Container, add example sentences |
| `src/pages/SettingsPage.tsx` | Add profile info, streak stats |
| `src/pages/AuthPage.tsx` | Update button variants |
| `src/pages/CoursesPage.tsx` | Update button variants |
| `src/pages/IntroductionPage.tsx` | Update button variants |
| `src/hooks/useCourseLanguage.ts` | Add new UI label keys |

