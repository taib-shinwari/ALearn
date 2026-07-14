import { useCallback } from "react";
import { Chess } from "chess.js";
import { pickEngineMove } from "@/Library/chessEngine";
import { sfBestMove } from "@/Library/stockfish";
import type { PlayState } from "./types";
import type { Premove } from "./usePremoves";

interface UseChessEngineArgs {
  stateRef: React.MutableRefObject<PlayState | null>;
  recordMainlineMove: (mv: any) => void;
  force: React.Dispatch<React.SetStateAction<number>>;
  premovesRef: React.MutableRefObject<Premove[]>;
  tryPlayPremove: () => void;
  setPremoves: React.Dispatch<React.SetStateAction<Premove[]>>;
}

/**
 * Owns the "what does the bot play, and how strong is it" logic: maps the
 * configured ELO onto Stockfish skill/UCI_Elo/movetime settings, adds
 * beginner-level randomness below true engine strength, and falls back to
 * a local heuristic (`pickEngineMove`) if Stockfish fails entirely.
 */
export function useChessEngine({
  stateRef,
  recordMainlineMove,
  force,
  premovesRef,
  tryPlayPremove,
  setPremoves,
}: UseChessEngineArgs) {
  const runEngine = useCallback(async () => {
    const s = stateRef.current;
    if (!s || s.game.isGameOver()) return;
    if (s.game.turn() === s.playerColor) return;
    const fenBefore = s.game.fen();
    const elo = s.cfg.elo;
    // Strength mapping: true beginner < 800; Stockfish UCI_Elo only from 1320.
    let sfOpts: { depth?: number; movetimeMs?: number; skill?: number; uciElo?: number };
    let randomChance = 0;
    if (elo <= 400) {
      sfOpts = { skill: 0, movetimeMs: 50, depth: 1 };
      randomChance = elo <= 150 ? 0.55 : elo <= 250 ? 0.35 : 0.18;
    } else if (elo < 800) {
      sfOpts = { skill: Math.max(0, Math.round((elo - 400) / 80)), movetimeMs: 80 };
      randomChance = 0.08;
    } else if (elo < 1320) {
      sfOpts = { skill: Math.round((elo - 800) / 60), movetimeMs: 150 };
    } else {
      sfOpts = { uciElo: Math.min(3190, elo), movetimeMs: Math.min(1500, 200 + (elo - 1320) * 0.6) };
    }
    let from: string | undefined, to: string | undefined, promotion: string | undefined;
    try {
      // Beginner randomness: sometimes play a random legal move.
      if (randomChance > 0 && Math.random() < randomChance) {
        const moves = s.game.moves({ verbose: true }) as Array<{ from: string; to: string; promotion?: string }>;
        if (moves.length) {
          const m = moves[Math.floor(Math.random() * moves.length)];
          from = m.from; to = m.to; promotion = m.promotion;
        }
      }
      if (!from) {
        const { bestMove } = await sfBestMove(fenBefore, sfOpts);
        if (!bestMove) throw new Error("no bestmove");
        from = bestMove.slice(0, 2);
        to = bestMove.slice(2, 4);
        promotion = bestMove.length > 4 ? bestMove[4] : undefined;
      }
    } catch {
      const m = pickEngineMove(s.game, s.cfg.elo);
      if (!m) return;
      from = m.from; to = m.to; promotion = m.promotion;
    }
    // Position may have changed (player undo, new game, etc.) — bail out.
    if (s.game.fen() !== fenBefore) return;
    let mv: any;
    try { mv = s.game.move({ from, to, promotion: promotion ?? "q" }); } catch { return; }
    if (!mv) return;
    recordMainlineMove(mv);
    force(n => n + 1);
    // Attempt to execute queued premove right after engine's response.
    // If it's now illegal, clear the whole queue.
    setTimeout(() => {
      const st = stateRef.current;
      if (!st) return;
      const queue = premovesRef.current;
      if (queue.length === 0) return;
      const head = queue[0];
      try {
        const test = new Chess(st.game.fen());
        const probe = test.move({ from: head.from, to: head.to, promotion: head.promotion ?? "q" });
        if (!probe) { setPremoves([]); return; }
      } catch { setPremoves([]); return; }
      tryPlayPremove();
    }, 30);
  }, [stateRef, recordMainlineMove, force, premovesRef, tryPlayPremove, setPremoves]);

  return { runEngine };
}