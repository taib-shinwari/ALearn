// Recall (flashcard) scheduling.
//
// Supports multiple algorithms via a strategy interface. Default is FSRS
// (a modern, more accurate spaced-repetition algorithm). SM-2 is also
// available and can be swapped in by changing DEFAULT_STRATEGY.

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
  // Legacy SM-2 state (kept for compatibility / display).
  ease: number;
  reps: number;
  intervalDays: number;
  // FSRS state (optional).
  stability?: number;
  difficulty?: number;
}

const DAY = 24 * 60 * 60 * 1000;
const LEARNING_STEP_MS = 10 * 60 * 1000;

export interface ScheduleResult {
  ease: number;
  reps: number;
  intervalDays: number;
  intervalMs: number;
  stability?: number;
  difficulty?: number;
}

export interface SchedulerStrategy {
  name: "fsrs" | "sm2";
  schedule(
    prev: Partial<RecallItem> | undefined,
    rating: 1 | 2 | 3 | 4 | 5,
  ): ScheduleResult;
}

/* ─────────────────────────── SM-2 ─────────────────────────── */

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

export const sm2Strategy: SchedulerStrategy = {
  name: "sm2",
  schedule(prev, rating) {
    const ease = prev?.ease ?? DEFAULT_EASE;
    const reps = prev?.reps ?? 0;
    const intervalDays = prev?.intervalDays ?? 0;
    const q = rating;
    if (q < 3) {
      return {
        ease: Math.max(MIN_EASE, ease - 0.2),
        reps: 0, intervalDays: 0, intervalMs: LEARNING_STEP_MS,
      };
    }
    const nextReps = reps + 1;
    let next: number;
    if (nextReps === 1) next = 1;
    else if (nextReps === 2) next = 3;
    else next = Math.round(intervalDays * ease * 10) / 10;
    const nextEase = Math.max(MIN_EASE, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    return {
      ease: nextEase, reps: nextReps,
      intervalDays: next, intervalMs: Math.round(next * DAY),
    };
  },
};

/* ─────────────────────────── FSRS ─────────────────────────── */
// A lightweight implementation of FSRS-5 with default weights.
// Rating 1-2 = Again/Hard (lapse), 3 = Good, 4-5 = Easy.

const FSRS_W = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234,
  1.616, 0.1544, 1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407,
  2.9466, 0.5034, 0.6567,
];
const REQUEST_RETENTION = 0.9;
const FACTOR = 19 / 81;
const DECAY = -0.5;

function fsrsInterval(stability: number): number {
  return Math.max(1, Math.round((stability / FACTOR) * (Math.pow(REQUEST_RETENTION, 1 / DECAY) - 1)));
}

function initStability(rating: number): number {
  return Math.max(0.1, FSRS_W[rating - 1] ?? FSRS_W[2]);
}

function initDifficulty(rating: number): number {
  const d = FSRS_W[4] - Math.exp(FSRS_W[5] * (rating - 1)) + 1;
  return Math.min(10, Math.max(1, d));
}

function nextDifficulty(d: number, rating: number): number {
  const next = d - FSRS_W[6] * (rating - 3);
  // Mean reversion toward initDifficulty(3)
  const target = FSRS_W[4] - Math.exp(FSRS_W[5] * 2) + 1;
  const meanReverted = FSRS_W[7] * target + (1 - FSRS_W[7]) * next;
  return Math.min(10, Math.max(1, meanReverted));
}

function nextStabilityOnRecall(d: number, s: number, rating: number): number {
  const hardPenalty = rating === 2 ? FSRS_W[15] : 1;
  const easyBonus = rating === 5 ? FSRS_W[16] : 1;
  const r = Math.pow(1 + FACTOR * (1 / s), DECAY);
  const factor =
    Math.exp(FSRS_W[8]) *
    (11 - d) *
    Math.pow(s, -FSRS_W[9]) *
    (Math.exp(FSRS_W[10] * (1 - r)) - 1) *
    hardPenalty *
    easyBonus;
  return Math.max(0.1, s * (1 + factor));
}

function nextStabilityOnLapse(d: number, s: number): number {
  return Math.max(
    0.1,
    FSRS_W[11] *
      Math.pow(d, -FSRS_W[12]) *
      (Math.pow(s + 1, FSRS_W[13]) - 1) *
      Math.exp(FSRS_W[14] * (1 - REQUEST_RETENTION)),
  );
}

export const fsrsStrategy: SchedulerStrategy = {
  name: "fsrs",
  schedule(prev, rating) {
    const hadHistory = !!prev && (prev.reps ?? 0) > 0 && (prev.stability ?? 0) > 0;
    let stability: number;
    let difficulty: number;

    if (!hadHistory) {
      stability = initStability(rating);
      difficulty = initDifficulty(rating);
    } else {
      const prevS = prev!.stability!;
      const prevD = prev!.difficulty ?? initDifficulty(3);
      difficulty = nextDifficulty(prevD, rating);
      stability = rating < 3
        ? nextStabilityOnLapse(prevD, prevS)
        : nextStabilityOnRecall(prevD, prevS, rating);
    }

    if (rating < 3) {
      return {
        ease: prev?.ease ?? DEFAULT_EASE,
        reps: 0,
        intervalDays: 0,
        intervalMs: LEARNING_STEP_MS,
        stability,
        difficulty,
      };
    }

    const intervalDays = fsrsInterval(stability);
    return {
      ease: prev?.ease ?? DEFAULT_EASE,
      reps: (prev?.reps ?? 0) + 1,
      intervalDays,
      intervalMs: Math.round(intervalDays * DAY),
      stability,
      difficulty,
    };
  },
};

/* ─────────────────────── Strategy registry ─────────────────────── */

export const STRATEGIES = { fsrs: fsrsStrategy, sm2: sm2Strategy };
export type StrategyName = keyof typeof STRATEGIES;

let activeStrategy: SchedulerStrategy = fsrsStrategy;
export function setRecallStrategy(name: StrategyName) {
  activeStrategy = STRATEGIES[name];
}
export function getRecallStrategy(): SchedulerStrategy { return activeStrategy; }

/** Schedule the next review using the currently active strategy. */
export function scheduleNext(
  prev: Partial<RecallItem> | undefined,
  rating: 1 | 2 | 3 | 4 | 5,
): ScheduleResult {
  return activeStrategy.schedule(prev, rating);
}

/* ─────────────────────────── helpers ─────────────────────────── */

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
