import React, { useEffect, useRef } from "react";
import { Container } from "@/Component/UI/container";
import { Button } from "@/Component/UI/Button";
import { AnalysisReport } from "@/Component/Chess/analysis/AnalysisReport";
import type { GameConfig } from "@/Component/Chess/ChessSetupPanel";
import type { PlayState } from "@/Component/Chess/Play/Types";
import type { PerMove } from "@/Component/Chess/analysis/classification";
import { RotateCcw, Sparkles, Eye, Lightbulb, Flag } from "lucide-react";

interface RightPanelProps {
  cfg: GameConfig;
  s: PlayState;
  showClocks: boolean;
  orientation: "white" | "black";
  isGameOver: boolean;
  turn: "w" | "b";
  clockMs: (c: "w" | "b") => number;
  topClockColor: "w" | "b";
  bottomClockColor: "w" | "b";
  analysisView: "play" | "analysis" | "review";
  perMove: PerMove[] | null;
  currentPly: number;
  live: boolean;
  viewIndex: number;
  varCursor: any;
  analysing: { done: number; total: number } | null;
  setAnalysisView: (v: "play" | "analysis" | "review") => void;
  setVarCursorExternal: (cursor: any) => void;
  setNoAnimateOnce: (v: boolean) => void;
  setViewIndex: (i: number) => void;
  setPerMove: (moves: PerMove[] | null) => void;
  setAnalysing: (a: { done: number; total: number } | null) => void;
  analyseGame: (
    sans: string[],
    fenHistory: string[],
    onProgress: (done: number, total: number) => void
  ) => Promise<{ perMove: PerMove[]; white: any; black: any }>;
  rematch: () => void;
  resetToSetup: () => void;
  resign: () => void;
  undoMove: () => void;
  showHint: () => void;
  layoutMode?: "vertical" | "horizontal";
}

