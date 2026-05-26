// Duolingo-style curated learning track that sits on top of the
// grammar-based `categories` (which still power the dictionary).
//
// Each Section groups Units around a theme. Each Unit holds 1–2 short
// Lessons. A lesson points at an existing subcategory id so it plugs into
// the current Practice flow without changes.

import { categories, getWordsForSubcategory } from "./courseData";

export type LessonKind = "lesson" | "review" | "checkpoint";

export interface PathLesson {
  id: string;
  title: { en: string; nl: string; ar?: string };
  subcategoryId: string;
  kind: LessonKind;
}

export interface PathUnit {
  id: string;
  title: { en: string; nl: string; ar?: string };
  subtitle: { en: string; nl: string; ar?: string };
  /** HSL color for the unit banner — uses semantic tokens-friendly hues. */
  hue: number;
  lessons: PathLesson[];
}

export interface PathSection {
  id: string;
  number: number;
  title: { en: string; nl: string; ar?: string };
  units: PathUnit[];
}

export const PATH_SECTIONS: PathSection[] = [
  {
    id: "foundations",
    number: 1,
    title: { en: "Foundations", nl: "Fundament", ar: "الأساس" },
    units: [
      {
        id: "u0",
        title: { en: "Alphabet", nl: "Alfabet", ar: "الحروف" },
        subtitle: { en: "Letters and sounds", nl: "Letters en klanken", ar: "حروف وأصوات" },
        hue: 200,
        lessons: [
          { id: "u0-l1", title: { en: "Alphabet", nl: "Alfabet", ar: "الحروف" }, subcategoryId: "begroeting", kind: "lesson" },
        ],
      },
    ],
  },
  {
    id: "everyday",
    number: 1,
    title: { en: "Everyday Basics", nl: "Dagelijkse Basis", ar: "الأساسيات اليومية" },
    units: [
      {
        id: "u1",
        title: { en: "Say Hello", nl: "Zeg Hallo", ar: "ألقِ التحية" },
        subtitle: { en: "Greetings and goodbyes", nl: "Begroetingen en afscheid", ar: "تحيات وودَاع" },
        hue: 142,
        lessons: [
          { id: "u1-l1", title: { en: "Greetings", nl: "Begroetingen", ar: "تحيات" }, subcategoryId: "begroeting", kind: "lesson" },
          { id: "u1-l2", title: { en: "Review", nl: "Herhaling", ar: "مراجعة" }, subcategoryId: "begroeting", kind: "review" },
        ],
      },
      {
        id: "u2",
        title: { en: "People & Pets", nl: "Mensen & Huisdieren", ar: "أشخاص وحيوانات أليفة" },
        subtitle: { en: "Who and what is around you", nl: "Wie en wat is om je heen", ar: "مَن وماذا حولك" },
        hue: 28,
        lessons: [
          { id: "u2-l1", title: { en: "People", nl: "Mensen", ar: "أشخاص" }, subcategoryId: "mens", kind: "lesson" },
          { id: "u2-l2", title: { en: "Animals", nl: "Dieren", ar: "حيوانات" }, subcategoryId: "dier", kind: "lesson" },
        ],
      },
    ],
  },
  {
    id: "food",
    number: 2,
    title: { en: "At the Table", nl: "Aan Tafel", ar: "على المائدة" },
    units: [
      {
        id: "u3",
        title: { en: "Fresh Food", nl: "Vers Eten", ar: "طعام طازج" },
        subtitle: { en: "Fruit and vegetables", nl: "Fruit en groenten", ar: "فاكهة وخضار" },
        hue: 0,
        lessons: [
          { id: "u3-l1", title: { en: "Fruit", nl: "Fruit", ar: "فاكهة" }, subcategoryId: "fruit", kind: "lesson" },
          { id: "u3-l2", title: { en: "Checkpoint", nl: "Checkpoint", ar: "نقطة تفتيش" }, subcategoryId: "fruit", kind: "checkpoint" },
        ],
      },
    ],
  },
  {
    id: "describe",
    number: 3,
    title: { en: "Describe the World", nl: "Beschrijf de Wereld", ar: "صف العالم" },
    units: [
      {
        id: "u4",
        title: { en: "How Things Are", nl: "Hoe Dingen Zijn", ar: "كيف تبدو الأشياء" },
        subtitle: { en: "Adjectives in daily life", nl: "Bijvoeglijke naamwoorden", ar: "صفات الحياة اليومية" },
        hue: 210,
        lessons: [
          { id: "u4-l1", title: { en: "Descriptions", nl: "Beschrijvingen", ar: "أوصاف" }, subcategoryId: "beschrijving", kind: "lesson" },
        ],
      },
    ],
  },
  {
    id: "actions",
    number: 4,
    title: { en: "Take Action", nl: "Kom in Actie", ar: "اتخذ خطوة" },
    units: [
      {
        id: "u5",
        title: { en: "Daily Verbs", nl: "Dagelijkse Werkwoorden", ar: "أفعال يومية" },
        subtitle: { en: "Eat, drink, sleep, repeat", nl: "Eten, drinken, slapen", ar: "كُل، اشرب، نَم" },
        hue: 280,
        lessons: [
          { id: "u5-l1", title: { en: "Daily Actions", nl: "Dagelijkse Acties", ar: "أفعال يومية" }, subcategoryId: "dagelijkse-acties", kind: "lesson" },
          { id: "u5-l2", title: { en: "Boss Review", nl: "Boss Herhaling", ar: "مراجعة شاملة" }, subcategoryId: "dagelijkse-acties", kind: "checkpoint" },
        ],
      },
    ],
  },
];

export interface LessonProgress {
  done: number;
  total: number;
  completed: boolean;
}

export function lessonProgress(
  lesson: PathLesson,
  learnedIds: Set<string>,
  pathProgress?: Record<string, { stars: number; completedAt?: number }>,
): LessonProgress {
  const words = getWordsForSubcategory(lesson.subcategoryId);
  const total = words.length || 1;
  const done = words.filter(w => learnedIds.has(w.id)).length;
  const explicit = !!pathProgress?.[lesson.id]?.completedAt;
  return { done, total, completed: explicit || (total > 0 && done >= total) };
}

/** Returns all units flat, in order. Used to find the next active lesson. */
export function getAllPathLessons(): PathLesson[] {
  return PATH_SECTIONS.flatMap(s => s.units.flatMap(u => u.lessons));
}

/** Sanity helper exported so consumers can show "X categories indexed" copy. */
export function categoryCount() {
  return categories.length;
}
