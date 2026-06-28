// Move-classification logic for the post-game analysis view.
// Powered by Stockfish.wasm (UCI) for accurate centipawn loss + best move.
import { Chess } from "chess.js";
import { sfEvaluate } from "Client/Library/stockfish";

export type ClassKind =
  | "brilliant" | "great" | "book" | "best" | "excellent"
  | "good" | "inaccuracy" | "mistake" | "miss" | "blunder";

export const CLASS_ORDER: ClassKind[] = [
  "brilliant", "great", "book", "best", "excellent",
  "good", "inaccuracy", "mistake", "miss", "blunder",
];

export interface ClassMeta {
  label: string;
  short: string;
  glyph: string;     // text glyph used as the icon (emoji/symbol)
  color: string;     // HSL color used for backgrounds & dots
  text: string;      // matching tailwind text class
  bg: string;        // tinted tailwind bg class for cells
}

export const CLASS_META: Record<ClassKind, ClassMeta> = {
  brilliant:  { label: "Brilliant",  short: "!!", glyph: "!!", color: "hsl(174 70% 45%)", text: "text-teal-400",    bg: "" },
  great:      { label: "Great",      short: "!",  glyph: "!",  color: "hsl(217 70% 55%)", text: "text-blue-400",    bg: "" },
  book:       { label: "Book",       short: "B",  glyph: "B",  color: "hsl(28 60% 55%)",  text: "text-amber-500",   bg: "" },
  best:       { label: "Best",       short: "*",  glyph: "*",  color: "hsl(142 65% 45%)", text: "text-emerald-500", bg: "" },
  excellent:  { label: "Excellent",  short: "+",  glyph: "+",  color: "hsl(142 55% 50%)", text: "text-emerald-400", bg: "" },
  good:       { label: "Good",       short: "✓",  glyph: "✓",  color: "hsl(150 50% 50%)", text: "text-green-400",   bg: "" },
  inaccuracy: { label: "Inaccuracy", short: "?!", glyph: "?!", color: "hsl(45 90% 55%)",  text: "text-yellow-500",  bg: "" },
  mistake:    { label: "Mistake",    short: "?",  glyph: "?",  color: "hsl(28 90% 55%)",  text: "text-orange-500",  bg: "" },
  miss:       { label: "Miss",       short: "x",  glyph: "x",  color: "hsl(0 70% 55%)",   text: "text-rose-500",    bg: "" },
  blunder:    { label: "Blunder",    short: "??", glyph: "??", color: "hsl(0 80% 50%)",   text: "text-red-500",     bg: "" },
};

// Tiny built-in opening book (first plies in SAN). Anything matching counts as "book".
const BOOK_SAN: string[][] = [
  ["e4","e5","Nf3","Nc6","Bb5"],            // Ruy Lopez
  ["e4","e5","Nf3","Nc6","Bc4"],            // Italian
  ["e4","c5","Nf3","d6"],                    // Sicilian
  ["e4","c5","Nf3","Nc6"],                   // Sicilian
  ["e4","e6","d4","d5"],                     // French
  ["e4","c6","d4","d5"],                     // Caro-Kann
  ["d4","d5","c4"],                          // QGD
  ["d4","Nf6","c4","g6"],                    // KID
  ["d4","Nf6","c4","e6"],                    // Nimzo/QGD setups
  ["Nf3","d5","g3"],                         // Réti
  ["c4"],                                    // English
  ["e4","e5"], ["e4","c5"], ["e4","e6"], ["e4","c6"],
  ["d4","d5"], ["d4","Nf6"],
];

function isInBook(sansSoFar: string[]): boolean {
  return BOOK_SAN.some(line =>
    line.length >= sansSoFar.length &&
    sansSoFar.every((s, i) => line[i] === s)
  );
}

export interface PerMove {
  san: string;
  cpl: number;         // centipawn loss (mover's POV, >= 0)
  kind: ClassKind;
  accuracy: number;    // 0..100 for this move
  color: "w" | "b";
}

// Standard chess.com-style accuracy mapping.
function accuracyFromCpl(cpl: number): number {
  // win% from cpl: simple sigmoid
  const winPct = 50 + 50 * (2 / (1 + Math.exp(-0.004 * -cpl)) - 1);
  return Math.max(0, Math.min(100, winPct));
}

