// Lightweight JS chess engine with alpha-beta + quiescence + light positional eval.
// Tuned for ELO range 100..1000 in pickEngineMove.
import { Chess } from "chess.js";

const VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Piece-square tables (white POV, ranks 8→1).
const PST = {
  p: [
     0, 0, 0, 0, 0, 0, 0, 0,
    50,50,50,50,50,50,50,50,
    10,10,20,30,30,20,10,10,
     5, 5,10,25,25,10, 5, 5,
     0, 0, 0,20,20, 0, 0, 0,
     5,-5,-10, 0, 0,-10,-5, 5,
     5,10,10,-20,-20,10,10, 5,
     0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
   -50,-40,-30,-30,-30,-30,-40,-50,
   -40,-20,  0,  0,  0,  0,-20,-40,
   -30,  0, 10, 15, 15, 10,  0,-30,
   -30,  5, 15, 20, 20, 15,  5,-30,
   -30,  0, 15, 20, 20, 15,  0,-30,
   -30,  5, 10, 15, 15, 10,  5,-30,
   -40,-20,  0,  5,  5,  0,-20,-40,
   -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
   -20,-10,-10,-10,-10,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5, 10, 10,  5,  0,-10,
   -10,  5,  5, 10, 10,  5,  5,-10,
   -10,  0, 10, 10, 10, 10,  0,-10,
   -10, 10, 10, 10, 10, 10, 10,-10,
   -10,  5,  0,  0,  0,  0,  5,-10,
   -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
     0, 0, 0, 0, 0, 0, 0, 0,
     5,10,10,10,10,10,10, 5,
    -5, 0, 0, 0, 0, 0, 0,-5,
    -5, 0, 0, 0, 0, 0, 0,-5,
    -5, 0, 0, 0, 0, 0, 0,-5,
    -5, 0, 0, 0, 0, 0, 0,-5,
    -5, 0, 0, 0, 0, 0, 0,-5,
     0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
   -20,-10,-10,-5,-5,-10,-10,-20,
   -10,  0,  0, 0, 0,  0,  0,-10,
   -10,  0,  5, 5, 5,  5,  0,-10,
    -5,  0,  5, 5, 5,  5,  0, -5,
     0,  0,  5, 5, 5,  5,  0, -5,
   -10,  5,  5, 5, 5,  5,  0,-10,
   -10,  0,  5, 0, 0,  0,  0,-10,
   -20,-10,-10,-5,-5,-10,-10,-20,
  ],
  k: [
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -20,-30,-30,-40,-40,-30,-30,-20,
   -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 10,  0,  0, 10, 30, 20,
  ],
} as const;

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
      const table = (PST as any)[p.type] as number[];
      // Index for white from white-POV; mirror for black.
      const idx = p.color === "w" ? r * 8 + f : (7 - r) * 8 + f;
      const pst = table ? table[idx] : 0;
      const tot = v + pst;
      s += p.color === "w" ? tot : -tot;
    }
  }
  // Light mobility (cheap: count current side moves and negate for opponent estimate).
  const turn = game.turn();
  const myMoves = (game.moves() as string[]).length;
  s += (turn === "w" ? 1 : -1) * myMoves * 2;
  return s;
}

export interface EngineMove { from: string; to: string; promotion?: string; san?: string }

function orderMoves(moves: any[]): any[] {
  // MVV-LVA-ish: prioritise captures of high-value pieces by low-value attackers, then promotions, then checks.
  return moves.slice().sort((a, b) => {
    const sa = (a.captured ? (VAL[a.captured] || 0) - (VAL[a.piece] || 0) / 10 : 0)
             + (a.promotion ? 800 : 0) + (a.san?.endsWith("+") ? 50 : 0);
    const sb = (b.captured ? (VAL[b.captured] || 0) - (VAL[b.piece] || 0) / 10 : 0)
             + (b.promotion ? 800 : 0) + (b.san?.endsWith("+") ? 50 : 0);
    return sb - sa;
  });
}

