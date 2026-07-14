// Chess engine: alpha-beta + iterative deepening + transposition table + quiescence
// + killer/history heuristics. Tuned for ELO range 100..2000 in pickEngineMove.
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
  // Endgame king PST favours central king.
  kEnd: [
   -50,-40,-30,-20,-20,-30,-40,-50,
   -30,-20,-10,  0,  0,-10,-20,-30,
   -30,-10, 20, 30, 30, 20,-10,-30,
   -30,-10, 30, 40, 40, 30,-10,-30,
   -30,-10, 30, 40, 40, 30,-10,-30,
   -30,-10, 20, 30, 30, 20,-10,-30,
   -30,-30,  0,  0,  0,  0,-30,-30,
   -50,-30,-30,-30,-30,-30,-30,-50,
  ],
} as const;

/** Static evaluation in centipawns from White's POV. */
export function evaluate(game: Chess): number {
  if (game.isCheckmate()) return game.turn() === "w" ? -99999 : 99999;
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) return 0;
  let s = 0;
  let totalMaterial = 0;
  const board = game.board();
  let wBishops = 0, bBishops = 0;
  const wPawnFiles: number[] = [], bPawnFiles: number[] = [];

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p) continue;
      const v = VAL[p.type] || 0;
      totalMaterial += v;
      if (p.type === "b") { if (p.color === "w") wBishops++; else bBishops++; }
      if (p.type === "p") { (p.color === "w" ? wPawnFiles : bPawnFiles).push(f); }
    }
  }
  const endgame = totalMaterial < 2400; // light endgame heuristic
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p) continue;
      const v = VAL[p.type] || 0;
      const tableSrc = (p.type === "k" && endgame) ? (PST as any).kEnd : (PST as any)[p.type];
      const idx = p.color === "w" ? r * 8 + f : (7 - r) * 8 + f;
      const pst = tableSrc ? tableSrc[idx] : 0;
      const tot = v + pst;
      s += p.color === "w" ? tot : -tot;
    }
  }

  // Bishop pair bonus
  if (wBishops >= 2) s += 35;
  if (bBishops >= 2) s -= 35;

  // Doubled pawns penalty
  const dup = (files: number[]) => {
    const seen: Record<number, number> = {};
    for (const f of files) seen[f] = (seen[f] || 0) + 1;
    let pen = 0;
    for (const k in seen) if (seen[k] > 1) pen += (seen[k] - 1) * 18;
    return pen;
  };
  s -= dup(wPawnFiles);
  s += dup(bPawnFiles);

  // Light mobility heuristic — count current side moves and estimate opponent.
  const turn = game.turn();
  const myMoves = (game.moves() as string[]).length;
  s += (turn === "w" ? 1 : -1) * myMoves * 3;

  return s;
}

export interface EngineMove { from: string; to: string; promotion?: string; san?: string }

// ── Transposition table ────────────────────────────────────────
type TTEntry = { depth: number; score: number; flag: 0 | 1 | 2; best?: string };
const TT = new Map<string, TTEntry>();
const TT_LIMIT = 50_000;
function ttKey(g: Chess): string {
  const f = g.fen().split(" ");
  return `${f[0]} ${f[1]} ${f[2]} ${f[3]}`;
}
function ttStore(key: string, e: TTEntry) {
  if (TT.size > TT_LIMIT) TT.clear();
  TT.set(key, e);
}

// Killer moves and history heuristic
const killers: string[][] = Array.from({ length: 32 }, () => []);
const history: Record<string, number> = {};
function moveKey(m: any): string { return `${m.from}${m.to}${m.promotion || ""}`; }

function orderMoves(moves: any[], ply: number, ttBest?: string): any[] {
  return moves.slice().sort((a, b) => score(b) - score(a));
  function score(m: any) {
    const k = moveKey(m);
    if (ttBest && k === ttBest) return 100000;
    if (m.captured) return 10000 + (VAL[m.captured] || 0) * 10 - (VAL[m.piece] || 0);
    if (m.promotion) return 9000 + (VAL[m.promotion] || 0);
    if (killers[ply]?.includes(k)) return 8000;
    return history[k] || 0;
  }
}

