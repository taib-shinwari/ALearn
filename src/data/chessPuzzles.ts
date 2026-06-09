// Handcrafted chess puzzles. Each puzzle is a FEN + sequence of correct user moves.
// After each correct user move the bot replies with the next opponent move (if any).

export interface Puzzle {
  id: string;
  title: { nl: string; en: string; ar?: string };
  fen: string;
  /** Side the user plays. */
  userColor: "w" | "b";
  /** Solution as alternating user / opponent UCI-like moves (e.g. "e2e4"). */
  solution: string[];
  /** One-line theme. */
  theme: { nl: string; en: string; ar?: string };
}

export const PUZZLES: Puzzle[] = [
  {
    id: "mate-in-1-back-rank",
    title: { nl: "Mat in 1", en: "Mate in 1", ar: "مات في 1" },
    fen: "6k1/5ppp/8/8/8/8/8/R6K w - - 0 1",
    userColor: "w",
    solution: ["a1a8"],
    theme: { nl: "Achterste-rij mat", en: "Back-rank mate", ar: "مات الصف الأخير" },
  },
  {
    id: "fork-knight",
    title: { nl: "Vork", en: "Fork", ar: "شوكة" },
    fen: "r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1",
    userColor: "w",
    solution: ["d5c7"],
    theme: { nl: "Paardvork koning + toren", en: "Knight fork: king & rook", ar: "شوكة الحصان" },
  },
  {
    id: "mate-in-1-queen",
    title: { nl: "Mat in 1", en: "Mate in 1", ar: "مات في 1" },
    fen: "6k1/5ppp/8/8/8/8/5PPP/4Q1K1 w - - 0 1",
    solution: ["e1e8"],
    userColor: "w",
    theme: { nl: "Dame zet mat", en: "Queen delivers mate", ar: "مات الوزير" },
  },
  {
    id: "pin-bishop",
    title: { nl: "Penning", en: "Pin", ar: "تثبيت" },
    fen: "4k3/8/8/8/8/3q4/8/3RK3 w - - 0 1",
    userColor: "w",
    solution: ["d1d3"],
    theme: { nl: "Sla de gepende dame", en: "Capture the pinned queen", ar: "خذ الوزير المثبت" },
  },
  {
    id: "mate-in-2-ladder",
    title: { nl: "Ladder mat", en: "Ladder mate", ar: "مات السلم" },
    fen: "4k3/8/8/8/8/8/R7/1R2K3 w - - 0 1",
    userColor: "w",
    // 1. Rb8+ Kd7 2. Ra7+ Kc6 ... acceptable single-line short script
    solution: ["b1b7", "e8d8", "a2a8"],
    theme: { nl: "Twee torens", en: "Two rooks", ar: "رخّان" },
  },
];
