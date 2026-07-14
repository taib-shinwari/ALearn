import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/Component/Chess/Chessboard";
import { Container } from "@/Component/UI/container";
import { ChessSetupPanel, type GameConfig } from "@/Component/Chess/ChessSetupPanel";
import { ChessClock } from "@/Component/Chess/ChessClock";
import { MovesList } from "@/Component/Chess/MovesList";
import { MoveDetailPanel } from "@/Component/Chess/MoveDetailPanel";
import { PieceTracker } from "@/Component/Chess/chessHelpers";
import { findBestMove, findThreat, evaluate } from "@/Library/chessEngine";
import { useChessSettings } from "@/Library/chessSettings";
import { Button } from "@/Component/UI/Button";
import { Flag, Undo2, Lightbulb, Play, RotateCcw, BarChart3 } from "lucide-react";
import { cn } from "@/Library/utils";
import { analyseGame, summarisePlayer, type PerMove } from "../../Component/Chess/analysis/classification";
import { EvalBar } from "@/Component/Chess/Play/Evalbar";
import { playMoveSound } from "@/Component/Chess/Play/Use-Audio";
import { isPremoveLegal, boardFromFen, sqToRC, applyPremoveToFen } from "@/Component/Chess/Play/ChessboardFEN";
import { evalCache, bestCache, threatCache, ENGINE_REPLY_DELAY_MS } from "@/Component/Chess/Play/EngineCache";
import { usePremoves } from "@/Component/Chess/Play/Use-Premove";
import { useChessEngine } from "@/Component/Chess/Play/Use-Chess-Engine";
import { useVariations } from "@/Component/Chess/Play/Use-Variation";
import { useGameActions } from "@/Component/Chess/Play/Use-Game-Action";
import type { PlayState } from "@/Component/Chess/Play/Types";

const AnalysisReport = lazy(() => import("../../Component/Chess/analysis/AnalysisReport").then(m => ({ default: m.AnalysisReport })));

