// Chess.com-inspired bare-bones curriculum.
// Solutions are stored as from/to squares so they work with our hand-rolled
// engine (no SAN parsing needed).

export interface ChessLesson {
  id: string;
  title: { en: string; nl: string; ar?: string };
  description: { en: string; nl: string; ar?: string };
  /** Starting FEN. */
  fen: string;
  /** Square the user should move from. */
  highlight: string;
  goal: "any-legal-move";
}

export interface ChessPuzzle {
  id: string;
  title: { en: string; nl: string; ar?: string };
  hint: { en: string; nl: string; ar?: string };
  fen: string;
  sideToMove: "w" | "b";
  /** Accepted move(s) — first one is the canonical solution. */
  solution: Array<{ from: string; to: string }>;
}

export const CHESS_LESSONS: ChessLesson[] = [
  {
    id: "pawn",
    title: { en: "The Pawn", nl: "De Pion", ar: "البيدق" },
    description: {
      en: "Pawns move one square forward, or two from their starting square. They capture diagonally.",
      nl: "Pionnen gaan één veld vooruit, of twee vanaf hun startveld. Ze slaan diagonaal.",
      ar: "البيدق يتحرك خطوة للأمام، أو خطوتين من مكانه الأصلي. ويأكل قطريًا.",
    },
    fen: "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1",
    highlight: "e2",
    goal: "any-legal-move",
  },
  {
    id: "rook",
    title: { en: "The Rook", nl: "De Toren", ar: "القلعة" },
    description: {
      en: "Rooks move any number of squares in straight lines — horizontally or vertically.",
      nl: "Torens bewegen in rechte lijnen — horizontaal of verticaal.",
      ar: "القلعة تتحرك في خطوط مستقيمة — أفقيًا أو رأسيًا.",
    },
    fen: "4k3/8/8/8/3R4/8/8/4K3 w - - 0 1",
    highlight: "d4",
    goal: "any-legal-move",
  },
  {
    id: "bishop",
    title: { en: "The Bishop", nl: "De Loper", ar: "الفيل" },
    description: {
      en: "Bishops move any number of squares diagonally and stay on one color.",
      nl: "Lopers bewegen diagonaal en blijven op één kleur.",
      ar: "الفيل يتحرك قطريًا ويبقى على نفس اللون.",
    },
    fen: "4k3/8/8/8/3B4/8/8/4K3 w - - 0 1",
    highlight: "d4",
    goal: "any-legal-move",
  },
  {
    id: "knight",
    title: { en: "The Knight", nl: "Het Paard", ar: "الحصان" },
    description: {
      en: "Knights jump in an L-shape: two squares in one direction, then one perpendicular. They can leap over pieces.",
      nl: "Paarden springen in een L-vorm: twee velden, dan één loodrecht. Ze springen over stukken heen.",
      ar: "الحصان يقفز على شكل حرف L، ويستطيع القفز فوق القطع.",
    },
    fen: "4k3/8/8/8/3N4/8/8/4K3 w - - 0 1",
    highlight: "d4",
    goal: "any-legal-move",
  },
  {
    id: "queen",
    title: { en: "The Queen", nl: "De Dame", ar: "الملكة" },
    description: {
      en: "The queen combines the rook and bishop — any direction, any distance.",
      nl: "De dame combineert toren en loper — elke richting, elke afstand.",
      ar: "الملكة تجمع بين القلعة والفيل — أي اتجاه وأي مسافة.",
    },
    fen: "4k3/8/8/8/3Q4/8/8/4K3 w - - 0 1",
    highlight: "d4",
    goal: "any-legal-move",
  },
  {
    id: "king",
    title: { en: "The King", nl: "De Koning", ar: "الملك" },
    description: {
      en: "The king moves one square in any direction. Protect it at all costs.",
      nl: "De koning beweegt één veld in elke richting. Bescherm hem.",
      ar: "الملك يتحرك خطوة واحدة في أي اتجاه. احمِه دائمًا.",
    },
    fen: "4k3/8/8/8/3K4/8/8/8 w - - 0 1",
    highlight: "d4",
    goal: "any-legal-move",
  },
];

export const CHESS_PUZZLES: ChessPuzzle[] = [
  {
    id: "back-rank-mate",
    title: { en: "Back-rank mate", nl: "Achterveld mat", ar: "كش مات الصف الأخير" },
    hint:  {
      en: "White to move and mate in 1.",
      nl: "Wit aan zet, mat in 1.",
      ar: "الأبيض يلعب ويحقق كش ملك في نقلة واحدة.",
    },
    fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
    sideToMove: "w",
    solution: [{ from: "d1", to: "d8" }],
  },
  {
    id: "scholars-mate",
    title: { en: "Scholar's mate", nl: "Schoolmeestersmat", ar: "كش مات العالم" },
    hint:  {
      en: "White to move and deliver the classic 4-move mate.",
      nl: "Wit aan zet en geeft het klassieke 4-zettenmat.",
      ar: "الأبيض يلعب ويحقق الكش الشهير في 4 نقلات.",
    },
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4",
    sideToMove: "w",
    solution: [{ from: "h5", to: "f7" }],
  },
];

export function getChessLesson(id: string) { return CHESS_LESSONS.find(l => l.id === id); }
export function getChessPuzzle(id: string) { return CHESS_PUZZLES.find(p => p.id === id); }
