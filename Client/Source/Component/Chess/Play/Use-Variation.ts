import { useCallback, useState } from "react";
import { Chess } from "chess.js";
import type { MoveVariation, VariationCursor } from "./MovesList";
import type { PlayState, VariationData } from "./types";

interface UseVariationsArgs {
  stateRef: React.MutableRefObject<PlayState | null>;
  /** Current mainline viewing index (-1 = live), needed when branching off the mainline. */
  viewIndex: number;
  force: React.Dispatch<React.SetStateAction<number>>;
  setSelected: (sq: string | null) => void;
  setHintArrow: (a: { from: string; to: string } | null) => void;
  setNoAnimateOnce: (v: boolean) => void;
  playMoveSound: (kind: "move" | "capture") => void;
}

/**
 * Owns variation ("sideline") state while reviewing a finished/in-progress
 * game: creating a new variation off the mainline or an existing one,
 * extending or truncating a variation as the person tries new moves, and
 * tracking which variation/step is currently being viewed.
 */
export function useVariations({
  stateRef,
  viewIndex,
  force,
  setSelected,
  setHintArrow,
  setNoAnimateOnce,
  playMoveSound,
}: UseVariationsArgs) {
  const [varCursor, setVarCursor] = useState<VariationCursor | null>(null);

  // Try to make a move during review (creates / extends a variation).
  const tryVariationMove = useCallback((from: string, to: string, viaDrag = false): boolean => {
    const s = stateRef.current;
    if (!s) return false;

    // Determine base FEN and current variation context.
    let baseFen: string;
    let parentIndex: number;
    if (varCursor) {
      const v = s.variations[varCursor.varIndex];
      baseFen = v.fens[varCursor.step + 1];
      parentIndex = v.parentIndex;
    } else {
      // Mainline review at viewIndex.
      baseFen = s.fenHistory[viewIndex + 1];
      parentIndex = viewIndex;
    }

    let g: Chess;
    try { g = new Chess(baseFen); } catch { return false; }
    let mv: any;
    try { mv = g.move({ from, to, promotion: "q" }); } catch { return false; }
    if (!mv) return false;

    if (varCursor) {
      const v = s.variations[varCursor.varIndex];
      // If next step already matches, just advance.
      const existingNext = v.sans[varCursor.step + 1];
      if (existingNext === mv.san) {
        setVarCursor({ varIndex: varCursor.varIndex, step: varCursor.step + 1 });
      } else {
        // Truncate variation past current step and append.
        v.sans = v.sans.slice(0, varCursor.step + 1);
        v.fens = v.fens.slice(0, varCursor.step + 2);
        v.lastMoves = v.lastMoves.slice(0, varCursor.step + 1);
        v.sans.push(mv.san);
        v.fens.push(g.fen());
        v.lastMoves.push({ from: mv.from, to: mv.to });
        setVarCursor({ varIndex: varCursor.varIndex, step: v.sans.length - 1 });
      }
    } else {
      // Mainline branch: check if a variation already exists at this parent with same first san.
      const existing = s.variations.findIndex(
        v => v.parentIndex === parentIndex && v.sans[0] === mv.san
      );
      if (existing >= 0) {
        setVarCursor({ varIndex: existing, step: 0 });
      } else {
        const v: VariationData = {
          parentIndex,
          sans: [mv.san],
          fens: [baseFen, g.fen()],
          lastMoves: [{ from: mv.from, to: mv.to }],
        };
        s.variations.push(v);
        setVarCursor({ varIndex: s.variations.length - 1, step: 0 });
      }
    }
    playMoveSound(mv.captured ? "capture" : "move");
    setSelected(null);
    setHintArrow(null);
    if (viaDrag) setNoAnimateOnce(true);
    force(n => n + 1);
    return true;
  }, [stateRef, varCursor, viewIndex, force, setSelected, setHintArrow, setNoAnimateOnce, playMoveSound]);

  /** Variation-specific slice of the "what position is being viewed" computation. */
  const computeVariationView = useCallback((): { fen: string; lastMove: { from: string; to: string } | null } | null => {
    const s = stateRef.current;
    if (!s || !varCursor) return null;
    const v = s.variations[varCursor.varIndex];
    return { fen: v.fens[varCursor.step + 1], lastMove: v.lastMoves[varCursor.step] };
  }, [stateRef, varCursor]);

  return {
    varCursor,
    setVarCursor,
    tryVariationMove,
    computeVariationView,
  };
}

export type { MoveVariation, VariationCursor };