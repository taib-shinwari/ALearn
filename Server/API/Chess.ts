// Server/API/Chess.ts
import { type I18nLang } from "Server/API/Language";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PieceType  = "K" | "Q" | "R" | "B" | "N" | "P";
export type PieceColor = "w" | "b";

export interface PlacedPiece {
  square: string;
  color: PieceColor;
  type: PieceType;
  /** Stable id for animation tracking across moves. */
  id?: string;
  /**
   * When true the piece color is driven by the UI theme (dark → white piece,
   * light → black piece) instead of its own `color` field.
   */
  themed?: boolean;
}

export interface Arrow {
  from: string;
  to: string;
  color?: string;
}

// ─── Localized name helper ────────────────────────────────────────────────────

/**
 * Resolves a localized string map to the correct display string.
 * Accepts both the I18nLang union ("Dutch" | "English" | "Arabic") and the
 * legacy short codes ("nl" | "en" | "ar") used in older UI layers.
 */
export function cName(
  name: Record<string, string> | string | undefined,
  lang: string,
): string {
  if (!name) return "";
  if (typeof name === "string") return name;

  // Direct key hit (e.g. "English", "Dutch", "Arabic")
  if (name[lang] !== undefined) return name[lang];

  // Legacy short-code fallback
  const SHORT: Record<string, string> = { nl: "Dutch", en: "English", ar: "Arabic" };
  const full = SHORT[lang];
  if (full && name[full] !== undefined) return name[full];

  // Fallback chain
  return name["English"] ?? name["Dutch"] ?? Object.values(name)[0] ?? "";
}

// ─── Move legality ────────────────────────────────────────────────────────────

const FILES = "abcdefgh";

function fileOf(sq: string) { return FILES.indexOf(sq[0]); }
function rankOf(sq: string) { return parseInt(sq[1], 10) - 1; }

/**
 * Returns true when moving `type` from `from` to `to` is geometrically legal.
 * `wouldCapture` must be set to true when the destination is occupied by an
 * enemy piece (or a star square treated as a capture target) — pawns move
 * differently depending on this.
 */
export function isLegalMove(
  type: PieceType,
  from: string,
  to: string,
  wouldCapture = false,
): boolean {
  if (from === to) return false;
  const df = Math.abs(fileOf(to) - fileOf(from));
  const dr = Math.abs(rankOf(to) - rankOf(from));
  const ff = fileOf(from), rf = rankOf(from);
  const ft = fileOf(to),   rt = rankOf(to);

  switch (type) {
    case "K": return df <= 1 && dr <= 1;
    case "Q": return df === 0 || dr === 0 || df === dr;
    case "R": return df === 0 || dr === 0;
    case "B": return df === dr;
    case "N": return (df === 1 && dr === 2) || (df === 2 && dr === 1);
    case "P": {
      const dir = 1; // always white pawn for lesson pieces
      const rankDiff = rt - rf;
      if (wouldCapture) return df === 1 && rankDiff === dir;
      if (df !== 0) return false;
      if (rankDiff === dir) return true;
      if (rankDiff === 2 * dir && rf === 1) return true; // starting rank push
      return false;
    }
    default: return false;
  }
}

// ─── Reachable squares ────────────────────────────────────────────────────────

/**
 * Returns all squares a piece of `type` on `square` can geometrically reach
 * (ignoring blocking pieces — suitable for lesson/UI highlight purposes).
 */
