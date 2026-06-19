import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chess/Chessboard";
import { Container } from "@/components/ui/container";
import { ChessSetupPanel, type GameConfig } from "./ChessSetupPanel";
import { ChessClock } from "./ChessClock";
import { MovesList, type MoveVariation, type VariationCursor } from "./MovesList";
import { MoveDetailPanel } from "./MoveDetailPanel";
import { PieceTracker } from "./chessHelpers";
import { pickEngineMove, findBestMove, findThreat, evaluate } from "@/lib/chessEngine";
import { random960Fen } from "@/lib/chess960";
import { useChessSettings } from "@/lib/chessSettings";
import { Button } from "@/components/ui/button";
import { Flag, Undo2, Lightbulb, Play, RotateCcw, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { analyseGame, summarisePlayer, type PerMove } from "./analysis/classification";
import { AnalysisReport } from "./analysis/AnalysisReport";

// Tiny single-slot caches keyed by FEN so expensive engine calls don't
// re-run on every render (e.g. clock ticks).
class FenCache<T> {
  private key: string | null = null;
  private val: T | null = null;
  get(k: string): T | null { return this.key === k ? this.val : null; }
  set(k: string, v: T): T { this.key = k; this.val = v; return v; }
}
const evalCache = new FenCache<number>();
const bestCache = new FenCache<ReturnType<typeof findBestMove>["move"]>();
const threatCache = new FenCache<ReturnType<typeof findThreat>>();

interface VariationData extends MoveVariation {
  fens: string[];               // fens from parent position onward; length = sans.length + 1
  lastMoves: Array<{ from: string; to: string }>;
}

interface PlayState {
  game: Chess;
  tracker: PieceTracker;
  playerColor: "w" | "b";
  sans: string[];
  moveTimes: number[];
  fenHistory: string[];
  lastMoves: Array<{ from: string; to: string }>;
  whiteMs: number;
  blackMs: number;
  cfg: GameConfig;
  startedAt: number;
  lastMoveAt: number;
  variations: VariationData[];
}

// ────────────────────────── audio ─────────────────────────────
let audioCtx: AudioContext | null = null;
function playMoveSound(kind: "move" | "capture" = "move") {
  try {
    audioCtx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.value = kind === "capture" ? 220 : 380;
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch { /* noop */ }
}

export function ChessPlayView() {
  const [settings] = useChessSettings();
  const [cfg, setCfg] = useState<GameConfig | null>(null);
  const [, force] = useState(0);
  const stateRef = useRef<PlayState | null>(null);
  const lastTickRef = useRef<number>(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [viewIndex, setViewIndex] = useState<number>(-1); // -1 = live (or before any move if 0 sans)
  const [varCursor, setVarCursor] = useState<VariationCursor | null>(null);
  const [hintArrow, setHintArrow] = useState<{ from: string; to: string } | null>(null);
  const [analysisView, setAnalysisView] = useState<"play" | "analysis" | "review">("play");
  const [perMove, setPerMove] = useState<PerMove[] | null>(null);
  const [analysing, setAnalysing] = useState<{ done: number; total: number } | null>(null);
  const [noAnimateOnce, setNoAnimateOnce] = useState(false);
  const [premoves, setPremoves] = useState<Array<{ from: string; to: string; promotion?: string }>>([]);

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

  useEffect(() => {
    if (noAnimateOnce) {
      const id = requestAnimationFrame(() => setNoAnimateOnce(false));
      return () => cancelAnimationFrame(id);
    }
  }, [noAnimateOnce]);

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
  }, []);

  // Try to make a move during review (creates / extends a variation).
  const tryVariationMove = (from: string, to: string): boolean => {
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
    setNoAnimateOnce(true);
    force(n => n + 1);
    return true;
  };

  const onMove = (from: string, to: string, viaDrag = false) => {
    const s = stateRef.current;
    if (!s) return;
    const live = viewIndex === -1 && varCursor == null;
    if (!live) {
      // Reviewing — branch into a variation.
      tryVariationMove(from, to);
      return;
    }
    if (s.game.isGameOver()) return;
    if (s.game.turn() !== s.playerColor) {
      // Not our turn → queue a premove (FIFO, validated against projected board).
      queuePremove(from, to);
      return;
    }
    try {
      const mv = s.game.move({ from, to, promotion: "q" });
      if (!mv) return;
      recordMainlineMove(mv);
      setSelected(null);
      setHintArrow(null);
      if (viaDrag) setNoAnimateOnce(true);
      force(n => n + 1);
      if (!s.game.isGameOver() && s.cfg.engine) setTimeout(() => runEngine(), 350);
    } catch { /* illegal */ }
  };

  // ── Premoves ──────────────────────────────────────────────────────
  // FIFO queue, capped, validated against the projected board.
  const PREMOVE_LIMIT = 5;
  const projectedBoard = useCallback((extra?: { from: string; to: string; promotion?: string }) => {
    const s = stateRef.current;
    if (!s) return null;
    const g = new Chess(s.game.fen());
    for (const pm of premoves) {
      try { g.move({ from: pm.from, to: pm.to, promotion: pm.promotion ?? "q" }); }
      catch { return null; }
    }
    if (extra) {
      try { g.move({ from: extra.from, to: extra.to, promotion: extra.promotion ?? "q" }); }
      catch { return null; }
    }
    return g;
  }, [premoves]);

  const queuePremove = (from: string, to: string) => {
    const s = stateRef.current;
    if (!s) return;
    if (premoves.length >= PREMOVE_LIMIT) return;
    // Quick ownership check on the projected board.
    const projected = projectedBoard();
    if (!projected) return;
    const piece = projected.get(from as any);
    if (!piece || piece.color !== s.playerColor) return;
    // Validate move on the projected board.
    const next = new Chess(projected.fen());
    try {
      const mv = next.move({ from, to, promotion: "q" });
      if (!mv) return;
    } catch { return; }
    setPremoves(prev => [...prev, { from, to }]);
    setSelected(null);
  };

  const cancelPremoves = useCallback(() => setPremoves([]), []);

  const tryPlayPremove = () => {
    const s = stateRef.current;
    if (!s || premoves.length === 0) return;
    if (s.game.isGameOver() || s.game.turn() !== s.playerColor) return;
    const [head, ...rest] = premoves;
    try {
      const mv = s.game.move({ from: head.from, to: head.to, promotion: head.promotion ?? "q" });
      if (!mv) { setPremoves([]); return; }
      recordMainlineMove(mv);
      setPremoves(rest);
      setNoAnimateOnce(true);
      force(n => n + 1);
      if (!s.game.isGameOver() && s.cfg.engine) setTimeout(() => runEngine(), 350);
    } catch { setPremoves([]); }
  };

  const runEngine = () => {
    const s = stateRef.current;
    if (!s || s.game.isGameOver()) return;
    if (s.game.turn() === s.playerColor) return;
    const m = pickEngineMove(s.game, s.cfg.elo);
    if (!m) return;
    const mv = s.game.move({ from: m.from, to: m.to, promotion: m.promotion ?? "q" });
    if (!mv) return;
    recordMainlineMove(mv);
    force(n => n + 1);
    // Attempt to execute queued premove right after engine's response.
    setTimeout(() => tryPlayPremove(), 30);
  };

  // Compute current viewing position.
  const computeView = () => {
    const s = stateRef.current!;
    if (varCursor) {
      const v = s.variations[varCursor.varIndex];
      return { fen: v.fens[varCursor.step + 1], lastMove: v.lastMoves[varCursor.step] };
    }
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
      // Allow click-to-move on the reviewed position.
      const view = computeView();
      let g: Chess;
      try { g = new Chess(view.fen); } catch { return; }
      const piece = g.get(sq as any);
      if (selected) {
        if (sq === selected) { setSelected(null); return; }
        const moves = g.moves({ square: selected as any, verbose: true }) as any[];
        if (moves.some(m => m.to === sq)) { tryVariationMove(selected, sq); return; }
        if (piece) setSelected(sq); else setSelected(null);
        return;
      }
      if (piece) setSelected(sq);
      return;
    }
    if (s.game.isGameOver()) return;
    const myTurn = s.game.turn() === s.playerColor;
    const piece = s.game.get(sq as any);
    if (selected) {
      if (sq === selected) { setSelected(null); return; }
      if (myTurn) {
        const moves = s.game.moves({ square: selected as any, verbose: true }) as any[];
        if (moves.some(m => m.to === sq)) { onMove(selected, sq, false); return; }
        if (piece && piece.color === s.playerColor) setSelected(sq);
        else setSelected(null);
        return;
      }
      // Opponent's turn → queue premove if click target is reasonable
      const own = s.game.get(selected as any);
      if (own && own.color === s.playerColor && sq !== selected) {
        queuePremove(selected, sq);
        return;
      }
      setSelected(null);
      return;
    }
    if (piece && piece.color === s.playerColor) {
      setSelected(sq);
    }
  };

  const resetToSetup = () => {
    stateRef.current = null;
    setCfg(null);
    setSelected(null);
    setViewIndex(-1);
    setVarCursor(null);
    setHintArrow(null);
    setAnalysisView("play");
    setPerMove(null);
    setPremoves([]);
  };

  const rematch = () => { if (cfg) startGame(cfg); };

  const undoMove = () => {
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
        if (varCursor) {
          if (varCursor.step > 0) setVarCursor({ ...varCursor, step: varCursor.step - 1 });
          else { setVarCursor(null); setViewIndex(s.variations[varCursor.varIndex].parentIndex); }
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
            setVarCursor({ ...varCursor, step: varCursor.step + 1 });
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

  const s = stateRef.current;
  const orientation = s.playerColor === "w" ? "white" : "black";
  const isResigned = (s as any).resigned === true;
  const isGameOver = s.game.isGameOver() || isResigned;
  const live = viewIndex === -1 && varCursor == null;
  const reviewing = !live;

  const view = computeView();
  let viewGame: Chess = s.game;
  try { viewGame = new Chess(view.fen); } catch { /* keep live */ }
  const pieces = reviewing
    ? (() => { const t = new PieceTracker(); t.reset(viewGame); return t.withIds(viewGame); })()
    : s.tracker.withIds(s.game);

  const legal: string[] = selected
    ? (viewGame.moves({ square: selected as any, verbose: true }) as any[]).map((m: any) => m.to)
    : [];

  const lastMove = view.lastMove;

  const topClockColor: "w" | "b" = orientation === "white" ? "b" : "w";
  const bottomClockColor: "w" | "b" = orientation === "white" ? "w" : "b";
  const clockMs = (c: "w" | "b") => c === "w" ? s.whiteMs : s.blackMs;
  const showClocks = cfg.timer.baseMs > 0;
  const turn = s.game.turn();

  const liveFen = s.game.fen();
  const evalScore = cfg.evalBar ? evalCache.get(view.fen) ?? evalCache.set(view.fen, evaluate(viewGame)) : null;
  const suggestion = cfg.suggestionArrows && live
    ? bestCache.get(liveFen) ?? bestCache.set(liveFen, findBestMove(s.game, 2).move) : null;
  const threat = cfg.threatArrows && live
    ? threatCache.get(liveFen) ?? threatCache.set(liveFen, findThreat(s.game)) : null;
  const analysisArrows = [
    ...(suggestion ? [{ from: suggestion.from, to: suggestion.to, color: "hsl(142 70% 45% / 0.85)" }] : []),
    ...(threat ? [{ from: threat.from, to: threat.to, color: "hsl(0 75% 55% / 0.85)" }] : []),
    ...(hintArrow ? [{ from: hintArrow.from, to: hintArrow.to, color: "hsl(48 96% 53% / 0.9)" }] : []),
    ...(live ? premoves.map(pm => ({ from: pm.from, to: pm.to, color: "hsl(0 80% 55% / 0.85)" })) : []),
  ];

  const wrapperClass = settings.focusMode
    ? "fixed inset-0 z-30 flex items-center justify-center p-4 overflow-hidden bg-background"
    : "px-4 w-full";

  // Compute current ply index for chart / detail panel.
  const currentPly = varCursor
    ? s.variations[varCursor.varIndex].parentIndex // chart highlights the branch parent
    : (viewIndex === -1 ? s.sans.length - 1 : viewIndex);

  // Build classification badge for the board overlay (only in review).
  const reviewBadge = analysisView === "review" && perMove && reviewing && !varCursor && lastMove
    ? { square: lastMove.to, kind: perMove[viewIndex].kind }
    : null;

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
            {evalScore !== null && analysisView !== "analysis" && <EvalBar score={evalScore} />}
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
                  if (reviewing) { setSelected(sq); return; }
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
                premoveSquares={live ? premoves.flatMap(pm => [pm.from, pm.to]) : []}
                onCancelPremoves={cancelPremoves}
              />
            </Container>
          </div>
        </div>

        <div className="flex flex-col gap-3 min-h-0">
          {showClocks && analysisView !== "analysis" && (
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

          {analysisView === "analysis" && isGameOver && perMove ? (
            <div className="min-h-0 flex-1 overflow-hidden">
              <AnalysisReport
                perMove={perMove}
                fens={s.fenHistory}
                white={summarisePlayer(perMove, "w")}
                black={summarisePlayer(perMove, "b")}
                currentIndex={currentPly}
                onSelect={(i) => {
                  setVarCursor(null);
                  setNoAnimateOnce(true);
                  setViewIndex(i >= s.sans.length - 1 ? -1 : i);
                }}
                onReview={() => setAnalysisView("review")}
              />
            </div>
          ) : (
            <>
              <MoveDetailPanel
                sans={s.sans}
                fens={s.fenHistory}
                currentIndex={currentPly}
                perMove={analysisView === "review" ? perMove ?? undefined : undefined}
                showBestLine={analysisView === "review"}
                orientation={orientation}
                onSelect={(i) => {
                  setVarCursor(null);
                  setNoAnimateOnce(true);
                  setViewIndex(i >= s.sans.length - 1 ? -1 : i);
                }}
              />

              <div className="min-h-0 flex-1 overflow-hidden">
                <MovesList
                  sans={s.sans}
                  times={s.moveTimes}
                  showTimes={showClocks}
                  activeIndex={varCursor ? -1 : (live ? s.sans.length - 1 : viewIndex)}
                  classifications={analysisView === "review" ? perMove?.map(m => m.kind) : undefined}
                  variations={s.variations}
                  activeCursor={varCursor}
                  onSelect={(i) => {
                    setVarCursor(null);
                    setNoAnimateOnce(true);
                    setViewIndex(i === s.sans.length - 1 ? -1 : i);
                  }}
                  onSelectVariation={(c) => {
                    setNoAnimateOnce(true);
                    setVarCursor(c);
                  }}
                />
              </div>

              {isGameOver && analysisView === "play" && (
                <>
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
                    className="gap-2"
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
                </>
              )}

              {isGameOver && analysisView === "review" && (
                <Button onClick={() => setAnalysisView("analysis")} variant="outline" className="gap-2">
                  <BarChart3 className="h-4 w-4" /> Show Report Card
                </Button>
              )}

              {!isGameOver && (
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
            </>
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
