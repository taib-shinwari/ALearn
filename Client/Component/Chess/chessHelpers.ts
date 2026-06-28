// Helpers shared by Play + Puzzle views.
import type { Chess } from "chess.js";
import type { PlacedPiece, PieceType } from "Server/API/Chess";

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

/**
 * Stable piece tracker — maintains a unique id per piece across moves so the
 * Chessboard can animate movement instead of remounting/re-sorting.
 */
export class PieceTracker {
  private ids = new Map<string, string>(); // square -> id
  private nextId = 1;

  reset(game: Chess) {
    this.ids.clear();
    this.nextId = 1;
    const pieces = fenToPieces(game);
    for (const p of pieces) this.ids.set(p.square, `p${this.nextId++}`);
  }

  /** Apply a move (from chess.js verbose move) to keep ids aligned. */
  applyMove(m: { from: string; to: string; flags?: string; san?: string; piece?: string; color?: string }) {
    // Capture: id at `to` (or en-passant capture square) is removed.
    if (m.flags?.includes("e")) {
      // en passant: captured pawn is on `to` file, `from` rank
      const capSq = m.to[0] + m.from[1];
      this.ids.delete(capSq);
    } else if (m.flags?.includes("c")) {
      this.ids.delete(m.to);
    }
    const id = this.ids.get(m.from);
    this.ids.delete(m.from);
    if (id) this.ids.set(m.to, id);
    // Castling: rook also moves.
    if (m.flags?.includes("k")) {
      // king-side rook
      const rank = m.from[1];
      const rookFrom = `h${rank}`, rookTo = `f${rank}`;
      const rid = this.ids.get(rookFrom);
      this.ids.delete(rookFrom);
      if (rid) this.ids.set(rookTo, rid);
    } else if (m.flags?.includes("q")) {
      const rank = m.from[1];
      const rookFrom = `a${rank}`, rookTo = `d${rank}`;
      const rid = this.ids.get(rookFrom);
      this.ids.delete(rookFrom);
      if (rid) this.ids.set(rookTo, rid);
    }
  }

  /** Build PlacedPiece[] with stable ids from current game state. */
  withIds(game: Chess): PlacedPiece[] {
    const pieces = fenToPieces(game);
    // Any squares that lack an id (e.g. from a custom start) get fresh ones.
    for (const p of pieces) {
      if (!this.ids.has(p.square)) this.ids.set(p.square, `p${this.nextId++}`);
    }
    return pieces.map(p => ({ ...p, id: this.ids.get(p.square) }));
  }
}

/** Legacy greedy bot — kept for puzzles. */
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