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
import { useChessSettings } from "@/lib/chessSettings";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

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
        <div className="flex flex-col items-center gap-2">
          <Container className="p-2 rounded-[20px] w-full max-w-[min(100%,calc(100svh-12rem))] md:max-w-none">
            <Chessboard
              pieces={pieces}
              orientation={orientation}
              selected={selected}
              legalSquares={legal}
              onSquareClick={handleSquare}
              onPieceDrop={onMove}
              inputMode={settings.inputMode}
              arrows={analysisArrows}
              evalScore={evalScore}
              animate={settings.animatePieces}
              animationMs={settings.animationSpeed}
            />
          </Container>
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
        </div>
      </div>
    </div>
  );
}