function quiesce(game: Chess, alpha: number, beta: number, sign: number, depth: number): number {
  const standPat = sign * evaluate(game);
  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;
  if (depth <= 0) return alpha;
  const moves = (game.moves({ verbose: true }) as any[]).filter(m => m.captured || m.promotion);
  for (const m of orderMoves(moves)) {
    game.move(m);
    const score = -quiesce(game, -beta, -alpha, -sign, depth - 1);
    game.undo();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function negamax(game: Chess, depth: number, alpha: number, beta: number, sign: number): number {
  if (game.isGameOver()) return sign * evaluate(game);
  if (depth <= 0) return quiesce(game, alpha, beta, sign, 4);
  const moves = game.moves({ verbose: true }) as any[];
  if (!moves.length) return sign * evaluate(game);
  let best = -Infinity;
  for (const m of orderMoves(moves)) {
    game.move(m);
    const v = -negamax(game, depth - 1, -beta, -alpha, -sign);
    game.undo();
    if (v > best) best = v;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/** Best move at the requested depth, plus its score (white POV centipawns). */
export function findBestMove(game: Chess, depth = 3): { move: EngineMove | null; score: number } {
  const turn = game.turn();
  const moves = game.moves({ verbose: true }) as any[];
  if (!moves.length) return { move: null, score: evaluate(game) };

  let bestMove: EngineMove | null = null;
  let bestScore = -Infinity;
  for (const m of orderMoves(moves)) {
    game.move(m);
    const score = -negamax(game, depth - 1, -Infinity, Infinity, turn === "w" ? -1 : 1);
    game.undo();
    if (score > bestScore) {
      bestScore = score;
      bestMove = { from: m.from, to: m.to, promotion: m.promotion, san: m.san };
    }
  }
  const whitePOV = turn === "w" ? bestScore : -bestScore;
  return { move: bestMove, score: whitePOV };
}

/** Opponent's best reply if they were to move now (threat arrow). */
export function findThreat(game: Chess): EngineMove | null {
  try {
    const parts = game.fen().split(" ");
    parts[1] = parts[1] === "w" ? "b" : "w";
    parts[3] = "-";
    const g2 = new Chess(parts.join(" "));
    return findBestMove(g2, 2).move;
  } catch { return null; }
}

export function pickEngineMove(game: Chess, elo: number): EngineMove | null {
  const moves = game.moves({ verbose: true }) as any[];
  if (!moves.length) return null;

  // ELO 100..1000 → (depth, blunderChance, topN).
  const cfg = (() => {
    if (elo <= 100) return { depth: 1, blunder: 0.85, topN: 1 };
    if (elo <= 200) return { depth: 1, blunder: 0.55, topN: 2 };
    if (elo <= 300) return { depth: 2, blunder: 0.30, topN: 3 };
    if (elo <= 400) return { depth: 2, blunder: 0.18, topN: 3 };
    if (elo <= 500) return { depth: 2, blunder: 0.10, topN: 2 };
    if (elo <= 600) return { depth: 3, blunder: 0.05, topN: 2 };
    if (elo <= 700) return { depth: 3, blunder: 0.02, topN: 2 };
    if (elo <= 800) return { depth: 3, blunder: 0.0,  topN: 2 };
    if (elo <= 900) return { depth: 4, blunder: 0.0,  topN: 2 };
    return { depth: 4, blunder: 0.0, topN: 1 };
  })();

  if (cfg.blunder > 0 && Math.random() < cfg.blunder) {
    const m = moves[Math.floor(Math.random() * moves.length)];
    return { from: m.from, to: m.to, promotion: m.promotion };
  }

  const turn = game.turn();
  const scored = orderMoves(moves).map(m => {
    game.move(m);
    const s = -negamax(game, cfg.depth - 1, -Infinity, Infinity, turn === "w" ? -1 : 1);
    game.undo();
    return { m, s };
  }).sort((a, b) => b.s - a.s);
  const pool = scored.slice(0, Math.max(1, cfg.topN));
  const pick = pool[Math.floor(Math.random() * pool.length)].m;
  return { from: pick.from, to: pick.to, promotion: pick.promotion };
}
