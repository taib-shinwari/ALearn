import { useCallback } from "react";
import { Chess } from "chess.js";
import { PieceTracker } from "../../chessHelpers";
import { random960Fen } from "@/Library/chess960";
import { playMoveSound } from "./Use-Audio";
import type { GameConfig } from "../../ChessSetupPanel";
import type { PerMove } from "../../analysis/classification";
import type { VariationCursor } from "../../MovesList";
import type { PlayState } from "./Types";
import type { Premove } from "./Use-Premove";

interface UseGameActionsArgs {
  stateRef: React.MutableRefObject<PlayState | null>;
  lastTickRef: React.MutableRefObject<number>;
  force: React.Dispatch<React.SetStateAction<number>>;
  setCfg: (cfg: GameConfig | null) => void;
  setSelected: (sq: string | null) => void;
  setViewIndex: (i: number) => void;
  setVarCursor: (c: VariationCursor | null) => void;
  setHintArrow: (a: { from: string; to: string } | null) => void;
  setAnalysisView: (v: "play" | "analysis" | "review") => void;
  setPerMove: (p: PerMove[] | null) => void;
  setNoAnimateOnce: (v: boolean) => void;
  setPremoves: React.Dispatch<React.SetStateAction<Premove[]>>;
  /** Called right after a new game is set up, so the caller can kick off the engine's opening move if the player is Black. */
  onGameStarted: (playerColor: "w" | "b") => void;
}

/**
 * Owns the actions that mutate `PlayState` wholesale or reset UI view state
 * around it: starting a new game, returning to setup, rematching, undoing
 * a move pair, resigning, and recording a move that was actually played on
 * the live game (used by both the player's own moves and the engine's).
 */
export function useGameActions({
  stateRef,
  lastTickRef,
  force,
  setCfg,
  setSelected,
  setViewIndex,
  setVarCursor,
  setHintArrow,
  setAnalysisView,
  setPerMove,
  setNoAnimateOnce,
  setPremoves,
  onGameStarted,
}: UseGameActionsArgs) {
  const recordMainlineMove = useCallback((mv: any) => {
    const s = stateRef.current;
    if (!s) return;
    const now = performance.now();
    const seconds = (now - s.lastMoveAt) / 1000;
    s.lastMoveAt = now;
    s.tracker.applyMove(mv);
    s.sans.push(mv.san);
    s.moveTimes.push(seconds);
    s.fenHistory.push(s.game.fen());
    s.lastMoves.push({ from: mv.from, to: mv.to });
    if (s.cfg.timer.incMs && s.cfg.timer.baseMs > 0) {
      if (mv.color === "w") s.whiteMs += s.cfg.timer.incMs;
      else s.blackMs += s.cfg.timer.incMs;
    }
    playMoveSound(mv.captured ? "capture" : "move");
  }, [stateRef]);

  const startGame = useCallback((gc: GameConfig) => {
    const fen = gc.variant === "960" ? random960Fen() : undefined;
    const game = fen ? new Chess(fen) : new Chess();
    const tracker = new PieceTracker();
    tracker.reset(game);
    const playerColor: "w" | "b" =
      gc.color === "random" ? (Math.random() < 0.5 ? "w" : "b") : gc.color === "white" ? "w" : "b";
    const now = performance.now();
    stateRef.current = {
      game, tracker, playerColor, sans: [], moveTimes: [],
      fenHistory: [game.fen()], lastMoves: [],
      whiteMs: gc.timer.baseMs, blackMs: gc.timer.baseMs, cfg: gc,
      startedAt: now, lastMoveAt: now,
      variations: [],
    };
    lastTickRef.current = now;
    setCfg(gc);
    setSelected(null);
    setViewIndex(-1);
    setVarCursor(null);
    setHintArrow(null);
    setAnalysisView("play");
    setPerMove(null);
    setPremoves([]);
    setNoAnimateOnce(true);
    force(n => n + 1);
    onGameStarted(playerColor);
  }, [stateRef, lastTickRef, force, setCfg, setSelected, setViewIndex, setVarCursor, setHintArrow, setAnalysisView, setPerMove, setPremoves, setNoAnimateOnce, onGameStarted]);

  const resetToSetup = useCallback(() => {
    stateRef.current = null;
    setCfg(null);
    setSelected(null);
    setViewIndex(-1);
    setVarCursor(null);
    setHintArrow(null);
    setAnalysisView("play");
    setPerMove(null);
    setPremoves([]);
  }, [stateRef, setCfg, setSelected, setViewIndex, setVarCursor, setHintArrow, setAnalysisView, setPerMove, setPremoves]);

  const rematch = useCallback(() => {
    const s = stateRef.current;
    if (s) startGame(s.cfg);
  }, [stateRef, startGame]);

  const undoMove = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.sans.length === 0) return;
    const target = s.game.turn() === s.playerColor ? 2 : 1;
    for (let i = 0; i < target && s.sans.length > 0; i++) {
      s.game.undo();
      s.sans.pop();
      s.moveTimes.pop();
      s.fenHistory.pop();
      s.lastMoves.pop();
    }
    const t = new PieceTracker();
    t.reset(s.game);
    s.tracker = t;
    setSelected(null);
    setHintArrow(null);
    setNoAnimateOnce(true);
    force(n => n + 1);
  }, [stateRef, setSelected, setHintArrow, setNoAnimateOnce, force]);

  const resign = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.game.isGameOver()) return;
    s.resigned = true;
    force(n => n + 1);
  }, [stateRef, force]);

  return {
    recordMainlineMove,
    startGame,
    resetToSetup,
    rematch,
    undoMove,
    resign,
  };
}