// Bare-bones chess curriculum: piece-movement lessons + 2 puzzles.

export interface ChessLesson {
  id: string;
  /** Display name */
  title: { en: string; nl: string; ar?: string };
  description: { en: string; nl: string; ar?: string };
  /** Starting FEN with only the relevant piece(s). */
  fen: string;
  /** Square the user should be encouraged to move from. */
  highlight: string;
  /** All legal target squares from `highlight` count as "complete". */
  goal: "any-legal-move";
}

export interface ChessPuzzle {
  id: string;
  title: { en: string; nl: string; ar?: string };
  /** Position before the user moves. */
  fen: string;
  /** Side to move – derived from fen but cached for convenience. */
  sideToMove: "w" | "b";
  /** Correct move(s) in SAN, e.g. ["Qh5#"]. Any match completes the puzzle. */
  solution: string[];
}

export const CHESS_LESSONS: ChessLesson[] = [
  {
    id: "pawn",
    title:       { en: "The Pawn",   nl: "De Pion",     ar: "البيدق" },
    description: {
      en: "Pawns move one square forward, or two from their starting square. They capture diagonally.",
      nl: "Pionnen gaan één veld vooruit, of twee vanaf hun startveld. Ze slaan diagonaal.",
    },
    fen: "8/8/8/8/8/8/4P3/4K2k w - - 0 1",
    highlight: "e2",
    goal: "any-legal-move",
  },
  {
    id: "rook",
    title:       { en: "The Rook",   nl: "De Toren",    ar: "القلعة" },
    description: {
      en: "Rooks move any number of squares in straight lines — horizontally or vertically.",
      nl: "Torens bewegen in rechte lijnen — horizontaal of verticaal — over een willekeurig aantal velden.",
    },
    fen: "8/8/8/8/3R4/8/8/4K2k w - - 0 1",
    highlight: "d4",
    goal: "any-legal-move",
  },
  {
    id: "bishop",
    title:       { en: "The Bishop", nl: "De Loper",    ar: "الفيل" },
    description: {
      en: "Bishops move any number of squares diagonally and stay on one color all game.",
      nl: "Lopers bewegen diagonaal over een willekeurig aantal velden en blijven hun hele partij op één kleur.",
    },
    fen: "8/8/8/8/3B4/8/8/4K2k w - - 0 1",
    highlight: "d4",
    goal: "any-legal-move",
  },
  {
    id: "knight",
    title:       { en: "The Knight", nl: "Het Paard",   ar: "الحصان" },
    description: {
      en: "Knights jump in an L-shape: two squares in one direction, then one perpendicular. They can leap over pieces.",
      nl: "Paarden springen in een L-vorm: twee velden in één richting, dan één loodrecht. Ze kunnen over stukken heen.",
    },
    fen: "8/8/8/8/3N4/8/8/4K2k w - - 0 1",
    highlight: "d4",
    goal: "any-legal-move",
  },
  {
    id: "queen",
    title:       { en: "The Queen",  nl: "De Dame",     ar: "الملكة" },
    description: {
      en: "The queen combines the rook and the bishop — any direction, any distance.",
      nl: "De dame combineert toren en loper — elke richting, elke afstand.",
    },
    fen: "8/8/8/8/3Q4/8/8/4K2k w - - 0 1",
    highlight: "d4",
    goal: "any-legal-move",
  },
  {
    id: "king",
    title:       { en: "The King",   nl: "De Koning",   ar: "الملك" },
    description: {
      en: "The king moves exactly one square in any direction. Protect it at all costs.",
      nl: "De koning beweegt precies één veld in elke richting. Bescherm hem koste wat het kost.",
    },
    fen: "8/8/8/8/3K4/8/8/7k w - - 0 1",
    highlight: "d4",
    goal: "any-legal-move",
  },
];

export const CHESS_PUZZLES: ChessPuzzle[] = [
  {
    id: "back-rank-mate",
    title: { en: "Back-rank mate", nl: "Achterveld mat", ar: "كش مات الصف الأخير" },
    // White to move, mate in 1 with Rd8#
    fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
    sideToMove: "w",
    solution: ["Rd8#", "Rd8"],
  },
  {
    id: "scholars-mate",
    title: { en: "Scholar's mate", nl: "Schoolmeestersmat", ar: "كش مات العالم" },
    // White to move, Qxf7#
    fen: "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4",
    sideToMove: "w",
    solution: ["Qxf7#", "Qxf7"],
  },
];

export function getChessLesson(id: string) {
  return CHESS_LESSONS.find(l => l.id === id);
}
export function getChessPuzzle(id: string) {
  return CHESS_PUZZLES.find(p => p.id === id);
}
