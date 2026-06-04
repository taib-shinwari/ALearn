// Minimal chess curriculum used by the Chess folder.
// Each lesson plays a short sequence of SAN moves with explanations.

export type Lang = "nl" | "en" | "ar";
export interface CName { nl: string; en: string; ar?: string }

export interface ChessLesson {
  id: string;
  name: CName;
  intro?: CName;
  /** Starting FEN — defaults to the standard initial position when omitted. */
  startFen?: string;
  /** Whose turn the student is supposed to think from. */
  orientation?: "white" | "black";
  steps: { san: string; explain: CName }[];
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

export const chessLevels: ChessLevel[] = [
  {
    id: "beginner",
    name: { nl: "Beginner", en: "Beginner", ar: "مبتدئ" },
    groups: [
      {
        id: "basic-movement",
        name: { nl: "Basisbewegingen", en: "Basic Movement", ar: "الحركات الأساسية" },
        lessons: [
          {
            id: "pawn",
            name: { nl: "De pion", en: "The Pawn", ar: "البيدق" },
            intro: {
              nl: "Pionnen lopen vooruit en slaan diagonaal.",
              en: "Pawns move forward and capture diagonally.",
            },
            steps: [
              { san: "e4", explain: { nl: "Wit zet de pion twee velden vooruit.", en: "White moves the pawn two squares forward." } },
              { san: "e5", explain: { nl: "Zwart spiegelt de zet.", en: "Black mirrors the move." } },
              { san: "d4", explain: { nl: "Wit valt het centrum aan.", en: "White attacks the center." } },
              { san: "exd4", explain: { nl: "Zwart slaat diagonaal.", en: "Black captures diagonally." } },
            ],
          },
          {
            id: "knight",
            name: { nl: "Het paard", en: "The Knight", ar: "الحصان" },
            intro: {
              nl: "Het paard springt in een L-vorm.",
              en: "The knight jumps in an L-shape.",
            },
            steps: [
              { san: "Nf3", explain: { nl: "Het paard ontwikkelt naar f3.", en: "The knight develops to f3." } },
              { san: "Nc6", explain: { nl: "Zwart ontwikkelt zijn paard.", en: "Black develops a knight too." } },
              { san: "Nc3", explain: { nl: "Tweede paard naar c3.", en: "Second knight to c3." } },
              { san: "Nf6", explain: { nl: "Symmetrische ontwikkeling.", en: "Symmetric development." } },
            ],
          },
          {
            id: "bishop",
            name: { nl: "De loper", en: "The Bishop", ar: "الفيل" },
            intro: {
              nl: "Lopers bewegen diagonaal.",
              en: "Bishops slide along diagonals.",
            },
            steps: [
              { san: "e4", explain: { nl: "Open de diagonaal voor de loper.", en: "Open the diagonal for the bishop." } },
              { san: "e5", explain: { nl: "Zwart doet hetzelfde.", en: "Black does the same." } },
              { san: "Bc4", explain: { nl: "De loper richt zich op f7.", en: "The bishop eyes f7." } },
              { san: "Bc5", explain: { nl: "Symmetrische loperzet.", en: "Symmetric bishop move." } },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "intermediate",
    name: { nl: "Gevorderd", en: "Intermediate", ar: "متوسط" },
    groups: [
      {
        id: "tactics",
        name: { nl: "Tactiek", en: "Basic Tactics", ar: "تكتيكات" },
        lessons: [
          {
            id: "fork",
            name: { nl: "De vork", en: "The Fork", ar: "الشوكة" },
            intro: {
              nl: "Eén stuk valt twee doelen aan.",
              en: "One piece attacks two targets at once.",
            },
            startFen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1",
            steps: [
              { san: "Nxe5", explain: { nl: "Wit slaat de pion.", en: "White grabs the pawn." } },
              { san: "Nxe5", explain: { nl: "Zwart slaat terug.", en: "Black recaptures." } },
              { san: "d4", explain: { nl: "Centrumdoorbraak.", en: "Center break." } },
            ],
          },
        ],
      },
    ],
  },
];

export function cName(n: CName, lang: Lang): string {
  if (lang === "ar" && n.ar) return n.ar;
  return n[lang] ?? n.en;
}
