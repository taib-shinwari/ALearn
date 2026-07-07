import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { type I18nLang } from "./Language.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Types retain structure alignment
export type PieceType  = "K" | "Q" | "R" | "B" | "N" | "P";
export type PieceColor = "w" | "b";
export interface PlacedPiece { square: string; color: PieceColor; type: PieceType; id?: string; themed?: boolean; hidden?: boolean; }
export interface Arrow { from: string; to: string; color?: string; }
export interface ChessLesson { id: string; name: Record<I18nLang, string>; steps: any[]; }
export interface ChessGroup { id: string; name: Record<I18nLang, string>; lessons: ChessLesson[]; }
export interface ChessLevel { id: string; name: Record<I18nLang, string>; groups: ChessGroup[]; }

const FILES = "abcdefgh";
function fileOf(sq: string) { return FILES.indexOf(sq[0]); }
function rankOf(sq: string) { return parseInt(sq[1], 10) - 1; }

function formatNameFromId(id: string): Record<I18nLang, string> {
  const clean = id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return { Dutch: clean, English: clean, Arabic: clean };
}

// ─── Native File Corpus Engine ───
function getChessCorpus() {
  const fp = path.join(__dirname, '../../Asset/Corpus/Chess.json');
  if (!fs.existsSync(fp)) {
    throw new Error("Chess database corpus file not found. Run compiler script.");
  }
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

export function isLegalMove(type: PieceType, from: string, to: string, wouldCapture = false): boolean {
  if (from === to) return false;
  const df = Math.abs(fileOf(to) - fileOf(from));
  const dr = Math.abs(rankOf(to) - rankOf(from));
  const rf = rankOf(from), rt = rankOf(to);

  switch (type) {
    case "K": return df <= 1 && dr <= 1;
    case "Q": return df === 0 || dr === 0 || df === dr;
    case "R": return df === 0 || dr === 0;
    case "B": return df === dr;
    case "N": return (df === 1 && dr === 2) || (df === 2 && dr === 1);
    case "P": {
      const dir = 1;
      const rankDiff = rt - rf;
      if (wouldCapture) return df === 1 && rankDiff === dir;
      if (df !== 0) return false;
      if (rankDiff === dir) return true;
      if (rankDiff === 2 * dir && rf === 1) return true;
      return false;
    }
    default: return false;
  }
}

// Get levels out of pre-computed database slice
export function getChessLevels(): ChessLevel[] {
  const corpus = getChessCorpus();
  const LEVEL_ORDER = ["beginner", "intermediate", "advanced"];
  const out: ChessLevel[] = [];

  LEVEL_ORDER.forEach(lvlId => {
    const categories = corpus.lessons[lvlId];
    if (!categories) return;

    const groups: ChessGroup[] = Object.keys(categories).map(subcatId => {
      const lessons: ChessLesson[] = categories[subcatId].map((l: any) => ({
        id: l.id,
        name: formatNameFromId(l.id),
        steps: l.steps
      }));
      return { id: subcatId, name: formatNameFromId(subcatId), lessons };
    });

    if (groups.length > 0) {
      out.push({ id: lvlId, name: formatNameFromId(lvlId), groups });
    }
  });

  return out;
}

// Extract a targeted chess level block directly out of the memory cache
export function getChessLevel(id: string): ChessLevel | null {
  return getChessLevels().find(l => l.id === id.toLowerCase()) ?? null;
}

export function getAllPuzzles(): string[] {
  return Object.keys(getChessCorpus().puzzles);
}

export function getPuzzleByFen(fen: string): any | null {
  return getChessCorpus().puzzles[fen] ?? null;
}