function quiesce(game: Chess, alpha: number, beta: number, sign: number, depth: number): number {
  const standPat = sign * evaluate(game);
  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;
  if (depth <= 0) return alpha;
  const moves = (game.moves({ verbose: true }) as any[]).filter(m => m.captured || m.promotion);
  for (const m of orderMoves(moves, 0)) {
    game.move(m);
    const score = -quiesce(game, -beta, -alpha, -sign, depth - 1);
    game.undo();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function isEndgame(game: Chess): boolean {
  let mat = 0;
  const b = game.board();
  for (const row of b) for (const p of row) if (p) mat += VAL[p.type] || 0;
  return mat < 2600;
}

function negamax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  sign: number,
  ply: number,
  allowNull = true,
): number {
  const alphaOrig = alpha;
  const key = ttKey(game);
  const tte = TT.get(key);
  if (tte && tte.depth >= depth) {
    if (tte.flag === 0) return tte.score;
    if (tte.flag === 1 && tte.score > alpha) alpha = tte.score;
    else if (tte.flag === 2 && tte.score < beta) beta = tte.score;
    if (alpha >= beta) return tte.score;
  }
  if (game.isGameOver()) return sign * evaluate(game);
  if (depth <= 0) return quiesce(game, alpha, beta, sign, 4);

  const inCheck = game.inCheck();

  // Null-move pruning.
  if (allowNull && !inCheck && depth >= 3 && !isEndgame(game)) {
    try {
      const parts = game.fen().split(" ");
      parts[1] = parts[1] === "w" ? "b" : "w";
      parts[3] = "-";
      const nullGame = new Chess(parts.join(" "));
      const R = depth > 6 ? 3 : 2;
      const v = -negamax(nullGame, depth - 1 - R, -beta, -beta + 1, -sign, ply + 1, false);
      if (v >= beta) return beta;
    } catch { /* skip */ }
  }

  const moves = game.moves({ verbose: true }) as any[];
  if (!moves.length) return sign * evaluate(game);

  let best = -Infinity;
  let bestMoveKey: string | undefined;
  let moveIdx = 0;
  for (const m of orderMoves(moves, ply, tte?.best)) {
    const isQuiet = !m.captured && !m.promotion;
    game.move(m);
    let v: number;
    let reduction = 0;
    if (depth >= 3 && moveIdx >= 3 && isQuiet && !inCheck) reduction = 1;
    if (moveIdx === 0) {
      v = -negamax(game, depth - 1, -beta, -alpha, -sign, ply + 1, true);
    } else {
      v = -negamax(game, depth - 1 - reduction, -alpha - 1, -alpha, -sign, ply + 1, true);
      if (v > alpha && reduction > 0) {
        v = -negamax(game, depth - 1, -alpha - 1, -alpha, -sign, ply + 1, true);
      }
      if (v > alpha && v < beta) {
        v = -negamax(game, depth - 1, -beta, -alpha, -sign, ply + 1, true);
      }
    }
    game.undo();
    if (v > best) { best = v; bestMoveKey = moveKey(m); }
    if (best > alpha) alpha = best;
    if (alpha >= beta) {
      if (isQuiet) {
        const kk = killers[ply] || (killers[ply] = []);
        if (!kk.includes(bestMoveKey!)) { kk.unshift(bestMoveKey!); if (kk.length > 2) kk.pop(); }
        history[bestMoveKey!] = (history[bestMoveKey!] || 0) + depth * depth;
      }
      break;
    }
    moveIdx++;
  }
  const flag: 0 | 1 | 2 = best <= alphaOrig ? 2 : (best >= beta ? 1 : 0);
  ttStore(key, { depth, score: best, flag, best: bestMoveKey });
  return best;
}

/** Best move via iterative deepening. */
export function findBestMove(game: Chess, depth = 3): { move: EngineMove | null; score: number } {
  const turn = game.turn();
  const root = game.moves({ verbose: true }) as any[];
  if (!root.length) return { move: null, score: evaluate(game) };

  let bestMove: EngineMove | null = null;
  let bestScore = -Infinity;
  let ordered = root.slice();
  for (let d = 1; d <= Math.max(1, depth); d++) {
    let curBest: EngineMove | null = null;
    let curScore = -Infinity;
    const scored: { m: any; s: number }[] = [];
    for (const m of ordered) {
      game.move(m);
      const s = -negamax(game, d - 1, -Infinity, Infinity, turn === "w" ? -1 : 1, 1);
      game.undo();
      scored.push({ m, s });
      if (s > curScore) {
        curScore = s;
        curBest = { from: m.from, to: m.to, promotion: m.promotion, san: m.san };
      }
    }
    scored.sort((a, b) => b.s - a.s);
    ordered = scored.map(x => x.m);
    bestMove = curBest;
    bestScore = curScore;
  }
  const whitePOV = turn === "w" ? bestScore : -bestScore;
  return { move: bestMove, score: whitePOV };
}

/** Principal variation: best move sequence up to `plies` deep. */
export function getBestLine(game: Chess, plies = 4, searchDepth = 3): EngineMove[] {
  const line: EngineMove[] = [];
  const g = new Chess(game.fen());
  for (let i = 0; i < plies; i++) {
    if (g.isGameOver()) break;
    const { move } = findBestMove(g, searchDepth);
    if (!move) break;
    try { g.move({ from: move.from, to: move.to, promotion: move.promotion ?? "q" }); }
    catch { break; }
    line.push(move);
  }
  return line;
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

  const cfg = (() => {
    if (elo <= 100)  return { depth: 1, blunder: 0.80, topN: 1 };
    if (elo <= 200)  return { depth: 1, blunder: 0.55, topN: 2 };
    if (elo <= 300)  return { depth: 2, blunder: 0.35, topN: 3 };
    if (elo <= 400)  return { depth: 2, blunder: 0.22, topN: 3 };
    if (elo <= 500)  return { depth: 3, blunder: 0.12, topN: 2 };
    if (elo <= 600)  return { depth: 3, blunder: 0.08, topN: 2 };
    if (elo <= 800)  return { depth: 4, blunder: 0.04, topN: 2 };
    if (elo <= 1000) return { depth: 4, blunder: 0.0,  topN: 2 };
    if (elo <= 1200) return { depth: 5, blunder: 0.0,  topN: 2 };
    if (elo <= 1400) return { depth: 5, blunder: 0.0,  topN: 1 };
    if (elo <= 1600) return { depth: 6, blunder: 0.0,  topN: 1 };
    if (elo <= 1800) return { depth: 6, blunder: 0.0,  topN: 1 };
    return { depth: 7, blunder: 0.0, topN: 1 };
  })();

  if (cfg.blunder > 0 && Math.random() < cfg.blunder) {
    const m = moves[Math.floor(Math.random() * moves.length)];
    return { from: m.from, to: m.to, promotion: m.promotion };
  }

  const turn = game.turn();
  let ordered = moves.slice();
  let final: { m: any; s: number }[] = [];
  for (let d = 1; d <= cfg.depth; d++) {
    const scored: { m: any; s: number }[] = [];
    for (const m of ordered) {
      game.move(m);
      const s = -negamax(game, d - 1, -Infinity, Infinity, turn === "w" ? -1 : 1, 1);
      game.undo();
      scored.push({ m, s });
    }
    scored.sort((a, b) => b.s - a.s);
    ordered = scored.map(x => x.m);
    final = scored;
  }
  const pool = final.slice(0, Math.max(1, cfg.topN));
  const pick = pool[Math.floor(Math.random() * pool.length)].m;
  return { from: pick.from, to: pick.to, promotion: pick.promotion };
}
