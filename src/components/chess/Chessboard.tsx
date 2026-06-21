// Custom chessboard renderer using Wikimedia Commons SVG pieces.
// Unified Pointer Events for click/drag:
//  - PointerDown on a piece: lift it centered at the cursor.
//  - Below DRAG_THRESHOLD movement → click-select (release on same square).
//  - Past threshold → drag mode; release on legal target plays the move.
// Right-click / right-drag handles arrows + highlights and (via callback)
// cancels queued premoves when right-clicking on a premove square.
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { PlacedPiece, PieceColor, PieceType, Arrow } from "@/data/chessData";
import { CLASS_META, type ClassKind } from "./analysis/classification";

const DRAG_THRESHOLD = 6;     // px – distance before we treat as drag
const PREMOVE_TINT  = "rgba(220, 38, 38, 0.45)";
const PREMOVE_RING  = "rgba(220, 38, 38, 0.95)";

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
  legalSquares?: string[];
  lastMove?: { from: string; to: string } | null;
  arrows?: Arrow[];
  arrowLengthScale?: number;
  onSquareClick?: (square: string) => void;
  onPieceDrop?: (from: string, to: string) => void;
  onDragBegin?: (square: string) => void;
  interactive?: boolean;
  inputMode?: "click" | "drag" | "both";
  animate?: boolean;
  animationMs?: number;
  className?: string;
  moveBadge?: { square: string; kind: ClassKind } | null;
  /** Squares involved in any queued premove (tinted red). */
  premoveSquares?: string[];
  /** Called when user right-clicks a premove square to cancel the queue. */
  onCancelPremoves?: () => void;
  /** Called on any right-click — used to clear current selection. */
  onClearSelection?: () => void;
  /** When set, only pieces of this color can be picked up/dragged. */
  interactiveColor?: PieceColor;
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

