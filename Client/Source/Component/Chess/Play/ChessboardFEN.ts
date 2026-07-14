// ────────────────────────────────────────────────────────────────────────
// Pure FEN / board utilities.
//
// These functions have no React or chess.js dependency (aside from the
// FEN string format itself) and are used to project premove queues onto
// a hypothetical board position without needing a fully legal chess.js
// position at every intermediate step (e.g. "captured" kings that
// chess.js would otherwise refuse to load).
// ────────────────────────────────────────────────────────────────────────

export type Board = (null | { type: string; color: "w" | "b" })[][]; // [rank0..7][file0..7], rank0 = rank "1"

export function sqToRC(sq: string) {
  return { file: sq.charCodeAt(0) - 97, rank: parseInt(sq[1], 10) - 1 };
}

export function boardFromFen(fen: string): Board {
  const placement = fen.split(" ")[0];
  const rows = placement.split("/"); // rows[0] = rank 8 ... rows[7] = rank 1
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  rows.forEach((row, rIdx) => {
    const rank = 7 - rIdx; // rank index 0..7 for ranks 1..8
    let file = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { file += parseInt(ch, 10); continue; }
      const color = ch === ch.toUpperCase() ? "w" : "b";
      board[rank][file] = { type: ch.toLowerCase(), color };
      file++;
    }
  });
  return board;
}

export function pathClear(board: Board, fFile: number, fRank: number, tFile: number, tRank: number): boolean {
  const dFile = Math.sign(tFile - fFile);
  const dRank = Math.sign(tRank - fRank);
  let file = fFile + dFile, rank = fRank + dRank;
  while (file !== tFile || rank !== tRank) {
    if (board[rank][file]) return false;
    file += dFile; rank += dRank;
  }
  return true;
}

/**
 * Apply a (possibly speculative) premove to a FEN, returning the resulting
 * FEN plus, if a king was "captured", the square it was parked on.
 *
 * King capture: chess.js requires exactly one king per side to even load
 * the FEN, so we can't simply delete it. Park it on the first empty
 * square instead — invisible to the renderer, but keeps the position
 * loadable so chess.js can keep generating moves for chained premoves.
 */
export function applyPremoveToFen(
  fen: string, from: string, to: string, promotion: string, playerColor: "w" | "b",
): { fen: string; hiddenKingSquare: string | null } {
  const parts = fen.split(" ");
  const board = boardFromFen(fen);
  const { file: fFile, rank: fRank } = sqToRC(from);
  const { file: tFile, rank: tRank } = sqToRC(to);
  const piece = board[fRank][fFile]!;
  const captured = board[tRank][tFile];

  let hiddenKingSquare: string | null = null;

  // En passant: captured pawn sits beside the destination, not on it.
  if (piece.type === "p" && fFile !== tFile && !captured) {
    board[fRank][tFile] = null;
  }

  if (captured?.type === "k") {
    outer:
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        if (r === tRank && f === tFile) continue;
        if (board[r][f]) continue;
        board[r][f] = captured;
        hiddenKingSquare = `${"abcdefgh"[f]}${r + 1}`;
        break outer;
      }
    }
  }

  board[fRank][fFile] = null;
  board[tRank][tFile] = piece.type === "p" && (tRank === 0 || tRank === 7)
    ? { type: promotion, color: piece.color }
    : piece;

  if (piece.type === "k" && Math.abs(tFile - fFile) === 2) {
    const kingside = tFile > fFile;
    const rookFromFile = kingside ? 7 : 0;
    const rookToFile = kingside ? tFile - 1 : tFile + 1;
    board[tRank][rookToFile] = board[tRank][rookFromFile];
    board[tRank][rookFromFile] = null;
  }

  const placement = Array.from({ length: 8 }, (_, rIdx) => {
    const rank = 7 - rIdx;
    let row = "", empty = 0;
    for (let file = 0; file < 8; file++) {
      const p = board[rank][file];
      if (!p) { empty++; continue; }
      if (empty) { row += empty; empty = 0; }
      row += p.color === "w" ? p.type.toUpperCase() : p.type.toLowerCase();
    }
    if (empty) row += empty;
    return row;
  }).join("/");

  parts[0] = placement;
  parts[1] = playerColor === "w" ? "b" : "w";
  parts[3] = "-";
  return { fen: parts.join(" "), hiddenKingSquare };
}

/**
 * Geometric legality check for a premove, pulling castling rights / en
 * passant target straight from FEN fields 3 and 4. This deliberately does
 * NOT check for checks (a premove can walk into check — it'll just fail
 * to actually execute once it's really the player's turn).
 */
export function isPremoveLegal(
  boardFen: string,
  from: string,
  to: string,
  playerColor: "w" | "b",
): boolean {
  const [, , castling, epTarget] = boardFen.split(" ");
  const board = boardFromFen(boardFen);
  const { file: fFile, rank: fRank } = sqToRC(from);
  const { file: tFile, rank: tRank } = sqToRC(to);
  if (fFile === tFile && fRank === tRank) return false;

  const piece = board[fRank][fFile];
  if (!piece || piece.color !== playerColor) return false;

  const target = board[tRank][tFile];

  const dFile = tFile - fFile, dRank = tRank - fRank;

  switch (piece.type) {
    case "n":
      return (Math.abs(dFile) === 1 && Math.abs(dRank) === 2) ||
             (Math.abs(dFile) === 2 && Math.abs(dRank) === 1);

    case "b":
      if (Math.abs(dFile) !== Math.abs(dRank)) return false;
      return pathClear(board, fFile, fRank, tFile, tRank);

    case "r":
      if (dFile !== 0 && dRank !== 0) return false;
      return pathClear(board, fFile, fRank, tFile, tRank);

    case "q":
      if (dFile !== 0 && dRank !== 0 && Math.abs(dFile) !== Math.abs(dRank)) return false;
      return pathClear(board, fFile, fRank, tFile, tRank);

    case "k": {
      if (Math.abs(dFile) <= 1 && Math.abs(dRank) <= 1) return true;
      // Castling: king moves two squares along its home rank.
      if (Math.abs(dFile) === 2 && dRank === 0) {
        const homeRank = playerColor === "w" ? 0 : 7;
        if (fRank !== homeRank || tRank !== homeRank) return false;
        const kingside = dFile > 0;
        const rightChar = playerColor === "w"
          ? (kingside ? "K" : "Q")
          : (kingside ? "k" : "q");
        if (!castling.includes(rightChar)) return false;
        const rookFile = kingside ? 7 : 0;
        const rook = board[homeRank][rookFile];
        if (!rook || rook.type !== "r" || rook.color !== playerColor) return false;
        // Squares between king and rook must be empty.
        return pathClear(board, fFile, fRank, rookFile, homeRank);
      }
      return false;
    }

    case "p": {
      const dir = playerColor === "w" ? 1 : -1;
      const startRank = playerColor === "w" ? 1 : 6;
      // Forward move (no capture).
      if (dFile === 0) {
        if (target) return false;
        if (dRank === dir) return true;
        if (dRank === 2 * dir && fRank === startRank) {
          const midRank = fRank + dir;
          return !board[midRank][fFile];
        }
        return false;
      }
      // Diagonal: normal capture, speculative recapture of own piece, or en passant.
      if (Math.abs(dFile) === 1 && dRank === dir) {
        if (target) return true; // any occupant, including a king — geometry only
        // En passant: target square empty, but matches the FEN ep target.
        if (epTarget && epTarget !== "-") {
          return to === epTarget;
        }
        return false;
      }
      return false;
    }

    default:
      return false;
  }
}