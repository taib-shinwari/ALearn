// Improved spaced repetition (SM-2-lite) with active recall mixing
//
// Each word has an ease factor (default 2.5) that adjusts based on
// performance, and an interval that grows roughly geometrically.
// On a wrong answer the card resets to 'learning' (10-min interval),
// then 1d, then ease-driven growth.

export interface ReviewState {
  wordId: string;
  interval: number;        // current interval in days (can be fractional)
  ease: number;            // SM-2 ease factor (>= 1.3)
  reps: number;            // consecutive correct streak
  nextReview: number;      // timestamp ms
  learned: boolean;        // has been seen at least once
  lapses: number;          // total times forgotten (used to surface tricky words)
}

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;
const LEARNING_STEP_DAYS = 10 / (60 * 24); // 10 minutes
const FIRST_GRADUATION_DAYS = 1;
const SECOND_GRADUATION_DAYS = 3;

export function createReviewState(wordId: string): ReviewState {
  return {
    wordId,
    interval: 0,
    ease: DEFAULT_EASE,
    reps: 0,
    nextReview: 0,
    learned: false,
    lapses: 0,
  };
}

export function updateReview(state: ReviewState, correct: boolean): ReviewState {
  if (!correct) {
    return {
      ...state,
      reps: 0,
      lapses: state.lapses + 1,
      ease: Math.max(MIN_EASE, state.ease - 0.2),
      interval: LEARNING_STEP_DAYS,
      nextReview: Date.now() + LEARNING_STEP_DAYS * 86400000,
      learned: true,
    };
  }

  // Correct path
  let interval: number;
  const reps = state.reps + 1;
  if (reps === 1) interval = FIRST_GRADUATION_DAYS;
  else if (reps === 2) interval = SECOND_GRADUATION_DAYS;
  else interval = Math.round(state.interval * state.ease * 10) / 10;

  // Slight ease bump for repeated success, capped at 2.7
  const ease = Math.min(2.7, state.ease + 0.05);

  return {
    ...state,
    reps,
    ease,
    interval,
    nextReview: Date.now() + interval * 86400000,
    learned: true,
  };
}

export function isDue(state: ReviewState): boolean {
  return Date.now() >= state.nextReview;
}

/**
 * Build a practice queue mixing:
 *   1. Lapsed/learning cards (interval < 1 day) that are due — highest priority
 *   2. Other due reviews, oldest-due first
 *   3. Fresh new words in given order
 *
 * Result is interleaved so the user doesn't see all-new or all-review back-to-back.
 */
export function getNextWordsForPractice(
  reviews: ReviewState[],
  wordIds: string[],
  count = 5,
): string[] {
  const idSet = new Set(wordIds);
  const reviewMap = new Map(reviews.filter(r => idSet.has(r.wordId)).map(r => [r.wordId, r]));

  const now = Date.now();
  const lapsed: string[] = [];
  const due: string[] = [];

  for (const id of wordIds) {
    const r = reviewMap.get(id);
    if (!r || !r.learned) continue;
    if (r.nextReview > now) continue;
    if (r.interval < 1) lapsed.push(id);
    else due.push(id);
  }
  // Oldest due first
  lapsed.sort((a, b) => (reviewMap.get(a)!.nextReview) - (reviewMap.get(b)!.nextReview));
  due.sort((a, b) => (reviewMap.get(a)!.nextReview) - (reviewMap.get(b)!.nextReview));

  const learnedIds = new Set(reviews.filter(r => r.learned).map(r => r.wordId));
  const fresh = wordIds.filter(id => !learnedIds.has(id));

  // Interleave: lapsed first, then alternate due / fresh
  const result: string[] = [];
  while (result.length < count && (lapsed.length || due.length || fresh.length)) {
    if (lapsed.length) result.push(lapsed.shift()!);
    if (result.length >= count) break;
    if (due.length) result.push(due.shift()!);
    if (result.length >= count) break;
    if (fresh.length) result.push(fresh.shift()!);
  }

  return result;
}

/** Number of words from the given list that are due right now. */
export function countDue(reviews: ReviewState[], wordIds: string[]): number {
  const idSet = new Set(wordIds);
  return reviews.filter(r => idSet.has(r.wordId) && r.learned && isDue(r)).length;
}
