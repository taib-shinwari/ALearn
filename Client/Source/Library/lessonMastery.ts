// Per-lesson mastery + spaced review scheduling.
// Star path:  0 → 1 (learn) → 2 → 3 → 4 → 5 (mastered)
// You only earn the next star with a PERFECT review. Otherwise you keep
// your current stars and get scheduled for another review sooner.

const KEY = "lesson-mastery-v1";
const VISIT_KEY = "lessons-visited-v1";
const DAY = 86_400_000;

export interface Mastery {
  stars: 0 | 1 | 2 | 3 | 4 | 5;
  lastReviewedAt: number;
  nextReviewAt: number; // 0 when not yet learned or when mastered
}

interface Store { [lang: string]: { [id: string]: Mastery } }

function read(): Store {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function write(s: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* noop */ }
  listeners.forEach(l => l());
}
const listeners = new Set<() => void>();

export function subscribeMastery(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function lessonId(...segments: string[]): string {
  return segments.filter(Boolean).join("/");
}

export function getMastery(lang: string, id: string): Mastery {
  return read()[lang]?.[id] ?? { stars: 0, lastReviewedAt: 0, nextReviewAt: 0 };
}

function daysForNextReview(stars: number): number {
  // Perfect review → longer gap for higher stars, capped at 28 days.
  const table = [7, 7, 14, 21, 28];
  return table[Math.min(stars, table.length - 1)];
}

function daysForRetry(accuracy: number): number {
  // Not perfect: schedule again in 1–5 days based on accuracy.
  // 100% (but not perfect due to slips) → 5 days; 0% → 1 day.
  const d = 1 + Math.round(Math.max(0, Math.min(1, accuracy)) * 4);
  return Math.min(7, d);
}

/** Called when the runner finishes. accuracy is 0..1 across practice steps. */
export function recordResult(
  lang: string, id: string,
  opts: { perfect: boolean; accuracy: number },
): Mastery {
  const s = read();
  if (!s[lang]) s[lang] = {};
  const prev = s[lang][id] ?? { stars: 0, lastReviewedAt: 0, nextReviewAt: 0 } as Mastery;
  const now = Date.now();

  let stars = prev.stars;
  let nextReviewAt: number;

  if (prev.stars === 0) {
    // First completion — always earn one star.
    stars = 1;
    nextReviewAt = now + daysForNextReview(1) * DAY;
  } else if (opts.perfect) {
    stars = Math.min(5, prev.stars + 1) as Mastery["stars"];
    nextReviewAt = stars >= 5 ? 0 : now + daysForNextReview(stars) * DAY;
  } else {
    nextReviewAt = now + daysForRetry(opts.accuracy) * DAY;
  }

  const next: Mastery = { stars, lastReviewedAt: now, nextReviewAt };
  s[lang][id] = next;
  write(s);
  return next;
}

/** A lesson is unlocked if it's the first, or if the previous one has ≥1 star. */
export function isUnlocked(lang: string, id: string, prevId?: string) {
  if (!prevId) return true;
  return getMastery(lang, prevId).stars >= 1;
}

export function isDueForReview(lang: string, id: string): boolean {
  const m = getMastery(lang, id);
  return m.stars > 0 && m.stars < 5 && m.nextReviewAt > 0 && Date.now() >= m.nextReviewAt;
}

// First-visit gate used by the Lessons root to auto-redirect into the
// first lesson.
export function hasVisited(lang: string) {
  try { return (JSON.parse(localStorage.getItem(VISIT_KEY) || "[]") as string[]).includes(lang); }
  catch { return false; }
}
export function markVisited(lang: string) {
  try {
    const arr = JSON.parse(localStorage.getItem(VISIT_KEY) || "[]") as string[];
    if (!arr.includes(lang)) arr.push(lang);
    localStorage.setItem(VISIT_KEY, JSON.stringify(arr));
  } catch { /* noop */ }
}
