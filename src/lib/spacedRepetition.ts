// Simple spaced repetition system
// Intervals: 1 day, 3 days, 7 days, 30 days

export interface ReviewState {
  wordId: string;
  interval: number; // current interval in days (0 = new, 1, 3, 7, 30)
  nextReview: number; // timestamp
  learned: boolean; // has been seen at least once
}

const INTERVALS = [0, 1, 3, 7, 30];

export function getNextInterval(currentInterval: number, correct: boolean): number {
  if (!correct) return INTERVALS[0]; // reset to beginning
  const idx = INTERVALS.indexOf(currentInterval);
  if (idx === -1 || idx >= INTERVALS.length - 1) return INTERVALS[INTERVALS.length - 1];
  return INTERVALS[idx + 1];
}

export function createReviewState(wordId: string): ReviewState {
  return {
    wordId,
    interval: 0,
    nextReview: 0, // immediately available
    learned: false,
  };
}

export function updateReview(state: ReviewState, correct: boolean): ReviewState {
  const newInterval = getNextInterval(state.interval, correct);
  return {
    ...state,
    interval: newInterval,
    nextReview: Date.now() + newInterval * 24 * 60 * 60 * 1000,
    learned: true,
  };
}

export function isDue(state: ReviewState): boolean {
  return Date.now() >= state.nextReview;
}

export function getNextWordsForPractice(
  reviews: ReviewState[],
  wordIds: string[],
  count: number = 5,
): string[] {
  const result: string[] = [];

  // First: due reviews (spaced repetition)
  const dueReviews = reviews
    .filter(r => wordIds.includes(r.wordId) && r.learned && isDue(r))
    .sort((a, b) => a.nextReview - b.nextReview);

  for (const r of dueReviews) {
    if (result.length >= count) break;
    result.push(r.wordId);
  }

  // Then: new words in order (linear progression)
  const learnedIds = new Set(reviews.filter(r => r.learned).map(r => r.wordId));
  for (const id of wordIds) {
    if (result.length >= count) break;
    if (!learnedIds.has(id) && !result.includes(id)) {
      result.push(id);
    }
  }

  return result;
}
