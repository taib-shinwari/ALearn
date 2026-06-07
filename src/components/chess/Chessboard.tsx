// Custom chessboard renderer using Wikimedia Commons SVG pieces.
// - Pieces are positioned absolutely so they can animate between squares.
// - Right-click is disabled. Right-drag (or two-finger) draws an arrow.
// - Arrows are rendered on an SVG overlay.
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { PlacedPiece, PieceColor, PieceType, Arrow } from "@/data/chessData";

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
  arrows?: Arrow[];
  onSquareClick?: (square: string) => void;
  onArrowDrawn?: (arrow: Arrow) => void;
  animate?: boolean;
  animationMs?: number;
  className?: string;
}

function squareToXY(sq: string, orientation: "white" | "black") {
  const file = sq.charCodeAt(0) - "a".charCodeAt(0); // 0..7
  const rank = parseInt(sq[1], 10) - 1;              // 0..7
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

export function Chessboard({
  pieces, stars = [], orientation = "white", selected,
  arrows = [], onSquareClick, onArrowDrawn,
  animate = true, animationMs = 220, className,
}: Props) {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const visualFiles = orientation === "white" ? files : [...files].reverse();
  const visualRanks = orientation === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];

  // Track theme for `themed` pieces
  const [dark, setDark] = useState(isDarkTheme);
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(isDarkTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Track board pixel size so arrows scale correctly
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

  // Right-drag arrow drawing
  const dragStart = useRef<string | null>(null);
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
    if (e.button !== 2) return;
    dragStart.current = sqAt(e.clientX, e.clientY);
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (e.button !== 2) return;
    const from = dragStart.current;
    const to = sqAt(e.clientX, e.clientY);
    dragStart.current = null;
    if (!from || !to || from === to) return;
    onArrowDrawn?.({ from, to });
  };

  const sq = size / 8;
  const center = (s: string) => {
    const { col, row } = squareToXY(s, orientation);
    return { x: col * sq + sq / 2, y: row * sq + sq / 2 };
  };

  const renderedArrows = useMemo(() => {
    if (size === 0) return null;
    return arrows.map((a, i) => {
      const f = center(a.from), t = center(a.to);
      const dx = t.x - f.x, dy = t.y - f.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) return null;
      const ux = dx / len, uy = dy / len;
      // Pull back from target so arrowhead sits inside the square
      const tipX = t.x - ux * sq * 0.25;
      const tipY = t.y - uy * sq * 0.25;
      const startX = f.x + ux * sq * 0.15;
      const startY = f.y + uy * sq * 0.15;
      const color = a.color ?? "rgba(255,170,0,0.85)";
      return (
        <g key={`${a.from}-${a.to}-${i}`}>
          <line x1={startX} y1={startY} x2={tipX} y2={tipY} stroke={color} strokeWidth={sq * 0.14} strokeLinecap="round" />
          {/* Arrowhead */}
          <polygon
            points={[
              [tipX + ux * sq * 0.22, tipY + uy * sq * 0.22],
              [tipX - uy * sq * 0.18, tipY + ux * sq * 0.18],
              [tipX + uy * sq * 0.18, tipY - ux * sq * 0.18],
            ].map(p => p.join(",")).join(" ")}
            fill={color}
          />
        </g>
      );
    });
  }, [arrows, size, orientation]);

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
      {/* Squares */}
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "repeat(8, 1fr)", gridTemplateRows: "repeat(8, 1fr)" }}>
        {visualRanks.map((rank, rIdx) =>
          visualFiles.map((file, fIdx) => {
            const square = `${file}${rank}`;
            const isLight = (rIdx + fIdx) % 2 === 0;
            const isSel = selected === square;
            const hasStar = stars.includes(square);
            return (
              <button
                type="button"
                key={square}
                onClick={() => onSquareClick?.(square)}
                className={cn(
                  "relative flex items-center justify-center p-0 m-0 outline-none transition-colors",
                  isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]",
                  isSel && "ring-4 ring-inset ring-blue-500/70",
                )}
              >
                {hasStar && (
                  <svg viewBox="0 0 24 24" className="w-1/2 h-1/2 drop-shadow" aria-hidden>
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

      {/* Pieces */}
      {size > 0 && pieces.map((p, i) => {
        const { col, row } = squareToXY(p.square, orientation);
        const color = pieceColor(p, dark);
        const url = PIECE_URL[`${color}${p.type as PieceType}`];
        return (
          <img
            key={`${p.type}-${i}`}
            src={url}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              left: `${(col / 8) * 100}%`,
              top: `${(row / 8) * 100}%`,
              width: `${100 / 8}%`,
              height: `${100 / 8}%`,
              padding: "2%",
              pointerEvents: "none",
              transition: animate ? `left ${animationMs}ms ease, top ${animationMs}ms ease` : undefined,
            }}
          />
        );
      })}

      {/* Arrows overlay */}
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
    </div>
  );
}