export function ChessPlayView() {
  const [settings] = useChessSettings();
  const [cfg, setCfg] = useState<GameConfig | null>(null);
  const [refreshCounter, force] = useState(0);
  const stateRef = useRef<PlayState | null>(null);
  const lastTickRef = useRef<number>(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [viewIndex, setViewIndex] = useState<number>(-1);
  const [hintArrow, setHintArrow] = useState<{ from: string; to: string } | null>(null);
  const [analysisView, setAnalysisView] = useState<"play" | "analysis" | "review">("play");
  const [perMove, setPerMove] = useState<PerMove[] | null>(null);
  const [analysing, setAnalysing] = useState<{ done: number; total: number } | null>(null);
  const [noAnimateOnce, setNoAnimateOnce] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [maxBoardSize, setMaxBoardSize] = useState<number>(500);

  useEffect(() => {
    if (!cfg || !containerRef.current) return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        const availableHeight = entry.contentRect.height;
        const availableWidth = entry.contentRect.width;
        
        // Exact 960px breakpoint check matching layout container specs
        if (window.innerWidth >= 960) {
          const safeHeight = availableHeight - 32; 
          // Account dynamically for responsive sidebar width variations (approx 288px to 384px) + layout gaps
          const sidebarEstimate = window.innerWidth >= 1280 ? 400 : window.innerWidth >= 1024 ? 340 : 310;
          const safeWidth = availableWidth - sidebarEstimate;
          setMaxBoardSize(Math.min(safeHeight, safeWidth));
        } else {
          setMaxBoardSize(availableWidth);
        }
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [cfg]);

  const idlePieces = useMemo(() => {
    const g = new Chess();
    const t = new PieceTracker();
    t.reset(g);
    return t.withIds(g);
  }, []);

  const runEngineRef = useRef<() => void>(() => {});

  const gameActions = useGameActions({
    stateRef, lastTickRef, force,
    setCfg, setSelected, setViewIndex,
    setVarCursor: (c) => setVarCursorExternal(c),
    setHintArrow, setAnalysisView, setPerMove, setNoAnimateOnce,
    setPremoves: (updater) => setPremovesExternal(updater),
    onGameStarted: (playerColor) => {
      if (playerColor === "b") setTimeout(() => runEngineRef.current(), 400);
    },
  });

  const {
    premoves, premovesRef, setPremoves: setPremovesExternal,
    projectedBoard, queuePremove, cancelPremoves, tryPlayPremove,
  } = usePremoves({
    stateRef,
    recordMainlineMove: gameActions.recordMainlineMove,
    force,
    scheduleEngineReply: () => setTimeout(() => runEngineRef.current(), ENGINE_REPLY_DELAY_MS),
    setNoAnimateOnce,
  });

  const { runEngine } = useChessEngine({
    stateRef,
    recordMainlineMove: gameActions.recordMainlineMove,
    force,
    premovesRef,
    tryPlayPremove,
    setPremoves: setPremovesExternal,
  });
  runEngineRef.current = runEngine;

  const {
    varCursor, setVarCursor: setVarCursorExternal, tryVariationMove, computeVariationView,
  } = useVariations({
    stateRef,
    viewIndex,
    force,
    setSelected,
    setHintArrow,
    setNoAnimateOnce,
    playMoveSound,
  });

  const { startGame, resetToSetup, rematch, undoMove, resign } = gameActions;

  useEffect(() => {
    if (!cfg || cfg.timer.baseMs === 0) return;
    const id = window.setInterval(() => {
      const s = stateRef.current;
      if (!s || s.game.isGameOver()) return;
      const now = performance.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      if (s.game.turn() === "w") s.whiteMs = Math.max(0, s.whiteMs - delta);
      else s.blackMs = Math.max(0, s.blackMs - delta);
      force(n => n + 1);
    }, 100);
    return () => window.clearInterval(id);
  }, [cfg]);

  useEffect(() => {
    if (noAnimateOnce) {
      const id = requestAnimationFrame(() => setNoAnimateOnce(false));
      return () => cancelAnimationFrame(id);
    }
  }, [noAnimateOnce]);

  const onMove = (from: string, to: string, viaDrag = false) => {
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
      gameActions.recordMainlineMove(mv);
      setSelected(null);
      setHintArrow(null);
      if (viaDrag) setNoAnimateOnce(true);
      force(n => n + 1);
      if (!s.game.isGameOver() && s.cfg.engine) setTimeout(() => runEngineRef.current(), ENGINE_REPLY_DELAY_MS);
    } catch { /* illegal */ }
  };

  const computeView = () => {
    const s = stateRef.current!;
    const varView = computeVariationView();
    if (varView) return varView;
    if (viewIndex === -1) {
      return {
        fen: s.game.fen(),
        lastMove: s.lastMoves.length ? s.lastMoves[s.lastMoves.length - 1] : null,
      };
    }
    return { fen: s.fenHistory[viewIndex + 1], lastMove: viewIndex >= 0 ? s.lastMoves[viewIndex] : null };
  };

  const handleSquare = (sq: string) => {
    const s = stateRef.current;
    if (!s) return;
    const live = viewIndex === -1 && varCursor == null;
    const viewing = !live;
    if (viewing) {
      const view = computeView();
      let g: Chess;
      try { g = new Chess(view.fen); } catch { return; }
      const piece = g.get(sq as any);
      if (selected) {
        if (sq === selected) return;
        const moves = g.moves({ square: selected as any, verbose: true }) as any[];
        if (moves.some(m => m.to === sq)) { tryVariationMove(selected, sq, false); return; }
        if (piece) setSelected(sq);
        return;
      }
      if (piece) setSelected(sq);
      return;
    }
    if (s.game.isGameOver()) return;
    const myTurn = s.game.turn() === s.playerColor;
    const proj = myTurn ? null : projectedBoard();
    const piece = myTurn ? s.game.get(sq as any) : proj?.get(sq as any);
    if (selected) {
      if (sq === selected) return;
      if (myTurn) {
        const moves = s.game.moves({ square: selected as any, verbose: true }) as any[];
        if (moves.some(m => m.to === sq)) { onMove(selected, sq, false); return; }
        if (piece && piece.color === s.playerColor) setSelected(sq);
        return;
      }
      const own = proj?.get(selected as any);
      if (own && own.color === s.playerColor && sq !== selected) {
        let legalPremove = false;
        if (proj) {
          legalPremove = isPremoveLegal(proj.fen(), selected, sq, s.playerColor);
        }
        if (legalPremove) { queuePremove(selected, sq); return; }
        if (piece && piece.color === s.playerColor) { setSelected(sq); return; }
      }
      return;
    }
    if (piece && piece.color === s.playerColor) {
      setSelected(sq);
    }
  };

  const clearSelection = useCallback(() => setSelected(null), []);

  const showHint = () => {
    const s = stateRef.current;
    if (!s || s.game.isGameOver() || s.game.turn() !== s.playerColor) return;
    const best = findBestMove(s.game, 2).move;
    if (best) setHintArrow({ from: best.from, to: best.to });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (varCursor) {
          if (varCursor.step > 0) setVarCursorExternal({ ...varCursor, step: varCursor.step - 1 });
          else { setVarCursorExternal(null); setViewIndex(s.variations[varCursor.varIndex].parentIndex); }
          setNoAnimateOnce(true);
          return;
        }
        const current = viewIndex === -1 ? s.sans.length - 1 : viewIndex - 1;
        if (current >= -1) { setNoAnimateOnce(true); setViewIndex(current); }
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
  }, [viewIndex, varCursor]);

  const s = stateRef.current;
  const hasActiveGame = !!cfg && !!s;
  const live = hasActiveGame ? viewIndex === -1 && varCursor == null : true;
  const reviewing = hasActiveGame ? !live : false;
  const view = hasActiveGame ? computeView() : null;

  const viewGame: Chess = useMemo(() => {
    if (!s || !view) return new Chess();
    try { return new Chess(view.fen); } catch { return s.game; }
  }, [s, view?.fen]);

  const liveFenForPieces = s?.game.fen() ?? "";
  const pieces = useMemo(() => {
    if (!s) return idlePieces;
    if (reviewing) {
      const t = new PieceTracker();
      t.reset(viewGame);
      return t.withIds(viewGame);
    }
    return s.tracker.withIds(s.game);
  }, [s, reviewing, viewGame, liveFenForPieces, idlePieces]);

  const premoveKey = useMemo(() => premoves.map(pm => `${pm.from}${pm.to}${pm.promotion ?? ""}`).join(","), [premoves]);
  const projectedPieces = useMemo(() => {
    if (!s || !live || premoves.length === 0) return null;
    let fen = s.game.fen();
    const t = s.tracker.clone();
    const hiddenSquares = new Set<string>();

    for (const pm of premoves) {
      if (!isPremoveLegal(fen, pm.from, pm.to, s.playerColor)) return null;
      const before = boardFromFen(fen);
      const { file: fFile, rank: fRank } = sqToRC(pm.from);
      const { file: tFile, rank: tRank } = sqToRC(pm.to);
      const moving = before[fRank][fFile];
      const targetBefore = before[tRank][tFile];
      const isEnPassant = moving?.type === "p" && fFile !== tFile && !targetBefore;
      const { fen: nextFen, hiddenKingSquare } = applyPremoveToFen(fen, pm.from, pm.to, pm.promotion ?? "q", s.playerColor);

      if (hiddenKingSquare) hiddenSquares.add(hiddenKingSquare);

      if (isEnPassant) {
        const capSq = `${"abcdefgh"[tFile]}${pm.from[1]}`;
        (t as any).ids.delete(capSq);
      } else if (targetBefore) {
        (t as any).ids.delete(pm.to);
      }
      const id = (t as any).ids.get(pm.from);
      (t as any).ids.delete(pm.from);
      if (id) (t as any).ids.set(pm.to, id);
      if (moving?.type === "k" && Math.abs(tFile - fFile) === 2) {
        const kingside = tFile > fFile;
        const rank = pm.from[1];
        const rookFrom = kingside ? `h${rank}` : `a${rank}`;
        const rookTo = kingside ? `f${rank}` : `d${rank}`;
        const rid = (t as any).ids.get(rookFrom);
        (t as any).ids.delete(rookFrom);
        if (rid) (t as any).ids.set(rookTo, rid);
      }

      fen = nextFen;
    }

    const board = boardFromFen(fen);
    const outPieces: any[] = [];
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const p = board[rank][file];
        if (!p) continue;
        const square = `${"abcdefgh"[file]}${rank + 1}`;
        if (hiddenSquares.has(square)) continue;
        if (!(t as any).ids.has(square)) (t as any).ids.set(square, `p${(t as any).nextId++}`);
        outPieces.push({ square, color: p.color, type: p.type.toUpperCase(), id: (t as any).ids.get(square) });
      }
    }
    return outPieces;
  }, [s, live, premoveKey, liveFenForPieces]);

  const legal: string[] = useMemo(() => {
    if (!s || !selected) return [];
    if (live && s.game.turn() !== s.playerColor) {
      const proj = projectedBoard();
      if (!proj) return [];
      const fen = proj.fen();
      const parts = fen.split(" ");
      parts[1] = s.playerColor;
      parts[3] = "-";
      try {
        const g = new Chess(parts.join(" "));
        const normal = (g.moves({ square: selected as any, verbose: true }) as any[]).map((m: any) => m.to);
        const ownSquares = (proj.board().flat().filter(Boolean) as any[])
          .filter(p => p.color === s.playerColor)
          .map(p => p.square)
          .filter(sq => sq !== selected && !normal.includes(sq))
          .filter(sq => isPremoveLegal(fen, selected!, sq, s.playerColor));
        return [...normal, ...ownSquares];
      } catch { return []; }
    }
    return (viewGame.moves({ square: selected as any, verbose: true }) as any[]).map((m: any) => m.to);
  }, [s, selected, live, viewGame, premoveKey, projectedBoard]);

  const premoveSquares = useMemo(
    () => (live ? premoves.flatMap(pm => [pm.from, pm.to]) : []),
    [live, premoveKey],
  );

  const liveFenForArrows = s?.game.fen() ?? "";
  const evalScore = (s && view && cfg?.evalBar)
    ? evalCache.get(view.fen) ?? evalCache.set(view.fen, evaluate(viewGame))
    : null;
  const suggestion = (s && live && cfg?.suggestionArrows)
    ? bestCache.get(liveFenForArrows) ?? bestCache.set(liveFenForArrows, findBestMove(s.game, 2).move)
    : null;
  const threat = (s && live && cfg?.threatArrows)
    ? threatCache.get(liveFenForArrows) ?? threatCache.set(liveFenForArrows, findThreat(s.game))
    : null;

  const analysisArrows = useMemo(() => [
    ...(suggestion ? [{ from: suggestion.from, to: suggestion.to, color: "hsl(142 70% 45% / 0.85)" }] : []),
    ...(threat ? [{ from: threat.from, to: threat.to, color: "hsl(0 75% 55% / 0.85)" }] : []),
    ...(hintArrow ? [{ from: hintArrow.from, to: hintArrow.to, color: "hsl(48 96% 53% / 0.9)" }] : []),
  ], [suggestion, threat, hintArrow, live, premoveKey]);

  const lastMove = view?.lastMove ?? null;

  // ── Setup View Dashboard ────────────────────────────────────────────────
  if (!cfg || !s) {
    return (
      <div className="w-full flex-1 flex items-center justify-center p-4 max-w-6xl mx-auto min-h-0 [@media(min-width:960px)]:h-screen overflow-hidden">
        <div className="w-full select-none overflow-y-auto max-h-full pr-1">
          <ChessSetupPanel onPlay={startGame} />
        </div>
      </div>
    );
  }

  // ── Active Match Screen Layout (Dynamic Adjustments with 960px Breakpoint) ──
  const orientation = s.playerColor === "w" ? "white" : "black";
  const isResigned = s.resigned === true;
  const isGameOver = s.game.isGameOver() || isResigned;

  const topClockColor: "w" | "b" = orientation === "white" ? "b" : "w";
  const bottomClockColor: "w" | "b" = orientation === "white" ? "w" : "b";
  const clockMs = (c: "w" | "b") => c === "w" ? s.whiteMs : s.blackMs;
  const showClocks = cfg.timer.baseMs > 0;
  const turn = s.game.turn();

  const currentPly = varCursor
    ? s.variations[varCursor.varIndex].parentIndex
    : (viewIndex === -1 ? s.sans.length - 1 : viewIndex);

  const reviewBadge = analysisView === "review" && perMove && reviewing && !varCursor && lastMove
    ? { square: lastMove.to, kind: perMove[viewIndex].kind }
    : null;

  return (
      <div 
        ref={containerRef}
        className="w-full flex-1 flex flex-col [@media(min-width:960px)]:grid [@media(min-width:960px)]:grid-cols-[1fr_auto] gap-4 p-4 max-w-7xl mx-auto min-h-0 [@media(min-width:960px)]:h-screen [@media(min-width:960px)]:max-h-screen overflow-hidden"
      >
        
        {/* Left Chessboard Block - Zero excess padding/margins on the right side */}
        <div className="w-full h-full flex items-center justify-center min-h-0 min-w-0 overflow-hidden">
          <div 
            style={{ 
              height: `${maxBoardSize}px`, 
              width: `${maxBoardSize}px`,
              maxHeight: "100%",
              maxWidth: "100%"
            }}
            className="flex aspect-square items-stretch gap-2 justify-center min-h-0 min-w-0 transition-[width,height] duration-75 ease-out"
          >
            {evalScore !== null && analysisView !== "analysis" && <EvalBar score={evalScore} />}
            <Container className="p-0 rounded-[20px] h-full w-full aspect-square min-w-0 relative overflow-hidden">
              <Chessboard
                pieces={projectedPieces ?? pieces}
                orientation={orientation}
                selected={selected}
                legalSquares={legal}
                lastMove={lastMove}
                onSquareClick={handleSquare}
                onPieceDrop={(from, to) => onMove(from, to, true)}
                onDragBegin={(sq) => {
                  if (reviewing) { setSelected(sq); return; }
                  if (live && s.game.turn() !== s.playerColor) {
                    const proj = projectedBoard();
                    const piece = proj?.get(sq as any);
                    if (piece && piece.color === s.playerColor) setSelected(sq);
                    return;
                  }
                  const piece = s.game.get(sq as any);
                  if (piece && piece.color === s.playerColor) {
                    setSelected(sq);
                  }
                }}
                inputMode={settings.inputMode}
                arrows={analysisArrows}
                interactive={true}
                animate={settings.animatePieces && !noAnimateOnce}
                animationMs={settings.animationSpeed}
                moveBadge={reviewBadge}
                premoveSquares={premoveSquares}
                onCancelPremoves={cancelPremoves}
                onClearSelection={clearSelection}
                interactiveColor={live ? s.playerColor : undefined}
              />
            </Container>
          </div>
        </div>

        {/* Right Side Panel Control Block - Scalable dynamic width configuration */}
        <div className="flex flex-col w-full min-h-0 h-full justify-between select-none overflow-hidden [@media(min-width:960px)]:w-72 lg:w-80 xl:w-96 shrink-0">
          <div className="flex flex-col gap-3 overflow-y-auto pr-1 h-full max-h-full">
            {showClocks && analysisView !== "analysis" && (
              <div className="grid grid-cols-2 gap-2 shrink-0">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider opacity-60 text-center">
                    {orientation === "white" ? "Black" : "White"}
                  </p>
                  <ChessClock ms={clockMs(topClockColor)} active={turn === topClockColor && !isGameOver} low />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider opacity-60 text-center">
                    {orientation === "white" ? "White" : "Black"}
                  </p>
                  <ChessClock ms={clockMs(bottomClockColor)} active={turn === bottomClockColor && !isGameOver} low />
                </div>
              </div>
            )}

            {analysisView === "analysis" && isGameOver && perMove ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <Suspense fallback={<div className="p-4 text-sm opacity-70">Loading report…</div>}>
                  <AnalysisReport
                    perMove={perMove}
                    fens={s.fenHistory}
                    white={summarisePlayer(perMove, "w")}
                    black={summarisePlayer(perMove, "b")}
                    currentIndex={currentPly}
                    onSelect={(i) => {
                      setVarCursorExternal(null);
                      setNoAnimateOnce(true);
                      setViewIndex(i >= s.sans.length - 1 ? -1 : i);
                    }}
                    onReview={() => setAnalysisView("review")}
                  />
                </Suspense>
              </div>
            ) : (
              <>
                {(cfg.moveFeedback || analysisView === "review") && (
                  <div className="shrink-0">
                    <MoveDetailPanel
                      sans={s.sans}
                      fens={s.fenHistory}
                      currentIndex={currentPly}
                      perMove={analysisView === "review" ? perMove ?? undefined : undefined}
                      showBestLine={analysisView === "review"}
                      orientation={orientation}
                      onSelect={(i) => {
                        setVarCursorExternal(null);
                        setNoAnimateOnce(true);
                        setViewIndex(i >= s.sans.length - 1 ? -1 : i);
                      }}
                    />
                  </div>
                )}

                <div className="min-h-[140px] flex-1 overflow-hidden flex flex-col">
                  <MovesList
                    sans={s.sans}
                    times={s.moveTimes}
                    showTimes={showClocks}
                    activeIndex={varCursor ? -1 : (live ? s.sans.length - 1 : viewIndex)}
                    classifications={analysisView === "review" ? perMove?.map(m => m.kind) : undefined}
                    variations={s.variations}
                    activeCursor={varCursor}
                    onSelect={(i) => {
                      setVarCursorExternal(null);
                      setNoAnimateOnce(true);
                      setViewIndex(i === s.sans.length - 1 ? -1 : i);
                    }}
                    onSelectVariation={(c) => {
                      setNoAnimateOnce(true);
                      setVarCursorExternal(c);
                    }}
                  />
                </div>

                {isGameOver && analysisView === "play" && (
                  <div className="flex flex-col gap-2 shrink-0 pt-2 border-t bg-background">
                    <Button
                      onClick={async () => {
                        if (!perMove) {
                          setAnalysing({ done: 0, total: s.sans.length });
                          try {
                            const result = await analyseGame(s.fenHistory, s.sans, {
                              depth: 12,
                              onProgress: (done, total) => setAnalysing({ done, total }),
                            });
                            setPerMove(result);
                          } finally {
                            setAnalysing(null);
                          }
                        }
                        setAnalysisView("analysis");
                      }}
                      variant="outline"
                      className="gap-2 w-full"
                      disabled={!!analysing}
                    >
                      <BarChart3 className="h-4 w-4" />
                      {analysing
                        ? `Analysing… ${analysing.done}/${analysing.total}`
                        : "Analyse Game"}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={rematch} variant="outline" className="gap-2">
                        <RotateCcw className="h-4 w-4" /> Rematch
                      </Button>
                      <Button onClick={resetToSetup} className="gap-2">
                        <Play className="h-4 w-4" /> New Game
                      </Button>
                    </div>
                  </div>
                )}

                {isGameOver && analysisView === "review" && (
                  <Button onClick={() => setAnalysisView("analysis")} variant="outline" className="gap-2 shrink-0 mt-2 bg-background">
                    <BarChart3 className="h-4 w-4" /> Show Report Card
                  </Button>
                )}

                {!isGameOver && (
                  <div className="grid grid-cols-3 gap-2 shrink-0 pt-2 border-t bg-background">
                    <Button onClick={resign} variant="outline" size="icon" aria-label="Resign" title="Resign">
                      <Flag className="h-4 w-4" />
                    </Button>
                    <Button onClick={undoMove} variant="outline" size="icon" aria-label="Undo" title="Undo">
                      <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button onClick={showHint} variant="outline" size="icon" aria-label="Show hint" title="Show hint">
                      <Lightbulb className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
  );
}