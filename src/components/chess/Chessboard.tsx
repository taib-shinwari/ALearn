// Custom chessboard renderer using Wikimedia Commons SVG pieces.
// - Pieces are positioned absolutely so they can animate between squares.
// - Right-click is disabled. Right-drag (or right-click) draws an arrow,
//   single right-click toggles a red square highlight (chess.com-style).
// - Left-click clears all user arrows + right-click highlights, then forwards
//   the click to onSquareClick.
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { PlacedPiece, PieceColor, PieceType, Arrow } from "@/data/chessData";
import { CLASS_META, type ClassKind } from "./analysis/classification";

const PIECE_URL: Record<string, string> = {
  wK: "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg",
  wQ: "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg",
  wR: "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg",
  wB: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg",
  wN: "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg",
  wP: "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
  bK: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg",
  bQ: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg",
  bR: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg",
  bB: "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg",
  bN: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg",
  bP: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg",
};

interface Props {
  pieces: PlacedPiece[];
  stars?: string[];
  orientation?: "white" | "black";
  selected?: string | null;
  /** Squares to render as move-dots (legal destinations for selected piece). */
  legalSquares?: string[];
  /** Highlight the from/to squares of the last move (light blue). */
  lastMove?: { from: string; to: string } | null;
  /** Arrows passed in by the lesson (intro arrows etc.) — not user-drawn. */
  arrows?: Arrow[];
  /** 0..1 multiplier applied to lesson-provided arrows for pulsing effect. */
  arrowLengthScale?: number;
  onSquareClick?: (square: string) => void;
  /** Drag-and-drop a piece. Called with from/to after a successful drag. */
  onPieceDrop?: (from: string, to: string) => void;
  /** Called when a piece drag begins (used to show legal-move dots). */
  onDragBegin?: (square: string) => void;
  /** When false, disables click + drag entirely. */
  interactive?: boolean;
  /** Restrict input. "click"=clicks only, "drag"=drag only, "both"=either. */
  inputMode?: "click" | "drag" | "both";
  animate?: boolean;
  animationMs?: number;
  className?: string;
  /** Optional classification badge to overlay above the destination square. */
  moveBadge?: { square: string; kind: ClassKind } | null;
}

function squareToXY(sq: string, orientation: "white" | "black") {
  const file = sq.charCodeAt(0) - "a".charCodeAt(0);
  const rank = parseInt(sq[1], 10) - 1;
  const col = orientation === "white" ? file : 7 - file;
  const row = orientation === "white" ? 7 - rank : rank;
  return { col, row };
}

