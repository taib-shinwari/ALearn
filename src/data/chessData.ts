// Chess curriculum. Each lesson has:
//   1. An intro phase: animated arrows showing how the piece moves, with narration.
//   2. A play phase: a sequence of "stars" the user must capture in order, using
//      any legal move of the lesson's piece (free choice of path).
//   3. A done phase: completion overlay, then auto-advance to the next lesson.

export type Lang = "nl" | "en" | "ar";
export interface CName { nl: string; en: string; ar?: string }

export type PieceColor = "w" | "b";
export type PieceType = "K" | "Q" | "R" | "B" | "N" | "P";

export interface PlacedPiece {
  square: string;        // e.g. "e1"
  color: PieceColor;     // overridden by theme when `themed` is true
  type: PieceType;
  themed?: boolean;      // when true, color follows the active UI theme
}

export interface Arrow {
  from: string;
  to: string;
  color?: string;
}

export interface ChessLesson {
  id: string;
  name: CName;
  /** The piece the player controls (only one for now). */
  piece: PlacedPiece;
  /** Intro arrows that animate (length pulsing) during the intro phase. */
  introArrows: Arrow[];
  /** Intro narration spoken on lesson entry. */
  intro: CName;
  /** Stars to capture in order. */
  stars: string[];
  /** Optional outro narration shown when all stars are captured. */
  done?: CName;
  orientation?: "white" | "black";
}

export interface ChessGroup {
  id: string;
  name: CName;
  lessons: ChessLesson[];
}

export interface ChessLevel {
  id: string;
  name: CName;
  groups: ChessGroup[];
}

// ── King ─────────────────────────────────────────────────────────────
const kingLesson: ChessLesson = {
  id: "king",
  name: { nl: "De koning", en: "The King", ar: "الملك" },
  piece: { square: "e1", color: "w", type: "K", themed: true },
  introArrows: [
    { from: "e1", to: "d1" }, { from: "e1", to: "f1" },
    { from: "e1", to: "d2" }, { from: "e1", to: "e2" }, { from: "e1", to: "f2" },
  ],
  intro: {
    nl: "Dit is de koning. Hij begint op e1. De koning beweegt één veld in elke richting.",
    en: "This is the King. He starts on e1. The King moves one square in any direction.",
    ar: "هذا هو الملك. يبدأ على e1. يتحرك الملك خانة واحدة في أي اتجاه.",
  },
  stars: ["f2", "f4", "d3"],
  done: {
    nl: "Geweldig! Je hebt geleerd hoe de koning beweegt.",
    en: "Great! You have learned how the King moves.",
    ar: "رائع! لقد تعلمت كيف يتحرك الملك.",
  },
};

// ── Queen ────────────────────────────────────────────────────────────
const queenLesson: ChessLesson = {
  id: "queen",
  name: { nl: "De dame", en: "The Queen", ar: "الوزير" },
  piece: { square: "d1", color: "w", type: "Q", themed: true },
  introArrows: [
    { from: "d1", to: "d8" }, { from: "d1", to: "a1" }, { from: "d1", to: "h1" },
    { from: "d1", to: "a4" }, { from: "d1", to: "h5" },
  ],
  intro: {
    nl: "Dit is de dame. Zij is de sterkste stuk. De dame beweegt in elke richting, zo ver als ze wil.",
    en: "This is the Queen. She is the strongest piece. The Queen moves any number of squares in any direction.",
    ar: "هذا هو الوزير. أقوى قطعة. يتحرك في كل الاتجاهات بأي عدد من الخانات.",
  },
  stars: ["d4", "h8", "a1"],
  done: {
    nl: "Mooi! De dame is de krachtigste stuk op het bord.",
    en: "Nice! The Queen is the most powerful piece on the board.",
    ar: "أحسنت! الوزير أقوى قطعة على الرقعة.",
  },
};

export const chessLevels: ChessLevel[] = [
  {
    id: "beginner",
    name: { nl: "Beginner", en: "Beginner", ar: "مبتدئ" },
    groups: [
      {
        id: "learn-to-play",
        name: { nl: "Leer spelen", en: "Learn To Play", ar: "تعلم اللعب" },
        lessons: [kingLesson, queenLesson],
      },
    ],
  },
  {
    id: "intermediate",
    name: { nl: "Gevorderd", en: "Intermediate", ar: "متوسط" },
    groups: [],
  },
  {
    id: "advanced",
    name: { nl: "Expert", en: "Advanced", ar: "متقدم" },
    groups: [],
  },
];

export function cName(n: CName, lang: Lang): string {
  if (lang === "ar" && n.ar) return n.ar;
  return n[lang] ?? n.en;
}

// ── Legal-move helpers ───────────────────────────────────────────────
// Bare-bones legal move detection for the piece types used by lessons.
// Lessons currently feature a single piece so we don't worry about blockers.

function sqToFR(sq: string): [number, number] {
  return [sq.charCodeAt(0) - 97, parseInt(sq[1], 10) - 1];
}

export function isLegalMove(type: PieceType, from: string, to: string): boolean {
  if (from === to) return false;
  const [f1, r1] = sqToFR(from);
  const [f2, r2] = sqToFR(to);
  if (f2 < 0 || f2 > 7 || r2 < 0 || r2 > 7) return false;
  const df = Math.abs(f2 - f1);
  const dr = Math.abs(r2 - r1);
  switch (type) {
    case "K": return df <= 1 && dr <= 1;
    case "Q": return df === 0 || dr === 0 || df === dr;
    case "R": return df === 0 || dr === 0;
    case "B": return df === dr;
    case "N": return (df === 1 && dr === 2) || (df === 2 && dr === 1);
    case "P": return df === 0 && (r2 - r1 === 1 || r2 - r1 === 2);
  }
}
