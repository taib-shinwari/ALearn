// Chess curriculum. Each lesson supports:
//   1. intro phase: animated arrows + narration
//   2. play phase: capture all stars (random or scripted) using legal moves
//   3. done phase: completion + auto-advance

export type Lang = "nl" | "en" | "ar";
export interface CName { nl: string; en: string; ar?: string }

export type PieceColor = "w" | "b";
export type PieceType = "K" | "Q" | "R" | "B" | "N" | "P";

export interface PlacedPiece {
  square: string;
  color: PieceColor;
  type: PieceType;
  themed?: boolean;
}

export interface Arrow { from: string; to: string; color?: string }

export interface ChessLesson {
  id: string;
  name: CName;
  piece: PlacedPiece;
  /** Non-controlled pieces displayed on the board (capturable when a star sits on them). */
  extras?: PlacedPiece[];
  introArrows: Arrow[];
  intro: CName;
  /** Either scripted star squares OR (if randomStars) the count of random stars to generate. */
  stars?: string[];
  randomStars?: number;
  /** If true, stars can be captured in any order. Otherwise sequential. */
  freeOrder?: boolean;
  done?: CName;
  orientation?: "white" | "black";
}

export interface ChessGroup { id: string; name: CName; lessons: ChessLesson[] }
export interface ChessLevel { id: string; name: CName; groups: ChessGroup[] }

// ── Lessons ──────────────────────────────────────────────────────────

const king: ChessLesson = {
  id: "king",
  name: { nl: "De koning", en: "The King", ar: "الملك" },
  piece: { square: "e4", color: "w", type: "K", themed: true },
  introArrows: [
    { from: "e4", to: "d4" }, { from: "e4", to: "f4" },
    { from: "e4", to: "d5" }, { from: "e4", to: "e5" }, { from: "e4", to: "f5" },
    { from: "e4", to: "d3" }, { from: "e4", to: "e3" }, { from: "e4", to: "f3" },
  ],
  intro: {
    nl: "Dit is de koning. De koning beweegt één veld in elke richting.",
    en: "This is the King. The King moves one square in any direction.",
    ar: "هذا هو الملك. يتحرك الملك خانة واحدة في أي اتجاه.",
  },
  randomStars: 3,
  freeOrder: true,
  done: { nl: "Goed gedaan!", en: "Well done!", ar: "أحسنت!" },
};

const queen: ChessLesson = {
  id: "queen",
  name: { nl: "De dame", en: "The Queen", ar: "الوزير" },
  piece: { square: "d4", color: "w", type: "Q", themed: true },
  introArrows: [
    { from: "d4", to: "d8" }, { from: "d4", to: "d1" },
    { from: "d4", to: "a4" }, { from: "d4", to: "h4" },
    { from: "d4", to: "a1" }, { from: "d4", to: "h8" },
    { from: "d4", to: "a7" }, { from: "d4", to: "g1" },
  ],
  intro: {
    nl: "De dame is het sterkst. Zij beweegt zo ver als ze wil in elke richting.",
    en: "The Queen is the strongest piece. She moves any number of squares in any direction.",
    ar: "الوزير أقوى قطعة. يتحرك في كل الاتجاهات.",
  },
  randomStars: 3,
  freeOrder: true,
  done: { nl: "Mooi!", en: "Nice!", ar: "أحسنت!" },
};

const rook: ChessLesson = {
  id: "rook",
  name: { nl: "De toren", en: "The Rook", ar: "الرخ" },
  piece: { square: "d4", color: "w", type: "R", themed: true },
  introArrows: [
    { from: "d4", to: "d8" }, { from: "d4", to: "d1" },
    { from: "d4", to: "a4" }, { from: "d4", to: "h4" },
  ],
  intro: {
    nl: "De toren beweegt in rechte lijnen — horizontaal of verticaal.",
    en: "The Rook moves in straight lines — horizontally or vertically.",
    ar: "يتحرك الرخ في خطوط مستقيمة.",
  },
  randomStars: 3,
  freeOrder: true,
  done: { nl: "Goed!", en: "Great!", ar: "ممتاز!" },
};

const bishop: ChessLesson = {
  id: "bishop",
  name: { nl: "De loper", en: "The Bishop", ar: "الفيل" },
  piece: { square: "c1", color: "w", type: "B", themed: true },
  introArrows: [
    { from: "c1", to: "a3" }, { from: "c1", to: "h6" },
  ],
  intro: {
    nl: "De loper beweegt diagonaal — hij blijft altijd op dezelfde kleur.",
    en: "The Bishop moves diagonally — it always stays on the same color.",
    ar: "يتحرك الفيل قطرياً ويبقى على نفس اللون.",
  },
  randomStars: 3,
  freeOrder: true,
  done: { nl: "Goed!", en: "Great!", ar: "ممتاز!" },
};