interface DragState {
  pointerId: number;
  fromSquare: string;
  startX: number; startY: number;
  curX: number; curY: number;
  isDragging: boolean;
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
  premoveSquares = [],
  onCancelPremoves,
  onClearSelection,
  interactiveColor,
}: Props) {

  const clickEnabled = interactive && (inputMode === "click" || inputMode === "both");
  const dragEnabled = interactive && !!onPieceDrop && (inputMode === "drag" || inputMode === "both");
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const visualFiles = orientation === "white" ? files : [...files].reverse();
  const visualRanks = orientation === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];

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

  // ── Right-click arrows / highlights (separate from left-click pointer drag).
  const rightDown = useRef<string | null>(null);
  const onContextMenu = (e: React.MouseEvent) => e.preventDefault();

  // ── Active left-button drag state.
  const [drag, setDrag] = useState<DragState | null>(null);

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

  // ── Left-button pointer-drag handlers (attached to piece images).
  const beginPieceDrag = (e: React.PointerEvent, square: string) => {
    if (e.button !== 0) return;
    if (!clickEnabled && !dragEnabled) return;
    // Ownership gate: only pieces of interactiveColor (if set) can be lifted.
    if (interactiveColor) {
      const p = pieces.find(pp => pp.square === square);
      if (!p || p.color !== interactiveColor) return;
    }
    // Clear ephemeral right-click overlays on any left interaction.
    if (userArrows.length) setUserArrows([]);
    if (highlights.size) setHighlights(new Set());
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* noop */ }
    setDrag({
      pointerId: e.pointerId,
      fromSquare: square,
      startX: e.clientX, startY: e.clientY,
      curX: e.clientX, curY: e.clientY,
      isDragging: false,
    });
    onDragBegin?.(square);
  };


  const movePieceDrag = (e: React.PointerEvent) => {
    setDrag(d => {
      if (!d || d.pointerId !== e.pointerId) return d;
      const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
      const isDragging = d.isDragging || Math.hypot(dx, dy) >= DRAG_THRESHOLD;
      return { ...d, curX: e.clientX, curY: e.clientY, isDragging };
    });
  };

  const endPieceDrag = (e: React.PointerEvent) => {
    const d = drag;
    if (!d || d.pointerId !== e.pointerId) return;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
    const target = sqAt(e.clientX, e.clientY);
    setDrag(null);
    if (!target) return;
    if (!d.isDragging) {
      // Click-up on same square: piece was already selected via onDragBegin.
      // Clicking a different square: treat as click on that target.
      if (target !== d.fromSquare && clickEnabled) onSquareClick?.(target);
      return;
    }
    // Drag release: attempt move; if released on origin, keep selection.
    if (target === d.fromSquare) return;
    if (dragEnabled) onPieceDrop?.(d.fromSquare, target);
    else if (clickEnabled) onSquareClick?.(target);
  };

  const cancelPieceDrag = () => setDrag(null);

  // ── Board background pointer handlers (clicks on empty squares + right-click).
  const onBoardPointerDown = (e: React.PointerEvent) => {
    if (e.button === 2) {
      const sq = sqAt(e.clientX, e.clientY);
      const hadSelection = !!selected;
      // Right-click anywhere always clears the active selection.
      onClearSelection?.();
      if (sq && premoveSquares.includes(sq)) {
        onCancelPremoves?.();
        rightDown.current = null;
        return;
      }
      // If we just cleared a selection, suppress red-tint / arrow on this gesture.
      rightDown.current = hadSelection ? null : sq;
      return;
    }
    if (e.button !== 0) return;
    // Left click on empty area — clear overlays.
    if (userArrows.length) setUserArrows([]);
    if (highlights.size) setHighlights(new Set());
  };

  const onBoardPointerUp = (e: React.PointerEvent) => {
    if (e.button !== 2) return;
    const from = rightDown.current;
    const to = sqAt(e.clientX, e.clientY);
    rightDown.current = null;
    if (!from || !to) return;
    if (from === to) {
      // Toggle red highlight (unless cancelling premoves).
      if (premoveSquares.includes(from)) return;
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

  // Compute ghost (dragged piece) screen position relative to board.
  // Shown from the very first pointerdown so the piece centres on the cursor
  // immediately, before the drag threshold is exceeded.
  const ghost = useMemo(() => {
    if (!drag || size === 0 || !boardRef.current) return null;
    const r = boardRef.current.getBoundingClientRect();
    return { x: drag.curX - r.left, y: drag.curY - r.top };
  }, [drag, size]);

  return (
    <div
      ref={boardRef}
      onContextMenu={onContextMenu}
      onPointerDown={onBoardPointerDown}
      onPointerUp={onBoardPointerUp}
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
            const isPremove = premoveSquares.includes(square);
            return (
              <button
                type="button"
                key={square}
                onClick={() => {
                  // Pointer drag handles square selection when it begins on a
                  // piece; this fallback handles clicks on empty squares.
                  if (drag) return;
                  if (clickEnabled) onSquareClick?.(square);
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
                {isPremove && (
                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: PREMOVE_TINT, boxShadow: `inset 0 0 0 2px ${PREMOVE_RING}` }}
                  />
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

      {size > 0 && pieces.map((p) => {
        const { col, row } = squareToXY(p.square, orientation);
        const color = pieceColor(p, dark);
        const url = PIECE_URL[`${color}${p.type as PieceType}`];
        const key = p.id ?? `${p.color}-${p.type}-${p.square}`;
        const pieceInteractive = clickEnabled || dragEnabled;
        const isBeingHeld = !!drag && drag.fromSquare === p.square;
        return (
          <img
            key={key}
            src={url}
            alt=""
            draggable={false}
            onPointerDown={(e) => beginPieceDrag(e, p.square)}
            onPointerMove={movePieceDrag}
            onPointerUp={endPieceDrag}
            onPointerCancel={cancelPieceDrag}
            style={{
              position: "absolute",
              left: `${(col / 8) * 100}%`,
              top: `${(row / 8) * 100}%`,
              width: `${100 / 8}%`,
              height: `${100 / 8}%`,
              padding: "0%",
              pointerEvents: pieceInteractive ? "auto" : "none",
              cursor: pieceInteractive ? (drag ? "grabbing" : "grab") : "default",
              opacity: isBeingHeld ? 0 : 1,
              transition: animate && !isBeingHeld
                ? `left ${animationMs}ms ease, top ${animationMs}ms ease`
                : undefined,
              touchAction: "none",
              zIndex: 1,
            }}
          />
        );
      })}

      {/* Ghost piece — centered at cursor from the first pointerdown. */}
      {drag && ghost && (() => {
        const piece = pieces.find(p => p.square === drag.fromSquare);
        if (!piece) return null;
        const color = pieceColor(piece, dark);
        const url = PIECE_URL[`${color}${piece.type as PieceType}`];
        return (
          <img
            src={url}
            alt=""
            style={{
              position: "absolute",
              left: ghost.x - sq / 2,
              top: ghost.y - sq / 2,
              width: sq,
              height: sq,
              pointerEvents: "none",
              zIndex: 10,
              filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.35))",
            }}
          />
        );
      })()}

      {size > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 6 }}
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

export const Chessboard = memo(ChessboardImpl);
