// Adaptive practice engine. Sits on top of spacedRepetition (which still
// owns the per-card ease/interval state) and decides:
//   1. Which words to surface this session (60% due / 30% new / 10% sibling)
//   2. How long the session should be (5–15, scaled by recent accuracy)
//   3. Which exercise *type* to pick for a word (biased toward weak types)

import { ReviewState, isDue, getNextWordsForPractice } from "./spacedRepetition";
import type { ExerciseType } from "@/components/practice/exerciseGenerator";

export interface TypeStat { attempts: number; correct: number }
export type TypeStats = Partial<Record<ExerciseType, TypeStat>>;

/** Smoothed failure rate for a type — defaults to 0.5 with zero data. */
export function typeWeakness(stats: TypeStats, type: ExerciseType): number {
  const s = stats[type];
  if (!s || s.attempts < 2) return 0.5;
  return 1 - s.correct / s.attempts;
}

/**
 * Pick the most useful exercise type for this word from `available`,
 * weighted toward types the user struggles with. Mild randomization so
 * we don't pin the user to one type forever.
 */
export function pickExerciseType(
  stats: TypeStats,
  available: ExerciseType[],
): ExerciseType {
  if (available.length === 0) return "mc-target-to-ui";
  const weights = available.map(t => 0.3 + typeWeakness(stats, t));
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < available.length; i++) {
    r -= weights[i];
    if (r <= 0) return available[i];
  }
  return available[available.length - 1];
}

/**
 * Adaptive session length. Strong recent accuracy → shorter, snappier
 * sessions. Lots of mistakes → longer practice. Clamped 5–15.
 */
export function adaptiveSessionSize(reviews: ReviewState[]): number {
  if (reviews.length === 0) return 8;
  // "Recent" = last 20 reviews by nextReview timestamp
  const recent = [...reviews].sort((a, b) => b.nextReview - a.nextReview).slice(0, 20);
  const totalReps = recent.reduce((a, r) => a + r.reps + r.lapses, 0);
  const totalCorrect = recent.reduce((a, r) => a + r.reps, 0);
  if (totalReps === 0) return 8;
  const acc = totalCorrect / totalReps;
  // 90%+ → 6, 50% → 12, < 30% → 15
  if (acc >= 0.9) return 6;
  if (acc >= 0.75) return 8;
  if (acc >= 0.6) return 10;
  if (acc >= 0.4) return 12;
  return 15;
}

export interface SelectOpts {
  reviews: ReviewState[];
  scopeWordIds: string[];
  siblingWordIds?: string[];
  count: number;
}

/**
 * Build the session word list:
 *  - 60% due reviews (weighted by lapses + overdue-ness)
 *  - 30% fresh new words from scope
 *  - 10% interleaved from sibling nodes (cross-skill mixing)
 * The result is interleaved, not blocked, to maximize retention.
 */
export function selectSessionWords(opts: SelectOpts): string[] {
  const { reviews, scopeWordIds, siblingWordIds = [], count } = opts;
  const dueTarget = Math.round(count * 0.6);
  const newTarget = Math.round(count * 0.3);
  const sibTarget = Math.max(0, count - dueTarget - newTarget);

  const scopeSet = new Set(scopeWordIds);
  const now = Date.now();

  // 1. Due/weak scoring within scope
  const scoredDue = reviews
    .filter(r => scopeSet.has(r.wordId) && r.learned && isDue(r))
    .map(r => ({
      id: r.wordId,
      // Heavier weight to lapses + overdueness
      score: r.lapses * 2 + Math.max(0, (now - r.nextReview) / 86_400_000),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, dueTarget)
    .map(x => x.id);

  // 2. New (never learned) words from scope
  const learnedSet = new Set(reviews.filter(r => r.learned).map(r => r.wordId));
  const fresh = scopeWordIds
    .filter(id => !learnedSet.has(id))
    .slice(0, newTarget);

  // 3. Sibling-node interleave
  const sibPool = siblingWordIds.filter(id => !scopeSet.has(id));
  const siblings = shuffle(sibPool).slice(0, sibTarget);

  // 4. Backfill if any bucket fell short — re-use the SR helper for safety
  let combined = interleave([scoredDue, fresh, siblings]);
  if (combined.length < count) {
    const need = count - combined.length;
    const fallback = getNextWordsForPractice(reviews, scopeWordIds, need + combined.length)
      .filter(id => !combined.includes(id));
    combined = [...combined, ...fallback.slice(0, need)];
  }
  return combined.slice(0, count);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Round-robin interleave so types aren't blocked together. */
function interleave<T>(groups: T[][]): T[] {
  const out: T[] = [];
  const max = Math.max(0, ...groups.map(g => g.length));
  for (let i = 0; i < max; i++) {
    for (const g of groups) if (i < g.length) out.push(g[i]);
  }
  return out;
}
