import React, { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/Component/Chess/Chessboard";
import { Container } from "@/Component/UI/container";
import { Button } from "@/Component/UI/Button";
import { ChessSetupPanel, type GameConfig } from "@/Component/Chess/ChessSetupPanel";
import { PieceTracker } from "@/Component/Chess/chessHelpers";
import { useChessSettings } from "@/Library/chessSettings";
import { analyseGame, type PerMove } from "../../Component/Chess/analysis/classification";
import { EvalBar } from "@/Component/Chess/Play/Evalbar";
import { playMoveSound } from "@/Component/Chess/Play/Use-Audio";
import { ENGINE_REPLY_DELAY_MS } from "@/Component/Chess/Play/EngineCache";
import { usePremoves } from "@/Component/Chess/Play/Use-Premove";
import { useChessEngine } from "@/Component/Chess/Play/Use-Chess-Engine";
import { useVariations } from "@/Component/Chess/Play/Use-Variation";
import { useGameActions } from "@/Component/Chess/Play/Use-Game-Action";
import { useBoardOverlay } from "@/Component/Chess/Play/Board-Overlay";
import { RightPanel } from "@/Component/Chess/Play/Right-Panel";
import { usePlayLogic } from "@/Component/Chess/Play/Use-Play-Logic";
import type { PlayState } from "@/Component/Chess/Play/Types";

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ChessPlayView() {
  const [settings] = useChessSettings();
  const [cfg, setCfg] = useState<GameConfig | null>(null);
  const [, force] = useState(0);
  const stateRef = useRef<PlayState | null>(null);
  const lastTickRef = useRef<number>(0);
  const movesEndRef = useRef<HTMLDivElement | null>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [viewIndex, setViewIndex] = useState<number>(-1);
  const [hintArrow, setHintArrow] = useState<{ from: string; to: string } | null>(null);
  const [analysisView, setAnalysisView] = useState<"play" | "analysis" | "review">("play");
  const [perMove, setPerMove] = useState<PerMove[] | null>(null);
  const [analysing, setAnalysing] = useState<{ done: number; total: number } | null>(null);
  const [noAnimateOnce, setNoAnimateOnce] = useState(false);

  const idlePieces = useMemo(() => {
    const g = new Chess();
    const t = new PieceTracker();
    t.reset(g);
    return t.withIds(g);
  }, []);

  const runEngineRef = useRef<() => void>(() => {});

  const gameActions = useGameActions({
    stateRef,
    lastTickRef,
    force,
    setCfg,
    setSelected,
    setViewIndex,
    setVarCursor: (c) => setVarCursorExternal(c),
    setHintArrow,
    setAnalysisView,
    setPerMove,
    setNoAnimateOnce,
    setPremoves: (updater) => setPremovesExternal(updater),
    onGameStarted: (playerColor) => {
      if (playerColor === "b") setTimeout(() => runEngineRef.current(), 400);
    },
  });

  const {
    premoves,
    premovesRef,
    setPremoves: setPremovesExternal,
    queuePremove,
    cancelPremoves,
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
    tryPlayPremove: () => {},
    setPremoves: setPremovesExternal,
  });
  runEngineRef.current = runEngine;

  const {
    varCursor,
    setVarCursor: setVarCursorExternal,
    tryVariationMove,
    computeVariationView,
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
      force((n) => n + 1);
    }, 100);
    return () => window.clearInterval(id);
  }, [cfg]);

  useEffect(() => {
    if (noAnimateOnce) {
      const id = requestAnimationFrame(() => setNoAnimateOnce(false));
      return () => cancelAnimationFrame(id);
    }
  }, [noAnimateOnce]);

  const s = stateRef.current;
  const hasActiveGame = !!cfg && !!s;
  const live = hasActiveGame ? viewIndex === -1 && varCursor == null : true;
  const reviewing = hasActiveGame ? !live : false;

  useEffect(() => {
    if (s && s.sans.length > 0 && viewIndex !== -1 && !varCursor) {
      setViewIndex(-1);
    }
  }, [s?.sans.length]);

  const {
    setContainerRef,
    computeView,
    onMove,
    handleSquare,
    clearSelection,
    showHint,
  } = usePlayLogic({
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
    recordMainlineMove: gameActions.recordMainlineMove,
    queuePremove,
    runEngineRef,
    projectedBoard: null,
    force,
  });

  const view = hasActiveGame ? computeView() : null;

  const viewGame: Chess = useMemo(() => {
    if (!s || !view) return new Chess();
    try {
      return new Chess(view.fen);
    } catch {
      return s.game;
    }
  }, [s, view?.fen]);

  const {
    pieces,
    projectedPieces,
    projectedBoard,
    legal,
    premoveSquares,
    evalScore,
    analysisArrows,
  } = useBoardOverlay({
    s,
    live,
    reviewing,
    viewGame,
    selected,
    premoves,
    hintArrow,
    evalBarConfig: cfg?.evalBar,
    suggestionArrowsConfig: cfg?.suggestionArrows,
    threatArrowsConfig: cfg?.threatArrows,
    idlePieces,
  });

  useEffect(() => {
    if (movesEndRef.current) {
      movesEndRef.current.scrollIntoView({ behavior: "smooth", inline: "end" });
    }
  }, [s?.sans.length, s?.variations?.length, varCursor]);

  if (!cfg || !s) {
    return (
      <div className="w-full flex-1 flex items-center justify-center p-4 max-w-6xl mx-auto min-h-0 h-full overflow-hidden">
        <div className="w-full select-none overflow-y-auto max-h-full pr-1">
          <ChessSetupPanel onPlay={startGame} />
        </div>
      </div>
    );
  }

  const orientation = s.playerColor === "w" ? "white" : "black";
  const isResigned = s.resigned === true;
  const isGameOver = s.game.isGameOver() || isResigned;

  const topClockColor: "w" | "b" = orientation === "white" ? "b" : "w";
  const bottomClockColor: "w" | "b" = orientation === "white" ? "w" : "b";
  const clockMs = (c: "w" | "b") => (c === "w" ? s.whiteMs : s.blackMs);
  const showClocks = cfg.timer.baseMs > 0;
  const turn = s.game.turn();

  const currentPly = varCursor
    ? s.variations?.[varCursor.varIndex]?.parentIndex ?? -1
    : viewIndex === -1
    ? s.sans.length - 1
    : viewIndex;

  const lastMove = view?.lastMove ?? null;
  const reviewBadge =
    analysisView === "review" && perMove && reviewing && !varCursor && lastMove
      ? { square: lastMove.to, kind: perMove[viewIndex].kind }
      : null;

  const variations = s.variations || [];

  const handleDragBegin = (sq: string) => {
    if (reviewing) {
      const currentPiece = viewGame.get(sq as any);
      if (currentPiece && currentPiece.color === viewGame.turn()) {
        setSelected(sq);
      }
      return;
    }
    if (live && s.game.turn() !== s.playerColor) {
      const proj = projectedBoard;
      const piece = proj?.get(sq as any);
      if (piece && piece.color === s.playerColor) setSelected(sq);
      return;
    }
    const piece = s.game.get(sq as any);
    if (piece && piece.color === s.playerColor) {
      setSelected(sq);
    }
  };

  const commonRightPanelProps = {
    cfg,
    s,
    showClocks,
    orientation,
    isGameOver,
    turn,
    clockMs,
    topClockColor,
    bottomClockColor,
    analysisView,
    perMove,
    currentPly,
    live,
    viewIndex,
    varCursor,
    analysing,
    setAnalysisView,
    setVarCursorExternal,
    setNoAnimateOnce,
    setViewIndex,
    setPerMove,
    setAnalysing,
    analyseGame,
    rematch,
    resetToSetup,
    resign,
    undoMove,
    showHint,
  };

  return (
    <div
      ref={(node) => {
        setContainerRef(node);
      }}
      className="w-full h-[100dvh] max-h-[100dvh] flex flex-col justify-center items-center p-2 overflow-hidden select-none min-h-0 min-w-0 box-border"
    >
      {/* ── 1. DESKTOP VIEW (>= 960px) ── */}
      <div className="hidden min-[960px]:flex flex-row items-center justify-center w-full h-full max-w-7xl mx-auto gap-4 min-h-0 min-w-0 overflow-hidden">
        <div className="[container-type:size] h-full flex-1 min-h-0 min-w-0 flex items-center justify-center overflow-hidden">
          <div className="w-[min(100cqw,100cqh)] h-[min(100cqw,100cqh)] flex items-stretch gap-2 justify-center relative min-h-0 min-w-0">
            {evalScore !== null && analysisView !== "analysis" && <EvalBar score={evalScore} />}
            <div
              className={`p-0 rounded-[20px] h-full w-full aspect-square relative overflow-hidden transition-all ${
                reviewing ? "brightness-105 contrast-[1.02]" : ""
              }`}
            >
              <Chessboard
                pieces={projectedPieces ?? pieces}
                orientation={orientation}
                selected={selected}
                legalSquares={legal}
                lastMove={lastMove}
                onSquareClick={handleSquare}
                onPieceDrop={(from, to) => onMove(from, to, true)}
                onDragBegin={handleDragBegin}
                inputMode={settings.inputMode}
                arrows={analysisArrows}
                interactive={true}
                animate={settings.animatePieces && !noAnimateOnce}
                animationMs={settings.animationSpeed}
                moveBadge={reviewBadge}
                premoveSquares={premoveSquares}
                onCancelPremoves={cancelPremoves}
                onClearSelection={clearSelection}
                interactiveColor={live ? s.playerColor : viewGame.turn()}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 max-w-[384px] h-full min-h-0 shrink overflow-hidden">
          <RightPanel {...commonRightPanelProps} layoutMode="vertical" />
        </div>
      </div>

      {/* ── 2. MOBILE & TABLET VIEW (< 960px) ── */}
      <div className="flex max-[959px]:flex min-[960px]:hidden flex-col items-center justify-center w-full h-full min-h-0 min-w-0 gap-1.5 p-1 mx-auto overflow-hidden">
        <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0 min-w-0 overflow-hidden gap-1">
          {/* Top Player Info Bar */}
          <div className="w-full max-w-lg flex items-center justify-between px-2 py-1 shrink-0 rounded-lg bg-accent/20 border border-border/40 text-xs">
            <span className="opacity-70 italic font-medium">[ Top Player Info Placeholder ]</span>
          </div>

          {/* Board Container with Container Queries */}
          <div className="[container-type:size] w-full flex-1 min-h-0 min-w-0 flex items-center justify-center overflow-hidden">
            <div className="w-[min(100cqw,100cqh)] h-[min(100cqw,100cqh)] flex items-stretch gap-1.5 justify-center relative min-h-0 min-w-0">
              {evalScore !== null && analysisView !== "analysis" && (
                <EvalBar score={evalScore} />
              )}
              <div
                className={`p-0 rounded-[16px] h-full w-full aspect-square relative overflow-hidden transition-all ${
                  reviewing ? "brightness-105 contrast-[1.02]" : ""
                }`}
              >
                <Chessboard
                  pieces={projectedPieces ?? pieces}
                  orientation={orientation}
                  selected={selected}
                  legalSquares={legal}
                  lastMove={lastMove}
                  onSquareClick={handleSquare}
                  onPieceDrop={(from, to) => onMove(from, to, true)}
                  onDragBegin={handleDragBegin}
                  inputMode={settings.inputMode}
                  arrows={analysisArrows}
                  interactive={true}
                  animate={settings.animatePieces && !noAnimateOnce}
                  animationMs={settings.animationSpeed}
                  moveBadge={reviewBadge}
                  premoveSquares={premoveSquares}
                  onCancelPremoves={cancelPremoves}
                  onClearSelection={clearSelection}
                  interactiveColor={live ? s.playerColor : viewGame.turn()}
                />
              </div>
            </div>
          </div>

          {/* Bottom Player Info Bar */}
          <div className="w-full max-w-lg flex items-center justify-between px-2 py-1 shrink-0 rounded-lg bg-accent/20 border border-border/40 text-xs">
            <span className="opacity-70 italic font-medium">[ Bottom Player Info Placeholder ]</span>
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Move History */}
        <Container className="w-full h-10 shrink-0 flex items-center gap-1.5 overflow-x-auto overflow-y-hidden px-2 py-1 text-xs whitespace-nowrap">
          {s.sans.length === 0 ? (
            <span className="opacity-50 italic px-2">Game started</span>
          ) : (
            s.sans.map((move, idx) => {
              const moveNumber = Math.floor(idx / 2) + 1;
              const isWhite = idx % 2 === 0;
              const isSelected =
                varCursor == null && (viewIndex === idx || (viewIndex === -1 && idx === s.sans.length - 1));

              const nodeVars = variations.filter((v) => v && v.parentIndex === idx);

              return (
                <React.Fragment key={idx}>
                  {isWhite && (
                    <span className="h-6 px-1.5 text-[10px] font-semibold opacity-60 shrink-0 flex items-center justify-center">
                      {moveNumber}.
                    </span>
                  )}
                  <Button
                    active={isSelected}
                    onClick={() => {
                      setNoAnimateOnce(true);
                      setVarCursorExternal(null);
                      setViewIndex(idx === s.sans.length - 1 ? -1 : idx);
                    }}
                    className="h-6 px-2 text-xs shrink-0 font-normal"
                  >
                    <span>{move}</span>
                  </Button>

                  {/* Variation Chips */}
                  {nodeVars.length > 0 &&
                    nodeVars.map((v, vIdx) => {
                      const movesList = v.sans || v.moves || [];
                      const varIdxInState = variations.indexOf(v);

                      return (
                        <div
                          key={vIdx}
                          className="flex items-center gap-1 px-1.5 py-0.5 border border-border rounded-md bg-accent/30 shrink-0"
                        >
                          {movesList.map((m, mIdx) => {
                            const varPly = v.parentIndex + 1 + mIdx;
                            const mNum = Math.floor(varPly / 2) + 1;
                            const isWTurn = varPly % 2 === 0;

                            const activeStep = varCursor?.step ?? varCursor?.ply;
                            const isVarSelected =
                              varCursor &&
                              varCursor.varIndex === varIdxInState &&
                              activeStep === mIdx;

                            const mSan = typeof m === "string" ? m : m?.san || String(m);

                            return (
                              <React.Fragment key={mIdx}>
                                {(mIdx === 0 || isWTurn) && (
                                  <span className="h-5 px-1 text-[9px] font-semibold opacity-60 shrink-0 flex items-center justify-center">
                                    {mNum}.
                                  </span>
                                )}
                                <Button
                                  active={isVarSelected}
                                  onClick={() => {
                                    setNoAnimateOnce(true);
                                    setVarCursorExternal({
                                      varIndex: varIdxInState,
                                      step: mIdx,
                                    });
                                  }}
                                  className="h-5 px-1.5 text-[10px] shrink-0 font-normal"
                                >
                                  {mSan}
                                </Button>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      );
                    })}
                </React.Fragment>
              );
            })
          )}
          <div ref={movesEndRef} />
        </Container>

        {/* Mobile / Tablet Horizontal Controls Panel */}
        <div className="w-full shrink-0">
          <RightPanel {...commonRightPanelProps} showClocks={false} layoutMode="horizontal" />
        </div>
      </div>
    </div>
  );
}