function classifyByCpl(cpl: number): ClassKind {
  if (cpl <= 10) return "best";
  if (cpl <= 25) return "excellent";
  if (cpl <= 50) return "good";
  if (cpl <= 100) return "inaccuracy";
  if (cpl <= 200) return "mistake";
  return "blunder";
}

/** Analyse a whole game using Stockfish.wasm. */
export async function analyseGame(
  fens: string[],
  sans: string[],
  opts: { depth?: number; onProgress?: (done: number, total: number) => void } = {},
): Promise<PerMove[]> {
  const depth = opts.depth ?? 12;
  const out: PerMove[] = [];
  const sansSoFar: string[] = [];
  for (let i = 0; i < sans.length; i++) {
    const before = new Chess(fens[i]);
    const mover: "w" | "b" = before.turn();

    // Best eval at position BEFORE move, from mover POV (Stockfish returns STM POV).
    let bestCp = 0;
    try {
      const evalBefore = await sfEvaluate(fens[i], depth);
      bestCp = evalBefore.scoreCp;
    } catch { /* keep 0 */ }

    // Eval AFTER the played move; Stockfish returns POV of the new side-to-move
    // (= the opponent). Negate to get back to mover POV.
    let playedCp = bestCp;
    try {
      const evalAfter = await sfEvaluate(fens[i + 1], Math.max(6, depth - 4));
      playedCp = -evalAfter.scoreCp;
    } catch { /* keep bestCp */ }

    const cpl = Math.max(0, bestCp - playedCp);
    let kind: ClassKind = classifyByCpl(cpl);

    sansSoFar.push(sans[i]);
    if (i < 16 && isInBook(sansSoFar)) kind = "book";

    out.push({
      san: sans[i],
      cpl,
      kind,
      accuracy: accuracyFromCpl(cpl),
      color: mover,
    });
    opts.onProgress?.(i + 1, sans.length);
  }
  return out;
}

export interface PlayerSummary {
  accuracy: number;
  phases: { opening: number | null; middlegame: number | null; endgame: number | null };
  counts: Record<ClassKind, number>;
  estimatedRating: number;
}

export function summarisePlayer(perMove: PerMove[], color: "w" | "b"): PlayerSummary {
  const own = perMove.filter(m => m.color === color);
  const avg = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

  // Phase by ply index of the original perMove array.
  const open: number[] = [], mid: number[] = [], end: number[] = [];
  perMove.forEach((m, i) => {
    if (m.color !== color) return;
    if (i < 16) open.push(m.accuracy);
    else if (i < 40) mid.push(m.accuracy);
    else end.push(m.accuracy);
  });

  const counts = Object.fromEntries(CLASS_ORDER.map(k => [k, 0])) as Record<ClassKind, number>;
  own.forEach(m => { counts[m.kind] += 1; });

  const accuracy = avg(own.map(m => m.accuracy)) ?? 0;
  const blunders = counts.blunder ?? 0;
  const mistakes = counts.mistake ?? 0;
  const inacc = counts.inaccuracy ?? 0;
  const rawRating = 400 + accuracy * 28 - blunders * 80 - mistakes * 30 - inacc * 8;
  const estimatedRating = Math.max(100, Math.min(3200, Math.round(rawRating)));

  return {
    accuracy,
    phases: {
      opening: avg(open),
      middlegame: avg(mid),
      endgame: avg(end),
    },
    counts,
    estimatedRating,
  };
}

/**
 * Short human-readable explanation for a move based on its classification
 * and centipawn loss. Optionally suffixed with the engine's preferred move.
 */
export function explainMove(
  kind: ClassKind,
  cpl: number,
  bestSan?: string,
): string {
  const lost = cpl >= 100 ? ` (lost ${(cpl / 100).toFixed(1)} pawns)` : "";
  const better = bestSan ? ` Engine preferred ${bestSan}.` : "";
  switch (kind) {
    case "brilliant": return "A brilliant move — finds the only winning idea.";
    case "great":     return "A great move — clearly the strongest continuation.";
    case "best":      return "The best move — matches the engine's top choice.";
    case "excellent": return "An excellent move — nearly engine-perfect.";
    case "good":      return "A good move — solid and safe.";
    case "book":      return "A known book move from theory.";
    case "inaccuracy":return `An inaccuracy${lost}.${better}`;
    case "mistake":   return `A mistake${lost}.${better}`;
    case "miss":      return `Missed a much stronger continuation${lost}.${better}`;
    case "blunder":   return `A blunder${lost}.${better}`;
  }
}
