// Non-linear skill tree built on top of the existing learning units.
// Each node belongs to a branch (Speaking / Listening / Vocab / Grammar) and
// has explicit prerequisites — unlike a flat list, sibling branches can
// advance independently.

import { PATH_SECTIONS, PathLesson, PathUnit } from "./learningUnits";

export type SkillBranch = "vocab" | "listening" | "speaking" | "grammar";

export interface SkillNode {
  id: string;
  unit: PathUnit;
  sectionId: string;
  branch: SkillBranch;
  tier: number;            // row in the tree (0 = root)
  prereqs: string[];       // node ids that must be mastered
  title: PathUnit["title"];
  lessons: PathLesson[];
}

/**
 * Derive branch from the unit's subject so we don't have to hand-edit the
 * existing data. Conversational/greeting units = speaking, verb units =
 * grammar, listening-leaning units = listening, the rest = vocab.
 */
function branchFor(unit: PathUnit): SkillBranch {
  const id = unit.id.toLowerCase();
  const en = unit.title.en.toLowerCase();
  if (id.includes("u1") || en.includes("hello") || en.includes("greet")) return "speaking";
  if (en.includes("verb") || en.includes("action")) return "grammar";
  if (en.includes("listen") || en.includes("sound")) return "listening";
  return "vocab";
}

/**
 * Build a tree from PATH_SECTIONS. Tier = section number - 1. Within a tier,
 * every node depends on every node from the previous tier of the same branch
 * — or, if that branch has no prior node, on any node of the previous tier.
 * That gives true non-linear progression: vocab learners aren't blocked by
 * grammar and vice versa.
 */
export const SKILL_TREE: SkillNode[] = (() => {
  const nodes: SkillNode[] = [];
  for (const section of PATH_SECTIONS) {
    for (const unit of section.units) {
      nodes.push({
        id: unit.id,
        unit,
        sectionId: section.id,
        branch: branchFor(unit),
        tier: section.number - 1,
        prereqs: [],
        title: unit.title,
        lessons: unit.lessons,
      });
    }
  }
  // Wire prereqs
  for (const node of nodes) {
    if (node.tier === 0) continue;
    const prevTier = nodes.filter(n => n.tier === node.tier - 1);
    const sameBranch = prevTier.filter(n => n.branch === node.branch);
    node.prereqs = (sameBranch.length ? sameBranch : prevTier).map(n => n.id);
  }
  return nodes;
})();

export function nodesByTier(): SkillNode[][] {
  const tiers: SkillNode[][] = [];
  for (const n of SKILL_TREE) {
    tiers[n.tier] ??= [];
    tiers[n.tier].push(n);
  }
  return tiers;
}

export const BRANCH_LABELS: Record<SkillBranch, { en: string; nl: string; ar: string }> = {
  vocab:     { en: "Vocab",     nl: "Woorden",   ar: "مفردات" },
  listening: { en: "Listening", nl: "Luisteren", ar: "استماع" },
  speaking:  { en: "Speaking",  nl: "Spreken",   ar: "تحدث" },
  grammar:   { en: "Grammar",   nl: "Grammatica", ar: "قواعد" },
};
