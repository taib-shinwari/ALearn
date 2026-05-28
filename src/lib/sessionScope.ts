// Sibling-node helper for cross-skill interleaving. Given a lesson id,
// returns the word ids of *other* nodes in the same tier so the adaptive
// engine can sprinkle them into the session.

import { SKILL_TREE, SkillNode } from "@/data/skillTree";
import { getWordsForSubcategory } from "@/data/courseData";

export function findNodeByLesson(lessonId: string): SkillNode | undefined {
  return SKILL_TREE.find(n => n.lessons.some(l => l.id === lessonId));
}

export function siblingWordIdsForLesson(lessonId: string): string[] {
  const node = findNodeByLesson(lessonId);
  if (!node) return [];
  const siblings = SKILL_TREE.filter(n => n.tier === node.tier && n.id !== node.id);
  const ids: string[] = [];
  for (const sib of siblings) {
    for (const l of sib.lessons) {
      for (const w of getWordsForSubcategory(l.subcategoryId)) ids.push(w.id);
    }
  }
  return ids;
}
