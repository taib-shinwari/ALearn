// Tiny chess engine. Two strengths:
//   100 ELO: fully random legal move.
//   200 ELO: prefer best capture by material; else random.
import type { Chess } from "chess.js";

const VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export interface EngineMove { from: string; to: string; promotion?: string }

export function pickEngineMove(game: Chess, elo: number): EngineMove | null {
  const moves = game.moves({ verbose: true }) as any[];
  if (!moves.length) return null;
  if (elo <= 100) {
    const m = moves[Math.floor(Math.random() * moves.length)];
    return { from: m.from, to: m.to, promotion: m.promotion };
  }
  // 200: greedy capture
  const scored = moves.map(m => ({
    m,
    s: (m.captured ? VAL[m.captured] || 0 : 0) + (m.san?.includes("#") ? 999 : 0) + (m.san?.includes("+") ? 0.2 : 0),
  }));
  scored.sort((a, b) => b.s - a.s);
  const top = scored.filter(x => x.s === scored[0].s);
  const pick = top[Math.floor(Math.random() * top.length)].m;
  return { from: pick.from, to: pick.to, promotion: pick.promotion };
}
