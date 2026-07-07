import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/Component/Chess/Chessboard";
import { Container } from "@/Component/UI/container";
import { ChessSetupPanel, type GameConfig } from "./ChessSetupPanel";
import { ChessClock } from "./ChessClock";
import { MovesList, type MoveVariation, type VariationCursor } from "./MovesList";
import { MoveDetailPanel } from "./MoveDetailPanel";
import { PieceTracker } from "./chessHelpers";
import { pickEngineMove, findBestMove, findThreat, evaluate } from "@/Library/chessEngine";
import { sfBestMove } from "@/Library/stockfish";
import { random960Fen } from "@/Library/chess960";
import { useChessSettings } from "@/Library/chessSettings";
import { Button } from "@/Component/UI/button";
import { Flag, Undo2, Lightbulb, Play, RotateCcw, BarChart3 } from "lucide-react";
import { cn } from "@/Library/utils";
import { analyseGame, summarisePlayer, type PerMove } from "./analysis/classification";
// Lazy-load the heavy Highcharts-powered report so it doesn't bloat the
// initial play-view bundle or re-render on every clock tick.
const AnalysisReport = lazy(() => import("./analysis/AnalysisReport").then(m => ({ default: m.AnalysisReport })));

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
const ENGINE_REPLY_DELAY_MS = 10000;

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
  const [refreshCounter, force] = useState(0);
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
  const premovesRef = useRef<typeof premoves>([]);
  useEffect(() => { premovesRef.current = premoves; }, [premoves]);

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
  const tryVariationMove = (from: string, to: string, viaDrag = false): boolean => {
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
  };

  const onMove = (from: string, to: string, viaDrag = false) => {
    const s = stateRef.current;
    if (!s) return;
    const live = viewIndex === -1 && varCursor == null;
    if (!live) {
      // Reviewing — branch into a variation.
      tryVariationMove(from, to, viaDrag);
      return;
    }
    if (s.game.isGameOver()) return;
    if (s.game.turn() !== s.playerColor) {
      // Not our turn → queue a premove (FIFO, validated against projected board).
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
      force(n => n + 1);
      if (!s.game.isGameOver() && s.cfg.engine) setTimeout(() => runEngine(), ENGINE_REPLY_DELAY_MS);
    } catch { /* illegal */ }
  };

  function applyPremoveToFen(
  fen: string, from: string, to: string, promotion: string, playerColor: "w" | "b",
): { fen: string; hiddenKingSquare: string | null } {
  const parts = fen.split(" ");
  const board = boardFromFen(fen);
  const { file: fFile, rank: fRank } = sqToRC(from);
  const { file: tFile, rank: tRank } = sqToRC(to);
  const piece = board[fRank][fFile]!;
  const captured = board[tRank][tFile];

  let hiddenKingSquare: string | null = null;

  // En passant: captured pawn sits beside the destination, not on it.
  if (piece.type === "p" && fFile !== tFile && !captured) {
    board[fRank][tFile] = null;
  }

  // King capture: chess.js requires exactly one king per side to even load
  // the FEN, so we can't simply delete it. Park it on the first empty
  // square instead — invisible to the renderer, but keeps the position
  // loadable so chess.js can keep generating moves for chained premoves.
  if (captured?.type === "k") {
    outer:
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        if (r === tRank && f === tFile) continue;
        if (board[r][f]) continue;
        board[r][f] = captured;
        hiddenKingSquare = `${"abcdefgh"[f]}${r + 1}`;
        break outer;
      }
    }
  }

  board[fRank][fFile] = null;
  board[tRank][tFile] = piece.type === "p" && (tRank === 0 || tRank === 7)
    ? { type: promotion, color: piece.color }
    : piece;

  if (piece.type === "k" && Math.abs(tFile - fFile) === 2) {
    const kingside = tFile > fFile;
    const rookFromFile = kingside ? 7 : 0;
    const rookToFile = kingside ? tFile - 1 : tFile + 1;
    board[tRank][rookToFile] = board[tRank][rookFromFile];
    board[tRank][rookFromFile] = null;
  }

  const placement = Array.from({ length: 8 }, (_, rIdx) => {
    const rank = 7 - rIdx;
    let row = "", empty = 0;
    for (let file = 0; file < 8; file++) {
      const p = board[rank][file];
      if (!p) { empty++; continue; }
      if (empty) { row += empty; empty = 0; }
      row += p.color === "w" ? p.type.toUpperCase() : p.type.toLowerCase();
    }
    if (empty) row += empty;
    return row;
  }).join("/");

  parts[0] = placement;
  parts[1] = playerColor === "w" ? "b" : "w";
  parts[3] = "-";
  return { fen: parts.join(" "), hiddenKingSquare };
}
  // ── Premoves ──────────────────────────────────────────────────────
  // FIFO queue, capped, validated against the projected board.
  // ── Premoves ──────────────────────────────────────────────────────
  // FIFO queue, validated against the projected board.
  const projectedBoard = useCallback((extra?: { from: string; to: string; promotion?: string }) => {
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
}, [premoves]);

