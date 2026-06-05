// Custom chessboard renderer using Wikimedia Commons SVG pieces.
import { useMemo } from "react";
import { Chess } from "chess.js";
import { cn } from "@/lib/utils";

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
  fen: string;
  orientation?: "white" | "black";
  highlight?: string[];
  selected?: string | null;
  legal?: string[];
  onSquareClick?: (square: string) => void;
  className?: string;
}

export function Chessboard({
  fen, orientation = "white", highlight = [], selected, legal = [], onSquareClick, className,
}: Props) {
  const board = useMemo(() => new Chess(fen).board(), [fen]);
  const files = orientation === "white"
    ? ["a", "b", "c", "d", "e", "f", "g", "h"]
    : ["h", "g", "f", "e", "d", "c", "b", "a"];
  const ranks = orientation === "white"
    ? [8, 7, 6, 5, 4, 3, 2, 1]
    : [1, 2, 3, 4, 5, 6, 7, 8];
  const hi = new Set(highlight);
  const lg = new Set(legal);

  return (
    <div
      className={cn(
        "w-full aspect-square grid select-none rounded-[14px] overflow-hidden border-2 border-border",
        className,
      )}
      style={{ gridTemplateColumns: "repeat(8, 1fr)", gridTemplateRows: "repeat(8, 1fr)" }}
      role="img"
      aria-label="Chess position"
    >
      {ranks.map((rank, rIdx) =>
        files.map((file, fIdx) => {
          const square = `${file}${rank}`;
          const bRow = 8 - rank;
          const bCol = file.charCodeAt(0) - "a".charCodeAt(0);
          const piece = board[bRow][bCol];
          const isLight = (rIdx + fIdx) % 2 === 0;
          const isHi = hi.has(square);
          const isSel = selected === square;
          const isLegal = lg.has(square);
          return (
            <button
              type="button"
              key={square}
              onClick={() => onSquareClick?.(square)}
              className={cn(
                "relative flex items-center justify-center p-0 m-0 outline-none transition-colors",
                isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]",
                isHi && "ring-2 ring-inset ring-yellow-400",
                isSel && "ring-2 ring-inset ring-blue-500",
              )}
            >
              {piece && (
                <img
                  src={PIECE_URL[`${piece.color}${piece.type.toUpperCase()}`]}
                  alt=""
                  draggable={false}
                  className="w-[88%] h-[88%] pointer-events-none"
                />
              )}
              {isLegal && !piece && (
                <span className="absolute inset-0 m-auto w-1/3 h-1/3 rounded-full bg-black/30" />
              )}
              {isLegal && piece && (
                <span className="absolute inset-1 rounded-full ring-4 ring-black/40" />
              )}
              {fIdx === 0 && (
                <span className="absolute top-0.5 left-0.5 text-[8px] opacity-60 font-mono text-black">{rank}</span>
              )}
              {rIdx === 7 && (
                <span className="absolute bottom-0.5 right-1 text-[8px] opacity-60 font-mono text-black">{file}</span>
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
