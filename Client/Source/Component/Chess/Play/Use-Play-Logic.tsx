import { useState, useEffect, useCallback, type RefObject } from "react";
import { Chess } from "chess.js";
import { findBestMove } from "@/Library/chessEngine";
import { isPremoveLegal } from "@/Component/Chess/Play/ChessboardFEN";
import { ENGINE_REPLY_DELAY_MS } from "@/Component/Chess/Play/EngineCache";
import type { PlayState } from "@/Component/Chess/Play/Types";
import type { GameConfig } from "@/Component/Chess/ChessSetupPanel";

interface UsePlayLogicProps {
  cfg: GameConfig | null;
  stateRef: RefObject<PlayState | null>;
  viewIndex: number;
  varCursor: any;
  selected: string | null;
  setSelected: (sq: string | null) => void;
  setViewIndex: (index: number) => void;
  setHintArrow: (arrow: { from: string; to: string } | null) => void;
  setNoAnimateOnce: (val: boolean) => void;
  setVarCursorExternal: (cursor: any) => void;
  tryVariationMove: (from: string, to: string, viaDrag?: boolean) => boolean;
  computeVariationView: () => any;
  recordMainlineMove: (mv: any) => void;
  queuePremove: (from: string, to: string, viaDrag?: boolean) => void;
  runEngineRef: RefObject<() => void>;
  projectedBoard: Chess | null;
  force: (cb: (n: number) => number) => void;
}

