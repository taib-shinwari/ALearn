import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chess/Chessboard";
import { Container } from "@/components/ui/container";
import { ChessSetupPanel, type GameConfig } from "./ChessSetupPanel";
import { ChessClock } from "./ChessClock";
import { MovesList } from "./MovesList";
import { PieceTracker } from "./chessHelpers";
import { pickEngineMove, findBestMove, findThreat, evaluate } from "@/lib/chessEngine";
import { random960Fen } from "@/lib/chess960";
import { useChessSettings } from "@/lib/chessSettings";
import { Button } from "@/components/ui/button";
import { Flag, Undo2, Lightbulb, Play, RotateCcw, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayState {
  game: Chess;
  tracker: PieceTracker;
  playerColor: "w" | "b";
  sans: string[];
  moveTimes: number[]; // seconds per move
  /** FEN before each move (length = sans.length + 1). Used for fast history navigation. */
  fenHistory: string[];
  /** From/To squares per move. */
  lastMoves: Array<{ from: string; to: string }>;
  whiteMs: number;
  blackMs: number;
  cfg: GameConfig;
  startedAt: number; // performance.now of game start (for first move timing)
  lastMoveAt: number; // performance.now of the previous move
}

export function ChessPlayView() {
  const [settings] = useChessSettings();
  const [cfg, setCfg] = useState<GameConfig | null>(null);
  const [, force] = useState(0);
  const stateRef = useRef<PlayState | null>(null);
  const lastTickRef = useRef<number>(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [viewIndex, setViewIndex] = useState<number>(-1); // -1 = live
  const [hintArrow, setHintArrow] = useState<{ from: string; to: string } | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  // Suppress animation for one render after a drag-drop or history jump.
  const [noAnimateOnce, setNoAnimateOnce] = useState(false);

  // Idle preview board (not playable) shown before game starts.
  const idlePieces = useMemo(() => {
    const g = new Chess();
    const t = new PieceTracker();
    t.reset(g);
    return t.withIds(g);
  }, []);

  const startGame = (gc: GameConfig) => {
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
    };
    lastTickRef.current = now;
    setCfg(gc);
    setSelected(null);
    setViewIndex(-1);
    setHintArrow(null);
    setShowAnalysis(false);
    setNoAnimateOnce(true);
    force(n => n + 1);
    if (playerColor === "b") setTimeout(() => runEngine(), 400);
  };

  // Clock tick.
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

  // Clear the noAnimate flag after the render that used it.
  useEffect(() => {
    if (noAnimateOnce) {
      const id = requestAnimationFrame(() => setNoAnimateOnce(false));
      return () => cancelAnimationFrame(id);
    }
  }, [noAnimateOnce]);

  const recordMove = useCallback((mv: any) => {
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
  }, []);

  const onMove = (from: string, to: string, viaDrag = false) => {
    const s = stateRef.current;
    if (!s || s.game.isGameOver()) return;
    if (viewIndex !== -1) return; // can't move while reviewing
    if (s.game.turn() !== s.playerColor) return;
    try {
      const mv = s.game.move({ from, to, promotion: "q" });
      if (!mv) return;
      recordMove(mv);
      setSelected(null);
      setHintArrow(null);
      if (viaDrag) setNoAnimateOnce(true);
      force(n => n + 1);
      if (!s.game.isGameOver() && s.cfg.engine) setTimeout(() => runEngine(), 350);
    } catch { /* illegal */ }
  };

  const runEngine = () => {
    const s = stateRef.current;
    if (!s || s.game.isGameOver()) return;
    if (s.game.turn() === s.playerColor) return;
    const m = pickEngineMove(s.game, s.cfg.elo);
    if (!m) return;
    const mv = s.game.move({ from: m.from, to: m.to, promotion: m.promotion ?? "q" });
    if (!mv) return;
    recordMove(mv);
    force(n => n + 1);
  };

  const handleSquare = (sq: string) => {
    const s = stateRef.current;
    if (!s || s.game.isGameOver()) return;
    if (viewIndex !== -1) return;
    if (s.game.turn() !== s.playerColor) return;
    const piece = s.game.get(sq as any);
    if (selected) {
      if (sq === selected) { setSelected(null); return; }
      const moves = s.game.moves({ square: selected as any, verbose: true }) as any[];
      if (moves.some(m => m.to === sq)) { onMove(selected, sq, false); return; }
      if (piece && piece.color === s.playerColor) setSelected(sq);
      else setSelected(null);
      return;
    }
    if (piece && piece.color === s.playerColor) setSelected(sq);
  };

  const resetToSetup = () => {
    stateRef.current = null;
    setCfg(null);
    setSelected(null);
    setViewIndex(-1);
    setHintArrow(null);
    setShowAnalysis(false);
  };

  const rematch = () => {
    if (!cfg) return;
    startGame(cfg);
  };

  const undoMove = () => {
    const s = stateRef.current;
    if (!s || s.sans.length === 0) return;
    // Undo until it's the player's turn again (typically 2 plies).
    const target = s.game.turn() === s.playerColor ? 2 : 1;
    for (let i = 0; i < target && s.sans.length > 0; i++) {
      s.game.undo();
      s.sans.pop();
      s.moveTimes.pop();
      s.fenHistory.pop();
      s.lastMoves.pop();
    }
    // Rebuild tracker from scratch (cheap enough).
    const t = new PieceTracker();
    t.reset(s.game);
    s.tracker = t;
    setSelected(null);
    setHintArrow(null);
    setNoAnimateOnce(true);
    force(n => n + 1);
  };

  const showHint = () => {
    const s = stateRef.current;
    if (!s || s.game.isGameOver() || s.game.turn() !== s.playerColor) return;
    const best = findBestMove(s.game, 2).move;
    if (best) setHintArrow({ from: best.from, to: best.to });
  };

  const resign = () => {
    const s = stateRef.current;
    if (!s || s.game.isGameOver()) return;
    // Force checkmate-like end by clearing legal moves: we just mark game over via FEN trick.
    // chess.js has no "resign" — simulate by setting a flag locally.
    (s as any).resigned = true;
    force(n => n + 1);
  };

  // Keyboard nav: ← / →
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const current = viewIndex === -1 ? s.sans.length - 1 : viewIndex - 1;
        if (current >= 0) { setNoAnimateOnce(true); setViewIndex(current); }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (viewIndex === -1) return;
        const next = viewIndex + 1;
        setNoAnimateOnce(true);
        setViewIndex(next >= s.sans.length - 1 ? -1 : next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewIndex]);

  // ── Idle (setup) view ────────────────────────────────────────────────
  if (!cfg || !stateRef.current) {
    return (
      <div className="px-4 w-full">
        <div className="grid gap-3 md:grid-cols-[1fr_340px] max-w-5xl mx-auto">
          <div className="flex justify-center">
            <Container className="p-2 rounded-[20px] w-full max-w-[min(100%,calc(100svh-22rem))] md:max-w-none">
              <Chessboard pieces={idlePieces} interactive={false} animate={false} />
            </Container>
          </div>
          <ChessSetupPanel onPlay={startGame} />
        </div>
      </div>
    );
  }

  // ── Active game view ─────────────────────────────────────────────────
  const s = stateRef.current;
  const orientation = s.playerColor === "w" ? "white" : "black";
  const isResigned = (s as any).resigned === true;
  const isGameOver = s.game.isGameOver() || isResigned;
  const reviewing = viewIndex !== -1;

  // Build the view position (live or historical).
  const viewGame = useMemo(() => {
    if (!reviewing) return s.game;
    try { return new Chess(s.fenHistory[viewIndex + 1]); } catch { return s.game; }
  }, [reviewing, viewIndex, s.fenHistory, s.game]);

  const pieces = reviewing
    ? (() => { const t = new PieceTracker(); t.reset(viewGame); return t.withIds(viewGame); })()
    : s.tracker.withIds(s.game);

  const legal: string[] = !reviewing && selected
    ? (s.game.moves({ square: selected as any, verbose: true }) as any[]).map(m => m.to)
    : [];

  const lastMove = reviewing
    ? (viewIndex >= 0 ? s.lastMoves[viewIndex] : null)
    : (s.lastMoves.length > 0 ? s.lastMoves[s.lastMoves.length - 1] : null);

  // Clocks
  const topClockColor: "w" | "b" = orientation === "white" ? "b" : "w";
  const bottomClockColor: "w" | "b" = orientation === "white" ? "w" : "b";
  const clockMs = (c: "w" | "b") => c === "w" ? s.whiteMs : s.blackMs;
  const showClocks = cfg.timer.baseMs > 0;
  const turn = s.game.turn();

  // Optional analysis
  const evalScore = cfg.evalBar ? evaluate(viewGame) : null;
  const suggestion = cfg.suggestionArrows && !reviewing ? findBestMove(s.game, 2).move : null;
  const threat = cfg.threatArrows && !reviewing ? findThreat(s.game) : null;
  const analysisArrows = [
    ...(suggestion ? [{ from: suggestion.from, to: suggestion.to, color: "hsl(142 70% 45% / 0.85)" }] : []),
    ...(threat ? [{ from: threat.from, to: threat.to, color: "hsl(0 75% 55% / 0.85)" }] : []),
    ...(hintArrow ? [{ from: hintArrow.from, to: hintArrow.to, color: "hsl(48 96% 53% / 0.9)" }] : []),
  ];

  const wrapperClass = settings.focusMode
    ? "fixed inset-0 z-30 flex items-center justify-center p-4 overflow-hidden bg-background"
    : "px-4 w-full";

  return (
    <div className={wrapperClass}>
      <div
        className={cn(
          "grid gap-3 md:grid-cols-[1fr_340px] mx-auto w-full",
          settings.focusMode ? "max-w-none h-full" : "max-w-5xl",
        )}
        style={settings.focusMode ? { maxHeight: "100%" } : undefined}
      >
        <div className="flex justify-center items-center min-h-0">
          <div
            className={cn(
              "flex items-stretch gap-2 w-full",
              !settings.focusMode && "max-w-[min(100%,calc(100svh-12rem))] md:max-w-none",
            )}
            style={settings.focusMode
              ? { maxWidth: "min(100%, calc(100vh - 2rem))", maxHeight: "calc(100vh - 2rem)" }
              : undefined}
          >
            {evalScore !== null && <EvalBar score={evalScore} />}
            <Container className="p-2 rounded-[20px] flex-1 min-w-0">
              <Chessboard
                pieces={pieces}
                orientation={orientation}
                selected={selected}
                legalSquares={legal}
                lastMove={lastMove}
                onSquareClick={handleSquare}
                onPieceDrop={(from, to) => onMove(from, to, true)}
                onDragBegin={(sq) => {
                  if (reviewing) return;
                  const piece = s.game.get(sq as any);
                  if (piece && piece.color === s.playerColor && s.game.turn() === s.playerColor) {
                    setSelected(sq);
                  }
                }}
                inputMode={settings.inputMode}
                arrows={analysisArrows}
                interactive={!reviewing && !isGameOver}
                animate={settings.animatePieces && !noAnimateOnce}
                animationMs={settings.animationSpeed}
              />
            </Container>
          </div>
        </div>

        <div className="flex flex-col gap-3 min-h-0">
          {showClocks && (
            <div className="grid grid-cols-2 gap-2">
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

          <div className="min-h-0 flex-1 overflow-hidden">
            <MovesList
              sans={s.sans}
              times={s.moveTimes}
              showTimes={!showClocks}
              activeIndex={reviewing ? viewIndex : s.sans.length - 1}
              onSelect={(i) => {
                setNoAnimateOnce(true);
                setViewIndex(i === s.sans.length - 1 ? -1 : i);
              }}
            />
          </div>

          {isGameOver ? (
            <>
              {showAnalysis && <GameAnalysis fens={s.fenHistory} sans={s.sans} />}
              <Button onClick={() => setShowAnalysis(v => !v)} variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                {showAnalysis ? "Hide Analysis" : "Analyse Game"}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={rematch} variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Rematch
                </Button>
                <Button onClick={resetToSetup} className="gap-2">
                  <Play className="h-4 w-4" /> New Game
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-2">
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
        </div>
      </div>
    </div>
  );
}

function EvalBar({ score }: { score: number }) {
  const clamped = Math.max(-1000, Math.min(1000, score));
  const whitePct = 50 + (clamped / 1000) * 50;
  const pawns = score / 100;
  const sign = pawns > 0 ? "+" : pawns < 0 ? "" : "";
  const label = Math.abs(pawns) >= 10 ? `${sign}${pawns.toFixed(0)}` : `${sign}${pawns.toFixed(1)}`;
  return (
    <div
      className="relative w-6 rounded-[8px] overflow-hidden bg-neutral-800 border-2 border-border flex flex-col shrink-0"
      aria-hidden
    >
      <div
        className="absolute left-0 right-0 bottom-0 bg-neutral-100 transition-[height] duration-200"
        style={{ height: `${whitePct}%` }}
      />
      <span
        className={cn(
          "absolute left-0 right-0 text-center text-[10px] font-bold font-mono leading-none",
          pawns >= 0 ? "bottom-0.5 text-neutral-900" : "top-0.5 text-neutral-100",
        )}
      >
        {label}
      </span>
    </div>
  );
}

/** Lightweight per-move eval chart shown after the game ends. */
function GameAnalysis({ fens, sans }: { fens: string[]; sans: string[] }) {
  const evals = useMemo(() => {
    const out: number[] = [];
    for (let i = 1; i < fens.length; i++) {
      try {
        const g = new Chess(fens[i]);
        out.push(evaluate(g));
      } catch { out.push(0); }
    }
    return out;
  }, [fens]);

  if (evals.length === 0) return null;
  const max = 1000;
  const width = 280;
  const height = 80;
  const stepX = evals.length > 1 ? width / (evals.length - 1) : width;
  const pts = evals
    .map((e, i) => {
      const x = i * stepX;
      const y = height / 2 - (Math.max(-max, Math.min(max, e)) / max) * (height / 2);
      return `${x},${y}`;
    })
    .join(" ");

  // Classify each move by delta vs previous eval (from mover's POV).
  const classify = (delta: number): { label: string; color: string } => {
    const a = Math.abs(delta);
    if (a < 30) return { label: "Best", color: "text-emerald-500" };
    if (a < 80) return { label: "Good", color: "text-sky-500" };
    if (a < 200) return { label: "Inaccuracy", color: "text-amber-500" };
    if (a < 400) return { label: "Mistake", color: "text-orange-500" };
    return { label: "Blunder", color: "text-red-500" };
  };

  const rows = sans.map((san, i) => {
    const prev = i === 0 ? 0 : evals[i - 1];
    const cur = evals[i];
    const moverSign = i % 2 === 0 ? 1 : -1;
    const delta = (cur - prev) * moverSign;
    return { san, delta, tag: classify(delta) };
  });

  return (
    <Container className="p-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Analysis</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20 bg-muted/40 rounded">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" strokeOpacity="0.2" />
        <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" points={pts} />
      </svg>
      <div className="max-h-32 overflow-y-auto text-xs space-y-0.5">
        {rows.map((r, i) => (
          <div key={i} className="flex justify-between gap-2 font-mono">
            <span className="opacity-60 w-8">{Math.floor(i / 2) + 1}{i % 2 === 0 ? "." : "..."}</span>
            <span className="flex-1">{r.san}</span>
            <span className={cn("font-semibold", r.tag.color)}>{r.tag.label}</span>
          </div>
        ))}
      </div>
    </Container>
  );
}
