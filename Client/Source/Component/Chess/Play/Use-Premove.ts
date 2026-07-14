import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { applyPremoveToFen, isPremoveLegal } from "./ChessboardFEN";
import type { PlayState } from "./Types";

export interface Premove {
  from: string;
  to: string;
  promotion?: string;
}

interface UsePremovesArgs {
  stateRef: React.MutableRefObject<PlayState | null>;
  /** Records a move that has actually been played on the live game. */
  recordMainlineMove: (mv: any) => void;
  /** Forces a re-render (bumps the refresh counter). */
  force: React.Dispatch<React.SetStateAction<number>>;
  /** Schedules the engine's reply after our move, if configured. */
  scheduleEngineReply: () => void;
  /** True while a piece is being dragged, to suppress move animation. */
  setNoAnimateOnce: (v: boolean) => void;
}

/**
 * FIFO premove queue, validated against the projected (post-premove) board
 * rather than the live game — this is what lets premoves chain correctly
 * (e.g. queuing a second premove for a piece that only "exists" on its
 * destination square because of an earlier queued premove).
 */
export function usePremoves({
  stateRef,
  recordMainlineMove,
  force,
  scheduleEngineReply,
  setNoAnimateOnce,
}: UsePremovesArgs) {
  const [premoves, setPremoves] = useState<Premove[]>([]);
  const premovesRef = useRef<Premove[]>([]);
  useEffect(() => { premovesRef.current = premoves; }, [premoves]);

  const projectedBoard = useCallback((extra?: Premove) => {
    const st = stateRef.current;
    if (!st) return null;

    let fen = st.game.fen();
    const steps = [...premoves, ...(extra ? [extra] : [])];

    for (const pm of steps) {
      if (!isPremoveLegal(fen, pm.from, pm.to, st.playerColor)) return null;
      const result = applyPremoveToFen(fen, pm.from, pm.to, pm.promotion ?? "q", st.playerColor);
      fen = result.fen;
    }

    try { return new Chess(fen); } catch { return null; }
  }, [premoves, stateRef]);

  const queuePremove = useCallback((from: string, to: string, viaDrag = false) => {
    const s = stateRef.current;
    if (!s) return;
    const projected = projectedBoard();
    if (!projected) return;
    const piece = projected.get(from as any);
    if (!piece || piece.color !== s.playerColor) return;
    if (!isPremoveLegal(projected.fen(), from, to, s.playerColor)) return;
    setPremoves(prev => [...prev, { from, to }]);
    if (viaDrag) setNoAnimateOnce(true);
  }, [stateRef, projectedBoard, setNoAnimateOnce]);

  const cancelPremoves = useCallback(() => setPremoves([]), []);

  const tryPlayPremove = useCallback(() => {
    const s = stateRef.current;
    const queue = premovesRef.current;
    if (!s || queue.length === 0) return;
    if (s.game.isGameOver() || s.game.turn() !== s.playerColor) return;
    const [head, ...rest] = queue;
    try {
      const mv = s.game.move({ from: head.from, to: head.to, promotion: head.promotion ?? "q" });
      if (!mv) { setPremoves([]); return; }
      recordMainlineMove(mv);
      setPremoves(rest);
      setNoAnimateOnce(true);
      force(n => n + 1);
      if (!s.game.isGameOver() && s.cfg.engine) scheduleEngineReply();
    } catch { setPremoves([]); }
  }, [stateRef, recordMainlineMove, setNoAnimateOnce, force, scheduleEngineReply]);

  return {
    premoves,
    premovesRef,
    setPremoves,
    projectedBoard,
    queuePremove,
    cancelPremoves,
    tryPlayPremove,
  };
}