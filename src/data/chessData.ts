// Chess curriculum. Lessons use a piece-on-board model with arrows and
// optional "star" targets to capture. No SAN moves needed.

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
  color?: string;        // CSS color
}

export type StepKind =
  | { kind: "show"; arrows?: Arrow[]; narration: CName }
  | { kind: "capture"; piece: string; target: string; arrows?: Arrow[]; narration: CName };

export interface ChessLesson {
  id: string;
  name: CName;
  pieces: PlacedPiece[];
  /** Star squares to capture across the lesson. */
  stars?: string[];
  steps: StepKind[];
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

// ── King lesson — the very first one ─────────────────────────────────
const kingLesson: ChessLesson = {
  id: "king",
  name: { nl: "De koning", en: "The King", ar: "الملك" },
  pieces: [{ square: "e1", color: "w", type: "K", themed: true }],
  stars: ["e2", "d2", "f2"],
  steps: [
    {
      kind: "show",
      arrows: [
        { from: "e1", to: "d1" }, { from: "e1", to: "f1" },
        { from: "e1", to: "d2" }, { from: "e1", to: "e2" }, { from: "e1", to: "f2" },
      ],
      narration: {
        nl: "Dit is de koning. Hij begint op e1. De koning beweegt één veld in elke richting.",
        en: "This is the King. He starts on e1. The King moves one square in any direction.",
        ar: "هذا هو الملك. يبدأ على e1. يتحرك الملك خانة واحدة في أي اتجاه.",
      },
    },
    {
      kind: "capture",
      piece: "e1",
      target: "e2",
      arrows: [{ from: "e1", to: "e2" }],
      narration: {
        nl: "Verplaats de koning naar e2 om de ster te pakken.",
        en: "Move the King to e2 to capture the star.",
        ar: "حرّك الملك إلى e2 لالتقاط النجمة.",
      },
    },
    {
      kind: "capture",
      piece: "e2",
      target: "d2",
      arrows: [{ from: "e2", to: "d2" }],
      narration: {
        nl: "Goed gedaan! Ga nu naar d2.",
        en: "Well done. Now move to d2.",
        ar: "أحسنت! الآن انتقل إلى d2.",
      },
    },
    {
      kind: "capture",
      piece: "d2",
      target: "f2",
      arrows: [{ from: "d2", to: "f2" }],
      narration: {
        nl: "Laatste ster: ga naar f2. Tip: de koning kan niet twee velden in één keer.",
        en: "Last star: move to f2. Tip — the King cannot leap two squares at once, take it step by step.",
        ar: "النجمة الأخيرة: انتقل إلى f2.",
      },
    },
    {
      kind: "show",
      narration: {
        nl: "Geweldig! Je hebt geleerd hoe de koning beweegt.",
        en: "Great! You have learned how the King moves.",
        ar: "رائع! لقد تعلمت كيف يتحرك الملك.",
      },
    },
  ],
};

export const chessLevels: ChessLevel[] = [
  {
    id: "beginner",
    name: { nl: "Beginner", en: "Beginner", ar: "مبتدئ" },
    groups: [
      {
        id: "learn-to-play",
        name: { nl: "Leer spelen", en: "Learn To Play", ar: "تعلم اللعب" },
        lessons: [kingLesson],
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