type Board = (null | { type: string; color: "w" | "b" })[][]; // [rank0..7][file0..7], rank0 = rank "1"

function sqToRC(sq: string) {
  return { file: sq.charCodeAt(0) - 97, rank: parseInt(sq[1], 10) - 1 };
}

function boardFromFen(fen: string): Board {
  const placement = fen.split(" ")[0];
  const rows = placement.split("/"); // rows[0] = rank 8 ... rows[7] = rank 1
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  rows.forEach((row, rIdx) => {
    const rank = 7 - rIdx; // rank index 0..7 for ranks 1..8
    let file = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { file += parseInt(ch, 10); continue; }
      const color = ch === ch.toUpperCase() ? "w" : "b";
      board[rank][file] = { type: ch.toLowerCase(), color };
      file++;
    }
  });
  return board;
}

function pathClear(board: Board, fFile: number, fRank: number, tFile: number, tRank: number): boolean {
  const dFile = Math.sign(tFile - fFile);
  const dRank = Math.sign(tRank - fRank);
  let file = fFile + dFile, rank = fRank + dRank;
  while (file !== tFile || rank !== tRank) {
    if (board[rank][file]) return false;
    file += dFile; rank += dRank;
  }
  return true;
}

// Castling rights / en passant target pulled straight from FEN fields 3 and 4.
function isPremoveLegal(
  boardFen: string,
  from: string,
  to: string,
  playerColor: "w" | "b",
): boolean {
  const [, , castling, epTarget] = boardFen.split(" ");
  const board = boardFromFen(boardFen);
  const { file: fFile, rank: fRank } = sqToRC(from);
  const { file: tFile, rank: tRank } = sqToRC(to);
  if (fFile === tFile && fRank === tRank) return false;

  const piece = board[fRank][fFile];
  if (!piece || piece.color !== playerColor) return false;

  const target = board[tRank][tFile];

  const dFile = tFile - fFile, dRank = tRank - fRank;

  switch (piece.type) {
    case "n":
      return (Math.abs(dFile) === 1 && Math.abs(dRank) === 2) ||
             (Math.abs(dFile) === 2 && Math.abs(dRank) === 1);

    case "b":
      if (Math.abs(dFile) !== Math.abs(dRank)) return false;
      return pathClear(board, fFile, fRank, tFile, tRank);

    case "r":
      if (dFile !== 0 && dRank !== 0) return false;
      return pathClear(board, fFile, fRank, tFile, tRank);

    case "q":
      if (dFile !== 0 && dRank !== 0 && Math.abs(dFile) !== Math.abs(dRank)) return false;
      return pathClear(board, fFile, fRank, tFile, tRank);

    case "k": {
      if (Math.abs(dFile) <= 1 && Math.abs(dRank) <= 1) return true;
      // Castling: king moves two squares along its home rank.
      if (Math.abs(dFile) === 2 && dRank === 0) {
        const homeRank = playerColor === "w" ? 0 : 7;
        if (fRank !== homeRank || tRank !== homeRank) return false;
        const kingside = dFile > 0;
        const rightChar = playerColor === "w"
          ? (kingside ? "K" : "Q")
          : (kingside ? "k" : "q");
        if (!castling.includes(rightChar)) return false;
        const rookFile = kingside ? 7 : 0;
        const rook = board[homeRank][rookFile];
        if (!rook || rook.type !== "r" || rook.color !== playerColor) return false;
        // Squares between king and rook must be empty.
        return pathClear(board, fFile, fRank, rookFile, homeRank);
      }
      return false;
    }

    case "p": {
      const dir = playerColor === "w" ? 1 : -1;
      const startRank = playerColor === "w" ? 1 : 6;
      // Forward move (no capture).
      if (dFile === 0) {
        if (target) return false;
        if (dRank === dir) return true;
        if (dRank === 2 * dir && fRank === startRank) {
          const midRank = fRank + dir;
          return !board[midRank][fFile];
        }
        return false;
      }
      // Diagonal: normal capture, speculative recapture of own piece, or en passant.
      if (Math.abs(dFile) === 1 && dRank === dir) {
        if (target) return true; // any occupant, including a king — geometry only
        // En passant: target square empty, but matches the FEN ep target.
        if (epTarget && epTarget !== "-") {
          return to === epTarget;
        }
        return false;
      }
      return false;
    }

    default:
      return false;
  }
}

  const queuePremove = (from: string, to: string, viaDrag = false) => {
    const s = stateRef.current;
    if (!s) return;
    const projected = projectedBoard();
    if (!projected) return;
    const piece = projected.get(from as any);
    if (!piece || piece.color !== s.playerColor) return;
    if (!isPremoveLegal(projected.fen(), from, to, s.playerColor)) return;
    setPremoves(prev => [...prev, { from, to }]);
    setSelected(null);
    if (viaDrag) setNoAnimateOnce(true);
  };
  const cancelPremoves = useCallback(() => setPremoves([]), []);

  const tryPlayPremove = () => {
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
      if (!s.game.isGameOver() && s.cfg.engine) setTimeout(() => runEngine(), ENGINE_REPLY_DELAY_MS);
    } catch { setPremoves([]); }
  };

  const runEngine = async () => {
    const s = stateRef.current;
    if (!s || s.game.isGameOver()) return;
    if (s.game.turn() === s.playerColor) return;
    const fenBefore = s.game.fen();
    const elo = s.cfg.elo;
    // Strength mapping: true beginner < 800; Stockfish UCI_Elo only from 1320.
    let sfOpts: { depth?: number; movetimeMs?: number; skill?: number; uciElo?: number };
    let randomChance = 0;
    if (elo <= 400) {
      sfOpts = { skill: 0, movetimeMs: 50, depth: 1 };
      randomChance = elo <= 150 ? 0.55 : elo <= 250 ? 0.35 : 0.18;
    } else if (elo < 800) {
      sfOpts = { skill: Math.max(0, Math.round((elo - 400) / 80)), movetimeMs: 80 };
      randomChance = 0.08;
    } else if (elo < 1320) {
      sfOpts = { skill: Math.round((elo - 800) / 60), movetimeMs: 150 };
    } else {
      sfOpts = { uciElo: Math.min(3190, elo), movetimeMs: Math.min(1500, 200 + (elo - 1320) * 0.6) };
    }
    let from: string | undefined, to: string | undefined, promotion: string | undefined;
    try {
      // Beginner randomness: sometimes play a random legal move.
      if (randomChance > 0 && Math.random() < randomChance) {
        const moves = s.game.moves({ verbose: true }) as Array<{ from: string; to: string; promotion?: string }>;
        if (moves.length) {
          const m = moves[Math.floor(Math.random() * moves.length)];
          from = m.from; to = m.to; promotion = m.promotion;
        }
      }
      if (!from) {
        const { bestMove } = await sfBestMove(fenBefore, sfOpts);
        if (!bestMove) throw new Error("no bestmove");
        from = bestMove.slice(0, 2);
        to = bestMove.slice(2, 4);
        promotion = bestMove.length > 4 ? bestMove[4] : undefined;
      }
    } catch {
      const m = pickEngineMove(s.game, s.cfg.elo);
      if (!m) return;
      from = m.from; to = m.to; promotion = m.promotion;
    }
    // Position may have changed (player undo, new game, etc.) — bail out.
    if (s.game.fen() !== fenBefore) return;
    let mv: any;
    try { mv = s.game.move({ from, to, promotion: promotion ?? "q" }); } catch { return; }
    if (!mv) return;
    recordMainlineMove(mv);
    force(n => n + 1);
    // Attempt to execute queued premove right after engine's response.
    // If it's now illegal, clear the whole queue.
    setTimeout(() => {
      const st = stateRef.current;
      if (!st) return;
      const queue = premovesRef.current;
      if (queue.length === 0) return;
      const head = queue[0];
      try {
        const test = new Chess(st.game.fen());
        const probe = test.move({ from: head.from, to: head.to, promotion: head.promotion ?? "q" });
        if (!probe) { setPremoves([]); return; }
      } catch { setPremoves([]); return; }
      tryPlayPremove();
    }, 30);
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
        if (sq === selected) return; // selection persists; only right-click clears
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
    // On the player's own turn, piece lookups use the live board. On the
    // opponent's turn (premoving), lookups use the *projected* board, since
    // that's where pieces visually sit after queued premoves — otherwise
    // you can never select a piece that only exists on a square because of
    // an earlier queued premove, which is exactly what was blocking chaining.
    const piece = myTurn ? s.game.get(sq as any) : proj?.get(sq as any);
    if (selected) {
      if (sq === selected) return; // selection persists; only right-click clears
      if (myTurn) {
        const moves = s.game.moves({ square: selected as any, verbose: true }) as any[];
        if (moves.some(m => m.to === sq)) { onMove(selected, sq, false); return; }
        if (piece && piece.color === s.playerColor) setSelected(sq);
        return;
      }
      // Opponent's turn → either queue a premove, or reselect another own piece.
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

  const s = stateRef.current;
  const hasActiveGame = !!cfg && !!s;
  const live = hasActiveGame ? viewIndex === -1 && varCursor == null : true;
  const reviewing = hasActiveGame ? !live : false;
  const view = hasActiveGame ? computeView() : null;

  // These hooks must run for both the setup screen and the active game.
  // The setup screen used to return before them, then starting a game added
  // more hooks on the next render, which triggers React error #310.
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
    // s.tracker is mutated in place; key on liveFenForPieces so we recompute
    // whenever the live position actually changes (not every clock tick).
    // refreshCounter is intentionally NOT a dependency — it's bumped every
    // 100ms by the clock-tick interval, and including it here was causing
    // this memo (and therefore every piece <img>'s key) to be rebuilt 10x/sec,
    // which remounted pieces mid-drag and broke pointer capture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, reviewing, viewGame, liveFenForPieces, idlePieces]);

  // Memoized projected pieces (post-premove) — avoid recomputing every render
  // (clock ticks, etc.) which caused noticeable lag while premoves were queued.
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
  const pieces: any[] = [];
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const p = board[rank][file];
      if (!p) continue;
      const square = `${"abcdefgh"[file]}${rank + 1}`;
      if (hiddenSquares.has(square)) continue; // parked king(s) — not rendered
      if (!(t as any).ids.has(square)) (t as any).ids.set(square, `p${(t as any).nextId++}`);
      pieces.push({ square, color: p.color, type: p.type.toUpperCase(), id: (t as any).ids.get(square) });
    }
  }
  return pieces;
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [s, live, premoveKey, liveFenForPieces]);

  // Legal squares for the selected piece. During the opponent's turn we
  // compute on the projected (post-premove) board with the side-to-move
  // forced to the player's color, so premove dots show normally.
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
        // Also surface our own piece squares as valid premove dots, if a
        // speculative recapture there would be legal once vacated.
        const ownSquares = (proj.board().flat().filter(Boolean) as any[])
          .filter(p => p.color === s.playerColor)
          .map(p => p.square)
          .filter(sq => sq !== selected && !normal.includes(sq))
          .filter(sq => isPremoveLegal(fen, selected!, sq, s.playerColor));
        return [...normal, ...ownSquares];
      } catch { return []; }
    }
    return (viewGame.moves({ square: selected as any, verbose: true }) as any[]).map((m: any) => m.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, selected, live, viewGame, premoveKey, projectedBoard]);

  // Stable premoveSquares array — only changes identity when the premove
  // queue itself changes (not on every clock-tick re-render). This is what
  // was breaking BoardGrid's memo: previously this was an inline
  // `.flatMap(...)` literal recreated every 100ms by the clock tick, which
  // forced BoardGrid (all 64 squares) to bail memoization and fully
  // re-render on every tick — that's the lag, and the extra churn around it
  // is what made the premove tint paint unreliably.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [suggestion, threat, hintArrow, live, premoveKey]);

  const lastMove = view?.lastMove ?? null;

  // ── Idle (setup) view ────────────────────────────────────────────────
  if (!cfg || !s) {
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

  const orientation = s.playerColor === "w" ? "white" : "black";
  const isResigned = (s as any).resigned === true;
  const isGameOver = s.game.isGameOver() || isResigned;


  const topClockColor: "w" | "b" = orientation === "white" ? "b" : "w";
  const bottomClockColor: "w" | "b" = orientation === "white" ? "w" : "b";
  const clockMs = (c: "w" | "b") => c === "w" ? s.whiteMs : s.blackMs;
  const showClocks = cfg.timer.baseMs > 0;
  const turn = s.game.turn();

  const liveFen = s.game.fen();

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
                    // Opponent's turn: a piece may only "exist" on this
                    // square because of a queued premove — look it up on
                    // the projected (post-premove) board, not the live one.
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
              <Suspense fallback={<div className="p-4 text-sm opacity-70">Loading report…</div>}>
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
              </Suspense>
            </div>
          ) : (
            <>
              {(cfg.moveFeedback || analysisView === "review") && (
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
              )}

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