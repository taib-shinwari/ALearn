// Recall (flashcard) queue model.
// When a user finishes a flashcard deck and rates themselves, the deck is
// scheduled for future recall after an interval that grows with rating.
// While the timer is still running the item lives in the "Active" tab; once
// the timer has elapsed it surfaces in the "Recall" tab, ready to redo.

export type RecallScope = "subcategory" | "word";

export interface RecallItem {
  id: string;                 // `${scope}:${categoryId}:${subcategoryId}:${wordId?}`
  scope: RecallScope;
  categoryId: string;
  subcategoryId: string;
  wordId?: string;
  title: string;
  completedAt: number;
  readyAt: number;
  lastRating: 1 | 2 | 3 | 4 | 5;
}

/** Map a self-rating (1=barely, 5=perfect) to a wait interval. */
export function intervalFor(rating: 1 | 2 | 3 | 4 | 5): number {
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  switch (rating) {
    case 1: return 10 * minute;
    case 2: return 30 * minute;
    case 3: return 2 * hour;
    case 4: return 1 * day;
    case 5: return 3 * day;
  }
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

/** Human-readable countdown like "in 2h 5m" or "ready". */
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
