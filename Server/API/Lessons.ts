// Server/API/Lessons.ts
// Slug-based lessons registry. File layout:
//   Server/Data/Language/<Lang>/Lessons/<Level>/<Unit>/<Lesson>/<SubLesson>.json
// Each JSON file is an array of step objects { kind, ... }.

export type LessonLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export const LEVELS: LessonLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export interface LessonStep {
  kind:
    | "learn"
    | "flashcard"
    | "multipleChoice"
    | "matchPairs"
    | "buildTranslation"
    | "fillBlank"
    | "typeAnswer"
    | "listenChoose"
    | "listenType"
    | "orderSentence"
    | "imageSelect"
    | "speaking";
  [key: string]: any;
}

interface LessonNode {
  slug: string;
  title: string;
  steps?: LessonStep[];
  children: Record<string, LessonNode>;
}

const all = import.meta.glob("/Server/Data/Language/*/Lessons/**/*.json", { eager: true });

function titleFromSlug(slug: string): string {
  return slug.split("-").filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

// lang -> tree
const tree: Record<string, LessonNode> = {};

for (const [path, mod] of Object.entries(all)) {
  const clean = path.replace(/\\/g, "/").split("?")[0];
  // /Server/Data/Language/English/Lessons/A1/Getting-Started/The-Alphabet/Vowels.json
  const m = clean.match(/\/Language\/([^/]+)\/Lessons\/(.+)\.json$/);
  if (!m) continue;
  const lang = m[1];
  const segs = m[2].split("/");
  if (!tree[lang]) tree[lang] = { slug: lang, title: lang, children: {} };

  let node = tree[lang];
  for (let i = 0; i < segs.length; i++) {
    const slug = segs[i];
    if (!node.children[slug]) {
      node.children[slug] = { slug, title: titleFromSlug(slug), children: {} };
    }
    node = node.children[slug];
  }
  const data = (mod as { default: any }).default;
  node.steps = Array.isArray(data) ? data : [data];
}

// Explicit ordering for known content. Keyed by path from the language root.
// Anything not listed falls back to the order the file glob returned (usually
// alphabetical), which is fine for auto-added content.
const ORDER: Record<string, string[]> = {
  "": ["A1", "A2", "B1", "B2", "C1", "C2"],
  "A1": ["Getting-Started"],
  "A1/Getting-Started": [
    "The-Alphabet",
    "Pronunciation",
    "Hello",
    "Greetings",
    "Introducing-Yourself",
    "Yes-And-No",
    "Numbers-0-10",
    "Goodbye",
  ],
  "A1/Getting-Started/The-Alphabet": ["Vowels", "Consonants", "Special-Letters", "Practice", "Lesson"],
};

function sortChildren(path: string[], children: LessonNode[]): LessonNode[] {
  const key = path.join("/");
  const order = ORDER[key];
  if (!order) return [...children].sort((a, b) => a.slug.localeCompare(b.slug));
  return [...children].sort((a, b) => {
    const ai = order.indexOf(a.slug); const bi = order.indexOf(b.slug);
    if (ai === -1 && bi === -1) return a.slug.localeCompare(b.slug);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function pick(lang: string, path: string[]): LessonNode | null {
  let node = tree[lang];
  if (!node) return null;
  for (const seg of path) {
    node = node.children[seg];
    if (!node) return null;
  }
  return node;
}

function listChildren(lang: string, path: string[]): { slug: string; title: string; hasSteps: boolean }[] {
  const node = pick(lang, path);
  if (!node) return [];
  const kids = sortChildren(path, Object.values(node.children));
  return kids.map(c => ({
    slug: c.slug,
    title: c.title,
    hasSteps: !!c.steps,
  }));
}

export function getLevels(lang: string): LessonLevel[] {
  // Always return the canonical CEFR sequence; presence is determined separately.
  return LEVELS;
}

export function hasLevel(lang: string, level: string): boolean {
  return !!pick(lang, [level]);
}

export function getUnits(lang: string, level: string) {
  return listChildren(lang, [level]);
}

export function getLessons(lang: string, level: string, unit: string) {
  return listChildren(lang, [level, unit]);
}

export function getSubLessons(lang: string, level: string, unit: string, lesson: string) {
  return listChildren(lang, [level, unit, lesson]);
}

export function getSteps(
  lang: string,
  level: string,
  unit: string,
  lesson: string,
  sub: string,
): LessonStep[] | null {
  const node = pick(lang, [level, unit, lesson, sub]);
  return node?.steps ?? null;
}

/** First runnable sub-lesson path for the default lesson — used for the
 *  first-visit auto-redirect into /Lessons. Returns null if nothing exists. */
export function getDefaultLessonEntry(lang: string): { level: string; unit: string; lesson: string; sub: string } | null {
  const root = tree[lang];
  if (!root) return null;
  const pickFirst = (path: string[]): LessonNode | null => {
    const node = pick(lang, path);
    if (!node) return null;
    const kids = sortChildren(path, Object.values(node.children));
    return kids[0] ?? null;
  };
  const lv = pickFirst([]); if (!lv) return null;
  const un = pickFirst([lv.slug]); if (!un) return null;
  const ls = pickFirst([lv.slug, un.slug]); if (!ls) return null;
  const sb = pickFirst([lv.slug, un.slug, ls.slug]); if (!sb) return null;
  return { level: lv.slug, unit: un.slug, lesson: ls.slug, sub: sb.slug };
}