export function usePlayLogic({
  cfg,
  stateRef,
  viewIndex,
  varCursor,
  selected,
  setSelected,
  setViewIndex,
  setHintArrow,
  setNoAnimateOnce,
  setVarCursorExternal,
  tryVariationMove,
  computeVariationView,
  recordMainlineMove,
  queuePremove,
  runEngineRef,
  projectedBoard,
  force,
}: UsePlayLogicProps) {
  // ── 1. Viewport-Based Board Sizing ────────────────────────────────────────
  const [maxBoardSize, setMaxBoardSize] = useState<number>(500);

  const calculateSize = useCallback(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    if (vw >= 960) {
      const headerOffset = 64;
      const padding = 32;
      const sidebarWidth = vw >= 1280 ? 384 : vw >= 1024 ? 320 : 288;

      const availableHeight = vh - headerOffset - padding;
      const availableWidth = vw - sidebarWidth - padding;

      const target = Math.max(240, Math.min(availableHeight, availableWidth));
      setMaxBoardSize(target);
    } else {
      setMaxBoardSize(Math.max(200, vw - 32));
    }
  }, []);

  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;

      calculateSize();
      window.addEventListener("resize", calculateSize);

      return () => {
        window.removeEventListener("resize", calculateSize);
      };
    },
    [calculateSize]
  );

  useEffect(() => {
    calculateSize();
  }, [calculateSize, cfg]);

  // ── 2. Keyboard Navigation Controls ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (varCursor) {
          if (varCursor.step > 0) {
            setVarCursorExternal({ ...varCursor, step: varCursor.step - 1 });
          } else {
            setVarCursorExternal(null);
            setViewIndex(s.variations[varCursor.varIndex].parentIndex);
          }
          setNoAnimateOnce(true);
          return;
        }
        const current = viewIndex === -1 ? s.sans.length - 1 : viewIndex - 1;
        if (current >= -1) {
          setNoAnimateOnce(true);
          setViewIndex(current);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (varCursor) {
          const v = s.variations[varCursor.varIndex];
          if (varCursor.step + 1 < v.sans.length) {
            setVarCursorExternal({ ...varCursor, step: varCursor.step + 1 });
            setNoAnimateOnce(true);
          }
          return;
        }
        if (viewIndex === -1) return;
        const next = viewIndex + 1;
        setNoAnimateOnce(true);
        setViewIndex(next >= s.sans.length - 1 ? -1 : next);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewIndex, varCursor, stateRef, setVarCursorExternal, setViewIndex, setNoAnimateOnce]);

  // ── 3. Move Logic & View Helpers ──────────────────────────────────────────
  const computeView = useCallback(() => {
    const s = stateRef.current!;
    const varView = computeVariationView();
    if (varView) return varView;
    if (viewIndex === -1) {
      return {
        fen: s.game.fen(),
        lastMove: s.lastMoves.length ? s.lastMoves[s.lastMoves.length - 1] : null,
      };
    }
    return {
      fen: s.fenHistory[viewIndex + 1],
      lastMove: viewIndex >= 0 ? s.lastMoves[viewIndex] : null,
    };
  }, [stateRef, computeVariationView, viewIndex]);

  const onMove = useCallback(
    (from: string, to: string, viaDrag = false) => {
      const s = stateRef.current;
      if (!s) return;
      const live = viewIndex === -1 && varCursor == null;
      if (!live) {
        tryVariationMove(from, to, viaDrag);
        return;
      }
      if (s.game.isGameOver()) return;
      if (s.game.turn() !== s.playerColor) {
        queuePremove(from, to, viaDrag);
        return;
      }
      try {
        const mv = s.game.move({ from, to, promotion: "q" });
        if (!mv) return;
        recordMainlineMove(mv);
        setSelected(null);
        setHintArrow(null);
        if (viaDrag) setNoAnimateOnce(true);
        force((n) => n + 1);
        if (!s.game.isGameOver() && s.cfg.engine) {
          setTimeout(() => runEngineRef.current?.(), ENGINE_REPLY_DELAY_MS);
        }
      } catch {
        /* illegal move */
      }
    },
    [
      stateRef,
      viewIndex,
      varCursor,
      tryVariationMove,
      queuePremove,
      recordMainlineMove,
      setSelected,
      setHintArrow,
      setNoAnimateOnce,
      force,
      runEngineRef,
    ]
  );

  const handleSquare = useCallback(
    (sq: string) => {
      const s = stateRef.current;
      if (!s) return;
      const live = viewIndex === -1 && varCursor == null;
      const viewing = !live;

      if (viewing) {
        const viewData = computeView();
        let g: Chess;
        try {
          g = new Chess(viewData.fen);
        } catch {
          return;
        }
        const piece = g.get(sq as any);
        const currentTurn = g.turn();

        if (selected) {
          if (sq === selected) {
            setSelected(null);
            return;
          }
          const moves = g.moves({ square: selected as any, verbose: true }) as any[];
          if (moves.some((m) => m.to === sq)) {
            setNoAnimateOnce(true);
            tryVariationMove(selected, sq, false);
            return;
          }
          if (piece && piece.color === currentTurn) {
            setSelected(sq);
          } else {
            setSelected(null);
          }
          return;
        }

        if (piece && piece.color === currentTurn) {
          setSelected(sq);
        }
        return;
      }

      if (s.game.isGameOver()) return;
      const myTurn = s.game.turn() === s.playerColor;
      const proj = myTurn ? null : projectedBoard;
      const piece = myTurn ? s.game.get(sq as any) : proj?.get(sq as any);

      if (selected) {
        if (sq === selected) {
          setSelected(null);
          return;
        }
        if (myTurn) {
          const moves = s.game.moves({ square: selected as any, verbose: true }) as any[];
          if (moves.some((m) => m.to === sq)) {
            onMove(selected, sq, false);
            return;
          }
          if (piece && piece.color === s.playerColor) setSelected(sq);
          else setSelected(null);
          return;
        }
        const own = proj?.get(selected as any);
        if (own && own.color === s.playerColor && sq !== selected) {
          let legalPremove = false;
          if (proj) {
            legalPremove = isPremoveLegal(proj.fen(), selected, sq, s.playerColor);
          }
          if (legalPremove) {
            queuePremove(selected, sq);
            return;
          }
          if (piece && piece.color === s.playerColor) {
            setSelected(sq);
            return;
          }
        }
        setSelected(null);
        return;
      }

      if (piece && piece.color === s.playerColor) {
        setSelected(sq);
      }
    },
    [
      stateRef,
      viewIndex,
      varCursor,
      computeView,
      selected,
      setSelected,
      setNoAnimateOnce,
      tryVariationMove,
      projectedBoard,
      onMove,
      queuePremove,
    ]
  );

  const clearSelection = useCallback(() => setSelected(null), [setSelected]);

  const showHint = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.game.isGameOver() || s.game.turn() !== s.playerColor) return;
    const best = findBestMove(s.game, 2).move;
    if (best) setHintArrow({ from: best.from, to: best.to });
  }, [stateRef, setHintArrow]);

  return {
    setContainerRef,
    maxBoardSize,
    computeView,
    onMove,
    handleSquare,
    clearSelection,
    showHint,
  };
}