// Lightweight JS chess engine. Two strengths for play + a small evaluator
// for the in-game eval bar and suggestion/threat arrows.
import { Chess } from "chess.js";

const VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Center-weighted piece-square table (small bonus).
const CENTER = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 1, 1, 2, 2, 1, 1, 0,
  0, 1, 2, 3, 3, 2, 1, 0,
  0, 2, 3, 4, 4, 3, 2, 0,
  0, 2, 3, 4, 4, 3, 2, 0,
  0, 1, 2, 3, 3, 2, 1, 0,
  0, 1, 1, 2, 2, 1, 1, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
];

function sqIdx(sq: string) {
  const f = sq.charCodeAt(0) - 97;
  const r = parseInt(sq[1], 10) - 1;
  return r * 8 + f;
}

/** Static evaluation in centipawns from White's POV. */
export function evaluate(game: Chess): number {
  if (game.isCheckmate()) return game.turn() === "w" ? -99999 : 99999;
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) return 0;
  let s = 0;
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p) continue;
      const v = VAL[p.type] || 0;
      const idx = (7 - r) * 8 + f;
      const pst = CENTER[idx];
      const tot = v + pst;
      s += p.color === "w" ? tot : -tot;
    }
  }
  return s;
}

export interface EngineMove { from: string; to: string; promotion?: string; san?: string }

/** Negamax with alpha-beta to a small depth. Returns best move + score. */
export function findBestMove(game: Chess, depth = 2): { move: EngineMove | null; score: number } {
  const turn = game.turn();
  const moves = game.moves({ verbose: true }) as any[];
  if (!moves.length) return { move: null, score: evaluate(game) };

  let bestMove: EngineMove | null = null;
  let bestScore = -Infinity;
  // Light move ordering: captures first.
  moves.sort((a, b) => (b.captured ? VAL[b.captured] : 0) - (a.captured ? VAL[a.captured] : 0));

  for (const m of moves) {
    game.move(m);
    const score = -negamax(game, depth - 1, -Infinity, Infinity, turn === "w" ? -1 : 1);
    game.undo();
    if (score > bestScore) {
      bestScore = score;
      bestMove = { from: m.from, to: m.to, promotion: m.promotion, san: m.san };
    }
  }
  // bestScore is from side-to-move POV; return White-POV via sign.
  const whitePOV = turn === "w" ? bestScore : -bestScore;
  return { move: bestMove, score: whitePOV };
}

function negamax(game: Chess, depth: number, alpha: number, beta: number, sign: number): number {
  if (depth <= 0 || game.isGameOver()) return sign * evaluate(game);
  const moves = game.moves({ verbose: true }) as any[];
  if (!moves.length) return sign * evaluate(game);
  let best = -Infinity;
  for (const m of moves) {
    game.move(m);
    const v = -negamax(game, depth - 1, -beta, -alpha, -sign);
    game.undo();
    if (v > best) best = v;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/** Opponent's best reply if they were to move now (threat arrow). */
export function findThreat(game: Chess): EngineMove | null {
  // Build a position where the opponent moves: flip the side-to-move via FEN edit.
  try {
    const parts = game.fen().split(" ");
    parts[1] = parts[1] === "w" ? "b" : "w";
    // Reset en passant + castling rights stay; clear EP square to avoid illegal state.
    parts[3] = "-";
    const g2 = new Chess(parts.join(" "));
    return findBestMove(g2, 2).move;
  } catch { return null; }
}

export function pickEngineMove(game: Chess, elo: number): EngineMove | null {
  const moves = game.moves({ verbose: true }) as any[];
  if (!moves.length) return null;

  // Map ELO 100-1000 to (depth, blunderChance, randomTopN).
  // 100  : pure random
  // 200  : 60% random / 40% depth-1
  // 300  : 35% random / 65% depth-1
  // 400  : 20% random / 80% depth-2
  // 500  : 12% random / 88% depth-2
  // 600  : 7% random  / 93% depth-2
  // 700  : depth-2 (pick from top-3)
  // 800  : depth-2 (pick from top-2)
  // 900  : depth-3 (pick from top-2)
  // 1000 : depth-3 best move
  const cfg = (() => {
    if (elo <= 100) return { depth: 0, blunder: 1.0, topN: 1 };
    if (elo <= 200) return { depth: 1, blunder: 0.6, topN: 1 };
    if (elo <= 300) return { depth: 1, blunder: 0.35, topN: 2 };
    if (elo <= 400) return { depth: 2, blunder: 0.2, topN: 2 };
    if (elo <= 500) return { depth: 2, blunder: 0.12, topN: 2 };
    if (elo <= 600) return { depth: 2, blunder: 0.07, topN: 2 };
    if (elo <= 700) return { depth: 2, blunder: 0.0, topN: 3 };
    if (elo <= 800) return { depth: 2, blunder: 0.0, topN: 2 };
    if (elo <= 900) return { depth: 3, blunder: 0.0, topN: 2 };
    return { depth: 3, blunder: 0.0, topN: 1 };
  })();

  if (cfg.blunder > 0 && Math.random() < cfg.blunder) {
    const m = moves[Math.floor(Math.random() * moves.length)];
    return { from: m.from, to: m.to, promotion: m.promotion };
  }

  if (cfg.depth <= 1) {
    // Quick: score each move by static eval after the move.
    const turn = game.turn();
    const scored = moves.map(m => {
      game.move(m);
      const s = (turn === "w" ? 1 : -1) * evaluate(game);
      game.undo();
      return { m, s };
    }).sort((a, b) => b.s - a.s);
    const pool = scored.slice(0, Math.max(1, cfg.topN));
    const pick = pool[Math.floor(Math.random() * pool.length)].m;
    return { from: pick.from, to: pick.to, promotion: pick.promotion };
  }

  // Depth >= 2: search per move, pick from top-N.
  const turn = game.turn();
  const scored = moves.map(m => {
    game.move(m);
    const s = -negamax(game, cfg.depth - 1, -Infinity, Infinity, turn === "w" ? -1 : 1);
    game.undo();
    return { m, s };
  }).sort((a, b) => b.s - a.s);
  const pool = scored.slice(0, Math.max(1, cfg.topN));
  const pick = pool[Math.floor(Math.random() * pool.length)].m;
  return { from: pick.from, to: pick.to, promotion: pick.promotion };
}
