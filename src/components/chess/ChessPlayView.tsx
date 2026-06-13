import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chess/Chessboard";
import { Container } from "@/components/ui/container";
import { ChessSetupPanel, type GameConfig } from "./ChessSetupPanel";
import { ChessClock } from "./ChessClock";
import { MovesList } from "./MovesList";
import { PieceTracker } from "./chessHelpers";
import { pickEngineMove, findBestMove, findThreat, evaluate } from "@/lib/chessEngine";
import { random960Fen } from "@/lib/chess960";
import { useChessSettings, setChessSettings } from "@/lib/chessSettings";
import { Button } from "@/components/ui/button";
import { RotateCcw, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayState {
  game: Chess;
  tracker: PieceTracker;
  playerColor: "w" | "b";
  sans: string[];
  whiteMs: number;
  blackMs: number;
  cfg: GameConfig;
}

export function ChessPlayView() {
  const [settings] = useChessSettings();
  const [cfg, setCfg] = useState<GameConfig | null>(null);
  const [, force] = useState(0);
  const stateRef = useRef<PlayState | null>(null);
  const lastTickRef = useRef<number>(0);
  const [selected, setSelected] = useState<string | null>(null);

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
    stateRef.current = {
      game, tracker, playerColor, sans: [],
      whiteMs: gc.timer.baseMs, blackMs: gc.timer.baseMs, cfg: gc,
    };
    lastTickRef.current = performance.now();
    setCfg(gc);
    setSelected(null);
    force(n => n + 1);
    if (playerColor === "b") setTimeout(runEngine, 400);
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

  const onMove = (from: string, to: string) => {
    const s = stateRef.current;
    if (!s || s.game.isGameOver()) return;
    if (s.game.turn() !== s.playerColor) return;
    try {
      const mv = s.game.move({ from, to, promotion: "q" });
      if (!mv) return;
      s.tracker.applyMove(mv as any);
      s.sans.push(mv.san);
      // Add increment for the side that just moved.
      if (s.cfg.timer.incMs && s.cfg.timer.baseMs > 0) {
        if (mv.color === "w") s.whiteMs += s.cfg.timer.incMs;
        else s.blackMs += s.cfg.timer.incMs;
      }
      setSelected(null);
      force(n => n + 1);
      if (!s.game.isGameOver() && s.cfg.engine) setTimeout(runEngine, 350);
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
    s.tracker.applyMove(mv as any);
    s.sans.push(mv.san);
    if (s.cfg.timer.incMs && s.cfg.timer.baseMs > 0) {
      if (mv.color === "w") s.whiteMs += s.cfg.timer.incMs;
      else s.blackMs += s.cfg.timer.incMs;
    }
    force(n => n + 1);
  };

  const handleSquare = (sq: string) => {
    const s = stateRef.current;
    if (!s || s.game.isGameOver()) return;
    if (s.game.turn() !== s.playerColor) return;
    const piece = s.game.get(sq as any);
    if (selected) {
      if (sq === selected) { setSelected(null); return; }
      // try move; if illegal, try selecting new own piece
      const moves = s.game.moves({ square: selected as any, verbose: true }) as any[];
      if (moves.some(m => m.to === sq)) { onMove(selected, sq); return; }
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
  };

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
  const pieces = s.tracker.withIds(s.game);
  const orientation = s.playerColor === "w" ? "white" : "black";
  const legal: string[] = selected
    ? (s.game.moves({ square: selected as any, verbose: true }) as any[]).map(m => m.to)
    : [];

  // White clock below board, Black clock above (flips with orientation).
  const topClockColor: "w" | "b" = orientation === "white" ? "b" : "w";
  const bottomClockColor: "w" | "b" = orientation === "white" ? "w" : "b";
  const clockMs = (c: "w" | "b") => c === "w" ? s.whiteMs : s.blackMs;
  const showClocks = cfg.timer.baseMs > 0;
  const turn = s.game.turn();

  // Optional analysis arrows + eval bar (computed only when toggled on).
  const evalScore = cfg.evalBar ? evaluate(s.game) : null;
  const suggestion = cfg.suggestionArrows ? findBestMove(s.game, 2).move : null;
  const threat = cfg.threatArrows ? findThreat(s.game) : null;
  const analysisArrows = [
    ...(suggestion ? [{ from: suggestion.from, to: suggestion.to, color: "hsl(142 70% 45% / 0.85)" }] : []),
    ...(threat ? [{ from: threat.from, to: threat.to, color: "hsl(0 75% 55% / 0.85)" }] : []),
  ];

  return (
    <div className="px-4 w-full">
      <div className="grid gap-3 md:grid-cols-[1fr_340px] max-w-5xl mx-auto">
        <div className="flex justify-center">
          <div className="flex items-stretch gap-2 w-full max-w-[min(100%,calc(100svh-12rem))] md:max-w-none">
            {evalScore !== null && <EvalBar score={evalScore} />}
            <Container className="p-2 rounded-[20px] flex-1 min-w-0">
              <Chessboard
                pieces={pieces}
                orientation={orientation}
                selected={selected}
                legalSquares={legal}
                onSquareClick={handleSquare}
                onPieceDrop={onMove}
                onDragBegin={(sq) => {
                  const piece = s.game.get(sq as any);
                  if (piece && piece.color === s.playerColor && s.game.turn() === s.playerColor) {
                    setSelected(sq);
                  }
                }}
                inputMode={settings.inputMode}
                arrows={analysisArrows}
                animate={settings.animatePieces}
                animationMs={settings.animationSpeed}
              />
            </Container>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {showClocks && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider opacity-60 text-center">
                  {orientation === "white" ? "Black" : "White"}
                </p>
                <ChessClock ms={clockMs(topClockColor)} active={turn === topClockColor} low />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider opacity-60 text-center">
                  {orientation === "white" ? "White" : "Black"}
                </p>
                <ChessClock ms={clockMs(bottomClockColor)} active={turn === bottomClockColor} low />
              </div>
            </div>
          )}
          <MovesList sans={s.sans} />
          {s.game.isGameOver() && (
            <Container className="p-3 text-sm font-semibold text-center">
              {s.game.isCheckmate() ? "Checkmate" : s.game.isStalemate() ? "Stalemate" : "Draw"}
            </Container>
          )}
          <Button onClick={resetToSetup} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" /> New setup
          </Button>
          <Button
            onClick={() => setChessSettings({ focusMode: !settings.focusMode })}
            variant="outline"
            className="gap-2"
          >
            {settings.focusMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {settings.focusMode ? "Exit Focus Mode" : "Focus Mode"}
          </Button>
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

