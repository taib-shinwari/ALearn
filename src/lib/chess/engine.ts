// Minimal hand-rolled chess engine. Supports:
//  - FEN parse/serialize (board + side-to-move only — castling/ep ignored)
//  - Legal move generation for all pieces (with check filtering)
//  - Check / checkmate detection
//  - Promotion to queen
//
// Designed for our lessons (free single-piece movement) and the puzzle pages.

export type Color = "w" | "b";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export interface Piece { color: Color; type: PieceType }
export type Square = string; // "a1" .. "h8"
export interface Move { from: Square; to: Square; promotion?: PieceType; capture?: boolean }

const FILES = ["a","b","c","d","e","f","g","h"];

export function sqToIdx(sq: Square): number {
  const file = FILES.indexOf(sq[0]);
  const rank = parseInt(sq[1], 10) - 1;
  if (file < 0 || rank < 0 || rank > 7) return -1;
  return rank * 8 + file;
}
export function idxToSq(idx: number): Square {
  const file = idx % 8;
  const rank = Math.floor(idx / 8);
  return FILES[file] + (rank + 1);
}

export interface Position {
  board: (Piece | null)[]; // 64, index 0 = a1
  turn: Color;
}

export function parseFen(fen: string): Position {
  const [placement, turn = "w"] = fen.split(/\s+/);
  const board: (Piece | null)[] = Array(64).fill(null);
  const ranks = placement.split("/");
  ranks.forEach((row, i) => {
    const rank = 7 - i; // FEN starts at rank 8
    let file = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { file += parseInt(ch, 10); continue; }
      const color: Color = ch === ch.toUpperCase() ? "w" : "b";
      const type = ch.toLowerCase() as PieceType;
      board[rank * 8 + file] = { color, type };
      file++;
    }
  });
  return { board, turn: turn === "b" ? "b" : "w" };
}

export function serializeFen(pos: Position): string {
  const rows: string[] = [];
  for (let r = 7; r >= 0; r--) {
    let row = ""; let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = pos.board[r * 8 + f];
      if (!p) { empty++; continue; }
      if (empty) { row += empty; empty = 0; }
      const ch = p.type;
      row += p.color === "w" ? ch.toUpperCase() : ch;
    }
    if (empty) row += empty;
    rows.push(row);
  }
  return `${rows.join("/")} ${pos.turn} - - 0 1`;
}

function inBoard(f: number, r: number) { return f >= 0 && f < 8 && r >= 0 && r < 8; }
function at(pos: Position, f: number, r: number) {
  if (!inBoard(f, r)) return undefined;
  return pos.board[r * 8 + f];
}

const SLIDERS: Record<PieceType, [number, number][]> = {
  r: [[1,0],[-1,0],[0,1],[0,-1]],
  b: [[1,1],[1,-1],[-1,1],[-1,-1]],
  q: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],
  n: [], p: [], k: [],
};

function pseudoMovesFrom(pos: Position, idx: number): Move[] {
  const p = pos.board[idx];
  if (!p) return [];
  const out: Move[] = [];
  const f = idx % 8, r = Math.floor(idx / 8);
  const from = idxToSq(idx);

  const add = (tf: number, tr: number, capture = false, promo = false) => {
    if (!inBoard(tf, tr)) return;
    const target = pos.board[tr * 8 + tf];
    if (target && target.color === p.color) return;
    const to = idxToSq(tr * 8 + tf);
    if (promo) {
      out.push({ from, to, promotion: "q", capture: !!target });
    } else {
      out.push({ from, to, capture: !!target });
    }
  };

  if (p.type === "p") {
    const dir = p.color === "w" ? 1 : -1;
    const startRank = p.color === "w" ? 1 : 6;
    const promoRank = p.color === "w" ? 7 : 0;
    // forward
    if (inBoard(f, r + dir) && !at(pos, f, r + dir)) {
      add(f, r + dir, false, r + dir === promoRank);
      if (r === startRank && !at(pos, f, r + 2 * dir)) add(f, r + 2 * dir);
    }
    // captures
    for (const df of [-1, 1]) {
      const tf = f + df, tr = r + dir;
      const target = at(pos, tf, tr);
      if (target && target.color !== p.color) add(tf, tr, true, tr === promoRank);
    }
  } else if (p.type === "n") {
    for (const [df, dr] of [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]]) {
      add(f + df, r + dr);
    }
  } else if (p.type === "k") {
    for (let df = -1; df <= 1; df++)
      for (let dr = -1; dr <= 1; dr++) {
        if (df === 0 && dr === 0) continue;
        add(f + df, r + dr);
      }
  } else {
    for (const [df, dr] of SLIDERS[p.type]) {
      let tf = f + df, tr = r + dr;
      while (inBoard(tf, tr)) {
        const target = pos.board[tr * 8 + tf];
        if (!target) { add(tf, tr); }
        else { if (target.color !== p.color) add(tf, tr, true); break; }
        tf += df; tr += dr;
      }
    }
  }
  return out;
}

export function makeMove(pos: Position, move: Move): Position {
  const next: Position = { board: pos.board.slice(), turn: pos.turn === "w" ? "b" : "w" };
  const fromIdx = sqToIdx(move.from);
  const toIdx = sqToIdx(move.to);
  const p = next.board[fromIdx];
  if (!p) return next;
  next.board[toIdx] = move.promotion ? { color: p.color, type: move.promotion } : p;
  next.board[fromIdx] = null;
  return next;
}

function kingSquare(pos: Position, color: Color): number {
  return pos.board.findIndex(p => p && p.color === color && p.type === "k");
}

function squareAttackedBy(pos: Position, sqIdx: number, by: Color): boolean {
  for (let i = 0; i < 64; i++) {
    const p = pos.board[i];
    if (!p || p.color !== by) continue;
    const moves = pseudoMovesFrom(pos, i);
    if (moves.some(m => sqToIdx(m.to) === sqIdx)) return true;
  }
  return false;
}

export function isInCheck(pos: Position, color: Color = pos.turn): boolean {
  const k = kingSquare(pos, color);
  if (k < 0) return false;
  return squareAttackedBy(pos, k, color === "w" ? "b" : "w");
}

export function legalMovesFrom(pos: Position, sq: Square): Move[] {
  const idx = sqToIdx(sq);
  const p = pos.board[idx];
  if (!p || p.color !== pos.turn) return [];
  const pseudo = pseudoMovesFrom(pos, idx);
  return pseudo.filter(m => {
    const after = makeMove(pos, m);
    return !isInCheck(after, p.color);
  });
}

export function allLegalMoves(pos: Position): Move[] {
  const out: Move[] = [];
  for (let i = 0; i < 64; i++) {
    const p = pos.board[i];
    if (!p || p.color !== pos.turn) continue;
    out.push(...legalMovesFrom(pos, idxToSq(i)));
  }
  return out;
}

export function isCheckmate(pos: Position): boolean {
  return isInCheck(pos) && allLegalMoves(pos).length === 0;
}

export const UNICODE: Record<Color, Record<PieceType, string>> = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};