export function reachableSquares(type: PieceType, square: string): string[] {
  const f = fileOf(square);
  const r = rankOf(square);
  const out: string[] = [];

  const add = (ff: number, rr: number) => {
    if (ff < 0 || ff > 7 || rr < 0 || rr > 7) return;
    out.push(`${FILES[ff]}${rr + 1}`);
  };

  switch (type) {
    case "K":
      for (let df = -1; df <= 1; df++)
        for (let dr = -1; dr <= 1; dr++)
          if (df !== 0 || dr !== 0) add(f + df, r + dr);
      break;

    case "Q":
    case "R":
      for (let i = 0; i < 8; i++) { if (i !== f) add(i, r); }
      for (let i = 0; i < 8; i++) { if (i !== r) add(f, i); }
      if (type === "R") break;
      // fall through for diagonals
      // eslint-disable-next-line no-fallthrough
    case "B":
      for (let d = 1; d < 8; d++) {
        add(f + d, r + d); add(f - d, r + d);
        add(f + d, r - d); add(f - d, r - d);
      }
      break;

    case "N":
      for (const [df, dr] of [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]])
        add(f + df, r + dr);
      break;

    case "P":
      add(f, r + 1);
      if (r === 1) add(f, r + 2);
      add(f - 1, r + 1);
      add(f + 1, r + 1);
      break;
  }

  return out;
}

// ─── Lesson / Puzzle data loading ────────────────────────────────────────────

const allLessonFiles = import.meta.glob('/Server/Data/Chess/Lesson/*/*/*.json', { eager: true });
const allPuzzleFiles = import.meta.glob('/Server/Data/Chess/Puzzle/*.json', { eager: true });

// ─── Lesson structure types ───────────────────────────────────────────────────

export interface ChessLesson {
  id: string;
  name: Record<I18nLang, string>;
  steps: any[];
}

export interface ChessGroup {
  id: string;
  name: Record<I18nLang, string>;
  lessons: ChessLesson[];
}

export interface ChessLevel {
  id: string;
  name: Record<I18nLang, string>;
  groups: ChessGroup[];
}

// ─── Build lesson registry ────────────────────────────────────────────────────

function formatNameFromId(id: string): Record<I18nLang, string> {
  const clean = id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return { Dutch: clean, English: clean, Arabic: clean };
}

const LEVEL_ORDER = ["beginner", "intermediate", "advanced"];
const levelsMap: Record<string, Record<string, ChessGroup>> = {};
LEVEL_ORDER.forEach(id => { levelsMap[id] = {}; });

for (const [filePath, module] of Object.entries(allLessonFiles)) {
  const match = filePath.match(/\/Lesson\/([^/]+)\/([^/]+)\/The-([^/]+)\.json$/i);
  if (!match) continue;

  const categoryId  = match[1].toLowerCase();
  const subcatId    = match[2].toLowerCase();
  const lessonId    = match[3].toLowerCase();
  const stepsData   = (module as { default: any }).default;

  if (!levelsMap[categoryId]) levelsMap[categoryId] = {};

  if (!levelsMap[categoryId][subcatId]) {
    levelsMap[categoryId][subcatId] = {
      id: subcatId,
      name: formatNameFromId(subcatId),
      lessons: [],
    };
  }

  levelsMap[categoryId][subcatId].lessons.push({
    id: lessonId,
    name: formatNameFromId(lessonId),
    steps: Array.isArray(stepsData) ? stepsData : [stepsData],
  });
}

const levelsList: ChessLevel[] = [];
LEVEL_ORDER.forEach(id => {
  const groups = Object.values(levelsMap[id] || {});
  if (groups.length > 0) {
    levelsList.push({ id, name: formatNameFromId(id), groups });
  }
});

// ─── Public lesson / puzzle API ───────────────────────────────────────────────

export function getChessLevels(): ChessLevel[] {
  return levelsList;
}

export function getChessLevel(id: string): ChessLevel | null {
  return levelsList.find(l => l.id === id) ?? null;
}

export function getAllPuzzles(): string[] {
  return Object.keys(allPuzzleFiles).map(
    filePath => filePath.split("/").pop()?.replace(".json", "") ?? "",
  );
}

export function getPuzzleByFen(fen: string): any | null {
  const match = Object.entries(allPuzzleFiles).find(([fp]) => fp.endsWith(`${fen}.json`));
  return match ? (match[1] as { default: any }).default : null;
}