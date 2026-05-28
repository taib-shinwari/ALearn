// Mastery model. Unlike a binary "lesson done" flag, mastery is a 0–5 score
// that decays with time (half-life ~10 days) so units become "rusty" and
// resurface for review.

import type { LessonProgressEntry } from "@/context/AppContext";
import type { SkillNode } from "@/data/skillTree";
import type { ReviewState } from "./spacedRepetition";

export type NodeStatus = "locked" | "available" | "learning" | "mastered" | "rusty";

const HALF_LIFE_MS = 10 * 24 * 60 * 60 * 1000;

/** Decayed star score (0–3) for a single lesson. */
function lessonMastery(entry: LessonProgressEntry | undefined): number {
  if (!entry || !entry.completedAt) return 0;
  const age = Date.now() - entry.completedAt;
  const decay = Math.pow(0.5, age / HALF_LIFE_MS);
  return entry.stars * decay;
}

/** 0–5 mastery score for a node, averaging across its lessons. */
export function getNodeMastery(
  node: SkillNode,
  pathProgress: Record<string, LessonProgressEntry>,
): number {
  if (!node.lessons.length) return 0;
  const avgStars = node.lessons
    .map(l => lessonMastery(pathProgress[l.id]))
    .reduce((a, b) => a + b, 0) / node.lessons.length;
  // Convert avg stars (0–3) → mastery (0–5)
  return Math.min(5, (avgStars / 3) * 5);
}

export function getNodeStatus(
  node: SkillNode,
  pathProgress: Record<string, LessonProgressEntry>,
  prereqStatuses: NodeStatus[],
): NodeStatus {
  const unlocked = prereqStatuses.length === 0 ||
    prereqStatuses.every(s => s === "mastered" || s === "rusty" || s === "learning");
  if (!unlocked) return "locked";

  const m = getNodeMastery(node, pathProgress);
  const everCompleted = node.lessons.some(l => pathProgress[l.id]?.completedAt);

  if (m >= 4) return "mastered";
  if (everCompleted && m < 2) return "rusty";
  if (m > 0 || everCompleted) return "learning";
  return "available";
}

/** Convenience: compute status for every node in topological (tier) order. */
export function computeAllStatuses(
  nodes: SkillNode[],
  pathProgress: Record<string, LessonProgressEntry>,
): Record<string, NodeStatus> {
  const out: Record<string, NodeStatus> = {};
  const sorted = [...nodes].sort((a, b) => a.tier - b.tier);
  for (const n of sorted) {
    const prereqStatuses = n.prereqs.map(id => out[id]).filter(Boolean) as NodeStatus[];
    out[n.id] = getNodeStatus(n, pathProgress, prereqStatuses);
  }
  return out;
}

/** Surface words that need refreshing based on review decay. */
export function rustyWordIds(reviews: ReviewState[], threshold = 0.5): string[] {
  const now = Date.now();
  return reviews
    .filter(r => r.learned && (now - r.nextReview) / (HALF_LIFE_MS) > threshold)
    .map(r => r.wordId);
}
