// Helpers shared by Play + Puzzle views.
// Converts chess.js board() output into our PlacedPiece[] format.
import type { Chess } from "chess.js";
import type { PlacedPiece, PieceType } from "@/data/chessData";

export function fenToPieces(game: Chess): PlacedPiece[] {
  const out: PlacedPiece[] = [];
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const cell = board[r][f];
      if (!cell) continue;
      const sq = `${String.fromCharCode(97 + f)}${8 - r}`;
      out.push({
        square: sq,
        color: cell.color as "w" | "b",
        type: cell.type.toUpperCase() as PieceType,
      });
    }
  }
  return out;
}

/** Greedy "bot": captures the highest-value piece, else random legal move. */
export function pickBotMove(game: Chess): { from: string; to: string; promotion?: string } | null {
  const moves = game.moves({ verbose: true }) as Array<any>;
  if (moves.length === 0) return null;
  const val: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const scored = moves.map(m => ({ m, s: m.captured ? val[m.captured] || 0 : 0 }));
  scored.sort((a, b) => b.s - a.s);
  const top = scored.filter(x => x.s === scored[0].s);
  const pick = top[Math.floor(Math.random() * top.length)].m;
  return { from: pick.from, to: pick.to, promotion: pick.promotion };
}
