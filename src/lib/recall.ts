// Recall (flashcard) queue model — SM-2 spaced repetition scheduling.
//
// Each item tracks ease, consecutive successful reps and the current interval
// (days). After every rating we update those via SM-2 and the item is hidden
// in "Active" until its `readyAt` timestamp elapses, then surfaces in "Recall".

export type RecallScope = "subcategory" | "word";

export interface RecallItem {
  id: string;
  scope: RecallScope;
  categoryId: string;
  subcategoryId: string;
  wordId?: string;
  title: string;
  completedAt: number;
  readyAt: number;
  lastRating: 1 | 2 | 3 | 4 | 5;
  // SM-2 state
  ease: number;          // ease factor, min 1.3
  reps: number;          // consecutive successful reviews
  intervalDays: number;  // current scheduling interval in days
}

const DAY = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;
const LEARNING_STEP_MS = 10 * 60 * 1000; // 10 minutes for a lapse

export interface SM2State {
  ease: number;
  reps: number;
  intervalDays: number;
  intervalMs: number;
}

/**
 * SM-2 scheduler. Rating 1–5 maps directly to SM-2 quality.
 * Quality < 3 = lapse (resets reps, short re-learning step).
 */
export function scheduleNext(
  prev: { ease: number; reps: number; intervalDays: number } | undefined,
  rating: 1 | 2 | 3 | 4 | 5,
): SM2State {
  const ease = prev?.ease ?? DEFAULT_EASE;
  const reps = prev?.reps ?? 0;
  const intervalDays = prev?.intervalDays ?? 0;
  const q = rating;

  if (q < 3) {
    const nextEase = Math.max(MIN_EASE, ease - 0.2);
    return { ease: nextEase, reps: 0, intervalDays: 0, intervalMs: LEARNING_STEP_MS };
  }

  const nextReps = reps + 1;
  let nextInterval: number;
  if (nextReps === 1) nextInterval = 1;
  else if (nextReps === 2) nextInterval = 3;
  else nextInterval = Math.round(intervalDays * ease * 10) / 10;

  // Classic SM-2 ease adjustment.
  const nextEase = Math.max(
    MIN_EASE,
    ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  return {
    ease: nextEase,
    reps: nextReps,
    intervalDays: nextInterval,
    intervalMs: Math.round(nextInterval * DAY),
  };
}

export function recallId(
  scope: RecallScope,
  categoryId: string,
  subcategoryId: string,
  wordId?: string,
): string {
  return `${scope}:${categoryId}:${subcategoryId}${wordId ? `:${wordId}` : ""}`;
}

export function isReady(item: RecallItem, now = Date.now()): boolean {
  return now >= item.readyAt;
}

export function formatCountdown(readyAt: number, now = Date.now()): string {
  const diff = readyAt - now;
  if (diff <= 0) return "ready";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `in ${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 24) return `in ${h}h${rm ? ` ${rm}m` : ""}`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return `in ${d}d${rh ? ` ${rh}h` : ""}`;
}