const knight: ChessLesson = {
  id: "knight",
  name: { nl: "Het paard", en: "The Knight", ar: "الحصان" },
  piece: { square: "d4", color: "w", type: "N", themed: true },
  introArrows: [
    { from: "d4", to: "e6" }, { from: "d4", to: "f5" },
    { from: "d4", to: "f3" }, { from: "d4", to: "e2" },
    { from: "d4", to: "c2" }, { from: "d4", to: "b3" },
    { from: "d4", to: "b5" }, { from: "d4", to: "c6" },
  ],
  intro: {
    nl: "Het paard springt in een L-vorm: twee velden in één richting, dan één opzij.",
    en: "The Knight jumps in an L-shape: two squares one way, then one to the side.",
    ar: "يقفز الحصان على شكل حرف L.",
  },
  randomStars: 3,
  freeOrder: true,
  done: { nl: "Mooi!", en: "Nice!", ar: "أحسنت!" },
};

const pawn: ChessLesson = {
  id: "pawn",
  name: { nl: "De pion", en: "The Pawn", ar: "البيدق" },
  piece: { square: "e2", color: "w", type: "P", themed: true },
  introArrows: [
    { from: "e2", to: "e3" }, { from: "e2", to: "e4" },
  ],
  intro: {
    nl: "De pion gaat één veld vooruit. Vanaf de startrij mag hij twee velden.",
    en: "The Pawn moves one square forward. From its starting rank it can move two.",
    ar: "يتحرك البيدق خانة للأمام، أو خانتين من بدايته.",
  },
  stars: ["e4", "e5", "e6"],
  done: { nl: "Goed!", en: "Good!", ar: "أحسنت!" },
};

const enPassant: ChessLesson = {
  id: "en-passant",
  name: { nl: "En passant", en: "En Passant", ar: "الأخذ بالتجاوز" },
  piece: { square: "e5", color: "w", type: "P", themed: true },
  extras: [{ square: "d5", color: "b", type: "P" }],
  introArrows: [{ from: "e5", to: "d6" }],
  intro: {
    nl: "Als een vijandelijke pion vanaf zijn startrij twee velden naast je pion springt, mag je 'en passant' slaan — alsof hij maar één veld was gegaan.",
    en: "When an enemy pawn jumps two squares next to your pawn, you may capture 'en passant' — as if it had moved only one square.",
    ar: "إذا قفز بيدق الخصم خانتين بجوار بيدقك، يمكنك أخذه بالتجاوز.",
  },
  stars: ["d6"],
  done: { nl: "Briljant!", en: "Brilliant!", ar: "رائع!" },
};

const captures: ChessLesson = {
  id: "captures",
  name: { nl: "Slaan", en: "Captures", ar: "الأخذ" },
  piece: { square: "d4", color: "w", type: "Q", themed: true },
  extras: [
    { square: "d7", color: "b", type: "P" },
    { square: "g4", color: "b", type: "N" },
    { square: "a1", color: "b", type: "B" },
  ],
  introArrows: [
    { from: "d4", to: "d7" }, { from: "d4", to: "g4" }, { from: "d4", to: "a1" },
  ],
  intro: {
    nl: "Beweeg op een vijandelijk stuk om het te slaan. Sla alle vijanden!",
    en: "Move onto an enemy piece to capture it. Capture every enemy!",
    ar: "تحرك إلى قطعة الخصم لأخذها. خذ كل القطع!",
  },
  stars: ["d7", "g4", "a1"],
  freeOrder: true,
  done: { nl: "Alle vijanden geslagen!", en: "All enemies captured!", ar: "تم أخذ الجميع!" },
};

const check: ChessLesson = {
  id: "check",
  name: { nl: "Schaak", en: "Check", ar: "كش" },
  piece: { square: "d1", color: "w", type: "Q", themed: true },
  extras: [{ square: "e8", color: "b", type: "K" }],
  introArrows: [{ from: "d1", to: "e2" }],
  intro: {
    nl: "Schaak betekent: de koning wordt aangevallen. Zet de zwarte koning schaak met je dame.",
    en: "Check means the King is attacked. Put the black King in check with your Queen.",
    ar: "كش تعني أن الملك مهدد. ضع ملك الخصم في كش.",
  },
  // Any square that attacks e8 with a queen: e2..e7, a8..h8 (except e8), d-diagonal d2,c3..a5? actually d1->e8 is not a queen line. Acceptable stars: e2-e7 (file), b5/c6/d7 (diagonal), a8..h8 row except e8.
  stars: ["e7"],
  freeOrder: true,
  done: { nl: "Schaak!", en: "Check!", ar: "كش!" },
};