function isDarkTheme(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function pieceColor(p: PlacedPiece, dark: boolean): PieceColor {
  if (!p.themed) return p.color;
  return dark ? "w" : "b";
}

function ChessboardImpl({
  pieces, stars = [], orientation = "white", selected,
  legalSquares = [],
  lastMove = null,
  arrows = [], arrowLengthScale = 1,
  onSquareClick, onPieceDrop, onDragBegin, interactive = true,
  inputMode = "both",
  animate = true, animationMs = 220, className,
  moveBadge = null,
}: Props) {
  const clickEnabled = interactive && (inputMode === "click" || inputMode === "both");
  const dragEnabled = interactive && !!onPieceDrop && (inputMode === "drag" || inputMode === "both");
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const visualFiles = orientation === "white" ? files : [...files].reverse();
  const visualRanks = orientation === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];

  // User-drawn arrows + right-click highlights live inside the board.
  const [userArrows, setUserArrows] = useState<Arrow[]>([]);
  const [highlights, setHighlights] = useState<Set<string>>(new Set());

  const [dark, setDark] = useState(isDarkTheme);
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(isDarkTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const boardRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);
  useEffect(() => {
    if (!boardRef.current) return;
    const ro = new ResizeObserver(es => {
      const r = es[0].contentRect;
      setSize(Math.min(r.width, r.height));
    });
    ro.observe(boardRef.current);
    return () => ro.disconnect();
  }, []);

  const dragStart = useRef<string | null>(null);
  const [bounceSquare, setBounceSquare] = useState<string | null>(null);
  const onContextMenu = (e: React.MouseEvent) => e.preventDefault();

  const sqAt = (clientX: number, clientY: number): string | null => {
    if (!boardRef.current) return null;
    const r = boardRef.current.getBoundingClientRect();
    const x = clientX - r.left, y = clientY - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height) return null;
    const col = Math.floor((x / r.width) * 8);
    const row = Math.floor((y / r.height) * 8);
    const file = orientation === "white" ? files[col] : files[7 - col];
    const rank = orientation === "white" ? 8 - row : row + 1;
    return `${file}${rank}`;
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left click — clear user arrows + highlights.
      if (userArrows.length) setUserArrows([]);
      if (highlights.size) setHighlights(new Set());
    }
    if (e.button === 2) {
      dragStart.current = sqAt(e.clientX, e.clientY);
    }
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (e.button !== 2) return;
    const from = dragStart.current;
    const to = sqAt(e.clientX, e.clientY);
    dragStart.current = null;
    if (!from || !to) return;
    if (from === to) {
      // Toggle right-click highlight
      setHighlights(prev => {
        const next = new Set(prev);
        if (next.has(from)) next.delete(from); else next.add(from);
        return next;
      });
      return;
    }
    setUserArrows(prev => {
      const same = prev.find(x => x.from === from && x.to === to);
      if (same) return prev.filter(x => x !== same);
      return [...prev, { from, to, color: "hsl(var(--primary))" }];
    });
  };

  const sq = size / 8;
  const center = (s: string) => {
    const { col, row } = squareToXY(s, orientation);
    return { x: col * sq + sq / 2, y: row * sq + sq / 2 };
  };

  const renderedArrows = useMemo(() => {
    if (size === 0) return null;
    const all: { a: Arrow; scale: number; userDrawn: boolean }[] = [
      ...arrows.map(a => ({ a, scale: arrowLengthScale, userDrawn: false })),
      ...userArrows.map(a => ({ a, scale: 1, userDrawn: true })),
    ];
    return all.map(({ a, scale, userDrawn }, i) => {
      const f = center(a.from), t = center(a.to);
      const dx = t.x - f.x, dy = t.y - f.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) return null;
      const ux = dx / len, uy = dy / len;
      // Pull endpoints inward so arrows don't span the full diagonal.
      const tipX = t.x - ux * sq * 0.42;
      const tipY = t.y - uy * sq * 0.42;
      const startX = f.x + ux * sq * 0.35;
      const startY = f.y + uy * sq * 0.35;
      const eTipX = startX + (tipX - startX) * scale;
      const eTipY = startY + (tipY - startY) * scale;
      const color = a.color ?? "rgba(255,170,0,1)";
      const opacity = userDrawn ? 0.85 : 0.5;
      const width = sq * 0.22;
      const head = sq * 0.30;
      return (
        <g key={`${a.from}-${a.to}-${i}`} opacity={opacity}>
          <line x1={startX} y1={startY} x2={eTipX} y2={eTipY} stroke={color} strokeWidth={width} strokeLinecap="round" />
          <polygon
            points={[
              [eTipX + ux * head, eTipY + uy * head],
              [eTipX - uy * head * 0.8, eTipY + ux * head * 0.8],
              [eTipX + uy * head * 0.8, eTipY - ux * head * 0.8],
            ].map(p => p.join(",")).join(" ")}
            fill={color}
          />
        </g>
      );
    });
  }, [arrows, userArrows, arrowLengthScale, size, orientation]);

  return (
    <div
      ref={boardRef}
      onContextMenu={onContextMenu}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      className={cn(
        "relative w-full aspect-square select-none rounded-[14px] overflow-hidden border-2 border-border",
        className,
      )}
      role="img"
      aria-label="Chess position"
    >
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "repeat(8, 1fr)", gridTemplateRows: "repeat(8, 1fr)" }}>
        {visualRanks.map((rank, rIdx) =>
          visualFiles.map((file, fIdx) => {
            const square = `${file}${rank}`;
            const isLight = (rIdx + fIdx) % 2 === 0;
            const isSel = selected === square;
            const hasStar = stars.includes(square);
            const isHighlighted = highlights.has(square);
            const isLegal = legalSquares.includes(square);
            const hasPieceOnLegal = isLegal && pieces.some(p => p.square === square);
            const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
            return (
              <button
                type="button"
                key={square}
                onClick={() => clickEnabled && onSquareClick?.(square)}
                onDragOver={(e) => { if (dragEnabled) e.preventDefault(); }}
                onDrop={(e) => {
                  if (!dragEnabled) return;
                  e.preventDefault();
                  const from = e.dataTransfer.getData("text/plain");
                  if (from && from !== square) onPieceDrop?.(from, square);
                }}
                className={cn(
                  "relative flex items-center justify-center p-0 m-0 outline-none transition-colors",
                  isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]",
                )}
              >
                {isLastMove && !isSel && (
                  <span className="absolute inset-0 bg-sky-400/40 pointer-events-none" />
                )}
                {isSel && (
                  <span className="absolute inset-0 bg-sky-400/55 pointer-events-none" />
                )}
                {isHighlighted && (
                  <span className="absolute inset-0 bg-red-500/55 pointer-events-none" />
                )}
                {isLegal && !hasPieceOnLegal && (
                  <span className="absolute rounded-full bg-black/30 pointer-events-none"
                    style={{ width: "30%", height: "30%" }} />
                )}
                {isLegal && hasPieceOnLegal && (
                  <span className="absolute inset-[6%] rounded-full pointer-events-none"
                    style={{ boxShadow: "inset 0 0 0 4px rgba(0,0,0,0.35)" }} />
                )}
                {hasStar && (
                  <svg viewBox="0 0 24 24" className="w-1/2 h-1/2 drop-shadow animate-scale-in" aria-hidden>
                    <polygon
                      points="12,2 14.9,9 22,9.3 16.5,13.9 18.4,21 12,16.9 5.6,21 7.5,13.9 2,9.3 9.1,9"
                      fill="#facc15"
                      stroke="#a16207"
                      strokeWidth="0.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {fIdx === 0 && (
                  <span
                    className="absolute top-0.5 left-1 opacity-60 font-mono text-black leading-none"
                    style={{ fontSize: `${Math.max(8, sq * 0.18)}px` }}
                  >
                    {rank}
                  </span>
                )}
                {rIdx === 7 && (
                  <span
                    className="absolute bottom-0.5 right-1 opacity-60 font-mono text-black leading-none"
                    style={{ fontSize: `${Math.max(8, sq * 0.18)}px` }}
                  >
                    {file}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {size > 0 && pieces.map((p, i) => {
        const { col, row } = squareToXY(p.square, orientation);
        const color = pieceColor(p, dark);
        const url = PIECE_URL[`${color}${p.type as PieceType}`];
        const key = p.id ?? `${p.color}-${p.type}-${p.square}`;
        const pieceInteractive = clickEnabled || dragEnabled;
        return (
          <img
            key={key}
            src={url}
            alt=""
            draggable={dragEnabled}
            onDragStart={(e) => {
              if (!dragEnabled) { e.preventDefault(); return; }
              e.dataTransfer.setData("text/plain", p.square);
              e.dataTransfer.effectAllowed = "move";
              // Build a transparent piece-only drag image (no square background),
              // centered under the cursor regardless of grab point.
              try {
                const img = e.currentTarget as HTMLImageElement;
                const s = img.offsetWidth || 48;
                const ghost = document.createElement("img");
                ghost.src = url;
                ghost.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${s}px;height:${s}px;padding:0;background:transparent;pointer-events:none`;
                document.body.appendChild(ghost);
                e.dataTransfer.setDragImage(ghost, s / 2, s / 2);
                setTimeout(() => ghost.remove(), 0);
              } catch { /* noop */ }
              onDragBegin?.(p.square);
            }}
            onDragOver={(e) => { if (dragEnabled) e.preventDefault(); }}
            onDrop={(e) => {
              if (!dragEnabled) return;
              e.preventDefault();
              e.stopPropagation();
              const from = e.dataTransfer.getData("text/plain");
              if (from && from !== p.square) onPieceDrop?.(from, p.square);
            }}
            onClick={(e) => {
              if (!clickEnabled) return;
              e.stopPropagation();
              onSquareClick?.(p.square);
            }}
            style={{
              position: "absolute",
              left: `${(col / 8) * 100}%`,
              top: `${(row / 8) * 100}%`,
              width: `${100 / 8}%`,
              height: `${100 / 8}%`,
              padding: "0%",
              pointerEvents: pieceInteractive ? "auto" : "none",
              cursor: dragEnabled ? "grab" : clickEnabled ? "pointer" : "default",
              transition: animate
                ? `left ${animationMs}ms ease, top ${animationMs}ms ease`
                : undefined,
              zIndex: 1,
            }}
          />
        );
      })}



      {size > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
        >
          {renderedArrows}
        </svg>
      )}

      {size > 0 && moveBadge && (() => {
        const { col, row } = squareToXY(moveBadge.square, orientation);
        const meta = CLASS_META[moveBadge.kind];
        return (
          <div
            className="absolute pointer-events-none flex items-center justify-center rounded-full text-[11px] font-bold shadow-md ring-2 ring-background"
            style={{
              left: `calc(${(col / 8) * 100}% + ${sq * 0.62}px)`,
              top: `calc(${(row / 8) * 100}% - ${sq * 0.10}px)`,
              width: sq * 0.42,
              height: sq * 0.42,
              background: meta.color,
              color: "white",
            }}
            aria-hidden
          >
            {meta.glyph}
          </div>
        );
      })()}
    </div>
  );
}

// React.memo skips re-renders when only the parent state changed (e.g. hovering
// a move in the list). The board still updates on FEN/lastMove/orientation changes.
export const Chessboard = memo(ChessboardImpl);