export const RightPanel: React.FC<RightPanelProps> = ({
  cfg,
  s,
  isGameOver,
  analysisView,
  perMove,
  currentPly,
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
  resign,
  undoMove,
  showHint,
  layoutMode = "vertical",
}) => {
  const desktopMovesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (desktopMovesEndRef.current) {
      desktopMovesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [s.sans?.length, s.variations?.length]);

  const handleStartAnalysis = async () => {
    setAnalysing({ done: 0, total: s.sans.length });
    const result = await analyseGame(s.sans, s.fenHistory, (done, total) => {
      setAnalysing({ done, total });
    });
    setPerMove(result.perMove);
    setAnalysing(null);
    setAnalysisView("analysis");
  };

  const renderButtons = () => {
    const isHoriz = layoutMode === "horizontal";
    const btnClass = isHoriz ? "flex-1 text-xs gap-1.5 py-1 h-8" : "w-full gap-2";
    const iconClass = isHoriz ? "w-3.5 h-3.5 shrink-0" : "w-4 h-4 shrink-0";

    if (isGameOver) {
      return (
        <>
          <Button variant="default" onClick={rematch} className={btnClass}>
            <RotateCcw className={iconClass} />
            Rematch
          </Button>
          {s.sans.length > 0 && !perMove && (
            <Button
              variant="outline"
              onClick={handleStartAnalysis}
              disabled={!!analysing}
              className={btnClass}
            >
              <Sparkles className={iconClass} />
              {analysing ? `(${analysing.done}/${analysing.total})` : "Analyze Game"}
            </Button>
          )}
          {perMove && analysisView !== "review" && (
            <Button
              variant="outline"
              onClick={() => setAnalysisView("review")}
              className={btnClass}
            >
              <Eye className={iconClass} />
              Review Game
            </Button>
          )}
        </>
      );
    }

    return (
      <>
        {cfg.engine && (
          <Button variant="outline" onClick={showHint} className={btnClass}>
            <Lightbulb className={iconClass} />
            Hint
          </Button>
        )}
        {s.sans.length > 0 && (
          <Button variant="outline" onClick={undoMove} className={btnClass}>
            <RotateCcw className={iconClass} />
            Undo
          </Button>
        )}
        <Button variant="destructive" onClick={resign} className={btnClass}>
          <Flag className={iconClass} />
          Resign
        </Button>
      </>
    );
  };

  if (layoutMode === "horizontal") {
    return (
      <div className="flex items-center gap-1.5 w-full overflow-x-auto">
        {renderButtons()}
      </div>
    );
  }

  const getMoveBtnClass = (isSelected: boolean) =>
    `justify-center h-8 text-xs font-normal border transition-colors ${
      isSelected
        ? "bg-black text-white border-white dark:bg-white dark:text-black dark:border-black font-semibold"
        : "border-border hover:bg-accent"
    }`;

  const getMoveSan = (m: any): string => {
    if (!m) return "";
    if (typeof m === "string") return m;
    if (typeof m === "object" && m.san) return m.san;
    return String(m);
  };

  const variations = s.variations || [];

  return (
    <div className="flex flex-col h-full justify-between gap-3 overflow-hidden">
      {analysisView === "analysis" && perMove ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AnalysisReport
            perMove={perMove}
            fens={s.fenHistory}
            white={{ accuracy: 85, estimatedRating: 1500, counts: {}, phases: {} } as any}
            black={{ accuracy: 80, estimatedRating: 1450, counts: {}, phases: {} } as any}
            currentIndex={currentPly}
            onSelect={(i) => {
              setNoAnimateOnce(true);
              setViewIndex(i);
            }}
            onReview={() => setAnalysisView("review")}
          />
        </div>
      ) : (
        <Container className="flex-1 min-h-0 p-2 overflow-y-auto text-xs">
          {s.sans.length === 0 ? (
            <p className="opacity-50 italic">No moves yet</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: Math.ceil(s.sans.length / 2) }).map((_, i) => {
                const moveNum = i + 1;
                const wIdx = i * 2;
                const bIdx = i * 2 + 1;
                const wMove = s.sans[wIdx];
                const bMove = s.sans[bIdx];

                const wSelected =
                  varCursor == null &&
                  (viewIndex === wIdx || (viewIndex === -1 && wIdx === s.sans.length - 1));
                const bSelected =
                  varCursor == null &&
                  (viewIndex === bIdx || (viewIndex === -1 && bIdx === s.sans.length - 1));

                const whiteVars = variations.filter((v) => v && v.parentIndex === wIdx);
                const blackVars = variations.filter((v) => v && v.parentIndex === bIdx);
                const activeVars = [...whiteVars, ...blackVars];

                return (
                  <React.Fragment key={i}>
                    {/* Mainline Move Row */}
                    <div className="grid grid-cols-[32px_1fr_1fr] gap-1.5 items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="h-8 px-1 text-xs font-semibold opacity-60 border-border shrink-0 cursor-default justify-center"
                      >
                        {moveNum}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNoAnimateOnce(true);
                          setVarCursorExternal(null);
                          setViewIndex(wIdx === s.sans.length - 1 ? -1 : wIdx);
                        }}
                        className={getMoveBtnClass(wSelected)}
                      >
                        {wMove}
                      </Button>

                      {bMove ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNoAnimateOnce(true);
                            setVarCursorExternal(null);
                            setViewIndex(bIdx === s.sans.length - 1 ? -1 : bIdx);
                          }}
                          className={getMoveBtnClass(bSelected)}
                        >
                          {bMove}
                        </Button>
                      ) : (
                        <span />
                      )}
                    </div>

                    {/* Variations Container without side border or background color */}
                    {activeVars.length > 0 && (
                      <div className="ml-7 my-1 flex flex-col gap-1">
                        {activeVars.map((v, vIdx) => {
                          const movesList = v.sans || v.moves || [];
                          const varIdxInState = variations.indexOf(v);
                          const varPairsCount = Math.ceil(movesList.length / 2);

                          return (
                            <div
                              key={vIdx}
                              className="p-1.5 flex flex-col gap-1 bg-transparent"
                            >
                              {Array.from({ length: varPairsCount }).map((_, pIdx) => {
                                const wVarIdx = pIdx * 2;
                                const bVarIdx = pIdx * 2 + 1;

                                const wVarMove = movesList[wVarIdx];
                                const bVarMove = movesList[bVarIdx];

                                const startPly = v.parentIndex + 1;
                                const wPly = startPly + wVarIdx;
                                const wNum = Math.floor(wPly / 2) + 1;

                                const activeStep = varCursor?.step ?? varCursor?.ply;

                                const isWVarSelected =
                                  varCursor &&
                                  varCursor.varIndex === varIdxInState &&
                                  activeStep === wVarIdx;

                                const isBVarSelected =
                                  varCursor &&
                                  varCursor.varIndex === varIdxInState &&
                                  activeStep === bVarIdx;

                                return (
                                  <div
                                    key={pIdx}
                                    className="grid grid-cols-[28px_1fr_1fr] gap-1.5 items-center"
                                  >
                                    {/* Variation Move Number */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled
                                      className="h-7 text-[10px] font-semibold opacity-50 border-border cursor-default p-0 flex items-center justify-center"
                                    >
                                      {wNum}
                                    </Button>

                                    {/* White Variation Move */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setNoAnimateOnce(true);
                                        setVarCursorExternal({
                                          varIndex: varIdxInState,
                                          step: wVarIdx,
                                        });
                                      }}
                                      className={getMoveBtnClass(!!isWVarSelected) + " h-7 text-xs"}
                                    >
                                      {getMoveSan(wVarMove)}
                                    </Button>

                                    {/* Black Variation Move (if available) */}
                                    {bVarMove ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setNoAnimateOnce(true);
                                          setVarCursorExternal({
                                            varIndex: varIdxInState,
                                            step: bVarIdx,
                                          });
                                        }}
                                        className={getMoveBtnClass(!!isBVarSelected) + " h-7 text-xs"}
                                      >
                                        {getMoveSan(bVarMove)}
                                      </Button>
                                    ) : (
                                      <div />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
              <div ref={desktopMovesEndRef} />
            </div>
          )}
        </Container>
      )}

      <div className="shrink-0 flex flex-col gap-2">
        {renderButtons()}
      </div>
    </div>
  );
};