const escapeCheck: ChessLesson = {
  id: "escape-check",
  name: { nl: "Uit schaak", en: "Out Of Check", ar: "الخروج من الكش" },
  piece: { square: "e1", color: "w", type: "K", themed: true },
  extras: [{ square: "e8", color: "b", type: "R" }],
  introArrows: [
    { from: "e1", to: "d1" }, { from: "e1", to: "f1" }, { from: "e1", to: "d2" }, { from: "e1", to: "f2" },
  ],
  intro: {
    nl: "Je staat schaak. Drie manieren om eruit te komen: lopen, slaan, of blokkeren. Verplaats de koning naar een veilig veld.",
    en: "You are in check. Three ways out: move, capture, or block. Move the King to a safe square.",
    ar: "أنت في كش. ثلاث طرق للخروج: التحرك، الأخذ، أو الحجب.",
  },
  // Safe squares for K on e1 with rook on e8: anything not on e-file. King squares: d1, f1, d2, f2.
  stars: ["d1"],
  freeOrder: true,
  done: { nl: "Veilig!", en: "Safe!", ar: "آمن!" },
};

const checkmate: ChessLesson = {
  id: "checkmate",
  name: { nl: "Schaakmat", en: "Checkmate", ar: "كش مات" },
  piece: { square: "a1", color: "w", type: "Q", themed: true },
  extras: [
    { square: "h8", color: "b", type: "K" },
    { square: "g7", color: "w", type: "K", themed: true },
  ],
  introArrows: [{ from: "a1", to: "h1" }],
  intro: {
    nl: "Schaakmat: de koning staat schaak en kan niet ontsnappen. Zet de zwarte koning mat met je dame op de achterste rij.",
    en: "Checkmate: the King is attacked with no escape. Mate the black King with your Queen on the back rank.",
    ar: "كش مات: الملك في كش ولا مهرب. ضع ملك الأسود في مات.",
  },
  // Qa1 -> a8 along a-file, or any rank that mates supported by Kg7. Easiest: Qa1->a8 = back-rank mate (King supports? not needed for our toy detection). Star a8.
  stars: ["a8"],
  done: { nl: "Schaakmat!", en: "Checkmate!", ar: "كش مات!" },
};

const castling: ChessLesson = {
  id: "castling",
  name: { nl: "Rokade", en: "Castling", ar: "التبييت" },
  piece: { square: "e1", color: "w", type: "K", themed: true },
  extras: [
    { square: "h1", color: "w", type: "R", themed: true },
    { square: "a1", color: "w", type: "R", themed: true },
  ],
  introArrows: [{ from: "e1", to: "g1" }, { from: "e1", to: "c1" }],
  intro: {
    nl: "Bij rokade verplaats je je koning twee velden naar een toren, en de toren springt eroverheen. Speel korte rokade naar g1.",
    en: "In castling, the King moves two squares toward a Rook and the Rook hops over. Play short castling to g1.",
    ar: "في التبييت، يتحرك الملك خانتين نحو الرخ.",
  },
  stars: ["g1"],
  done: { nl: "Mooie rokade!", en: "Nice castle!", ar: "تبييت ممتاز!" },
};

export const chessLevels: ChessLevel[] = [
  {
    id: "beginner",
    name: { nl: "Beginner", en: "Beginner", ar: "مبتدئ" },
    groups: [{
      id: "learn-to-play",
      name: { nl: "Leer spelen", en: "Learn To Play", ar: "تعلم اللعب" },
      lessons: [king, queen, rook, bishop, knight, pawn, enPassant, captures, check, escapeCheck, checkmate, castling],
    }],
  },
  { id: "intermediate", name: { nl: "Gevorderd", en: "Intermediate", ar: "متوسط" }, groups: [] },
  { id: "advanced", name: { nl: "Expert", en: "Advanced", ar: "متقدم" }, groups: [] },
];

export function cName(n: CName, lang: Lang): string {
  if (lang === "ar" && n.ar) return n.ar;
  return n[lang] ?? n.en;
}

// ── Legal-move helpers ───────────────────────────────────────────────
function sqToFR(sq: string): [number, number] {
  return [sq.charCodeAt(0) - 97, parseInt(sq[1], 10) - 1];
}
export function frToSq(f: number, r: number): string {
  return `${String.fromCharCode(97 + f)}${r + 1}`;
}

export function isLegalMove(type: PieceType, from: string, to: string, captureTarget = false): boolean {
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
    case "P": {
      // White pawn. Forward 1 always; forward 2 from rank 2; diagonal 1 only when capturing.
      const fwd = r2 - r1;
      if (df === 0 && fwd === 1) return true;
      if (df === 0 && fwd === 2 && r1 === 1) return true;
      if (df === 1 && fwd === 1 && captureTarget) return true;
      return false;
    }
  }
}

/** Enumerate reachable squares for a single piece on an empty board (ignoring blockers). */
export function reachableSquares(type: PieceType, from: string): string[] {
  const [f, r] = sqToFR(from);
  const out: string[] = [];
  for (let ff = 0; ff < 8; ff++) for (let rr = 0; rr < 8; rr++) {
    const to = frToSq(ff, rr);
    if (isLegalMove(type, from, to, true)) out.push(to);
  }
  return out;
}
