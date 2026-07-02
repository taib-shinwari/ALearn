// Server/API/Lessons.ts
// Slug-based lessons registry. Simplified two-tier hierarchy:
//   Server/Data/Language/<Lang>/Lessons/<Level>/<Lesson>.json
// Each JSON file is an array of step objects { kind, ... }.
//
// Levels use Roman numerals ("I", "II", ..., "VI").

export type LessonLevel = "I" | "II" | "III" | "IV" | "V" | "VI";
export const LEVELS: LessonLevel[] = ["I", "II", "III", "IV", "V", "VI"];

export interface LessonStep {
  kind: string;
  [key: string]: any;
}

interface LessonEntry {
  slug: string;
  title: string;
  steps: LessonStep[];
}

const all = import.meta.glob("/Server/Data/Language/*/Lessons/**/*.json", { eager: true });

function titleFromSlug(slug: string): string {
  return slug.split("-").filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

// lang -> level -> lessonSlug -> LessonEntry
const tree: Record<string, Record<string, Record<string, LessonEntry>>> = {};

for (const [path, mod] of Object.entries(all)) {
  const clean = path.replace(/\\/g, "/").split("?")[0];
  // /Server/Data/Language/English/Lessons/I/The-Alphabet.json
  const m = clean.match(/\/Language\/([^/]+)\/Lessons\/([^/]+)\/([^/]+)\.json$/);
  if (!m) continue;
  const lang = m[1], level = m[2], lessonSlug = m[3];
  if (!tree[lang]) tree[lang] = {};
  if (!tree[lang][level]) tree[lang][level] = {};
  const data = (mod as { default: any }).default;
  tree[lang][level][lessonSlug] = {
    slug: lessonSlug,
    title: titleFromSlug(lessonSlug),
    steps: Array.isArray(data) ? data : [data],
  };
}

// Explicit ordering per level. Anything unlisted falls back to alphabetical.
const LESSON_ORDER: Record<string, string[]> = {
  "I": ["The-Alphabet"],
};

function sortLessons(level: string, lessons: LessonEntry[]): LessonEntry[] {
  const order = LESSON_ORDER[level];
  if (!order) return [...lessons].sort((a, b) => a.slug.localeCompare(b.slug));
  return [...lessons].sort((a, b) => {
    const ai = order.indexOf(a.slug); const bi = order.indexOf(b.slug);
    if (ai === -1 && bi === -1) return a.slug.localeCompare(b.slug);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export function getLevels(_lang: string): LessonLevel[] {
  return LEVELS;
}

export function hasLevel(lang: string, level: string): boolean {
  return !!tree[lang]?.[level] && Object.keys(tree[lang][level]).length > 0;
}

export function getLessons(lang: string, level: string): { slug: string; title: string }[] {
  const entries = tree[lang]?.[level];
  if (!entries) return [];
  return sortLessons(level, Object.values(entries)).map(e => ({ slug: e.slug, title: e.title }));
}

export function getSteps(lang: string, level: string, lesson: string): LessonStep[] | null {
  return tree[lang]?.[level]?.[lesson]?.steps ?? null;
}

/** First runnable lesson — used for the first-visit redirect. */
export function getDefaultLessonEntry(lang: string): { level: string; lesson: string } | null {
  for (const lv of LEVELS) {
    const lessons = getLessons(lang, lv);
    if (lessons.length) return { level: lv, lesson: lessons[0].slug };
  }
  return null;
}
