// Custom chessboard renderer — no external chessboard library.
// Pure SVG-free CSS grid with Unicode pieces. Read-only (for lessons).

import { useMemo } from "react";
import { Chess } from "chess.js";
import { cn } from "@/lib/utils";

const PIECES: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

interface Props {
  fen: string;
  orientation?: "white" | "black";
  highlight?: string[]; // squares like ["e2","e4"]
  className?: string;
}

export function Chessboard({ fen, orientation = "white", highlight = [], className }: Props) {
  const board = useMemo(() => new Chess(fen).board(), [fen]);
  const files = orientation === "white"
    ? ["a", "b", "c", "d", "e", "f", "g", "h"]
    : ["h", "g", "f", "e", "d", "c", "b", "a"];
  const ranks = orientation === "white"
    ? [8, 7, 6, 5, 4, 3, 2, 1]
    : [1, 2, 3, 4, 5, 6, 7, 8];
  const hi = new Set(highlight);

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
          // board() is always indexed from rank 8 down to 1, file a to h.
          const bRow = 8 - rank;
          const bCol = file.charCodeAt(0) - "a".charCodeAt(0);
          const piece = board[bRow][bCol];
          const isLight = (rIdx + fIdx) % 2 === 0;
          const highlighted = hi.has(square);
          return (
            <div
              key={square}
              className={cn(
                "relative flex items-center justify-center",
                isLight ? "bg-[hsl(var(--muted))]" : "bg-[hsl(var(--foreground))]/15",
                highlighted && "ring-2 ring-inset ring-[hsl(var(--primary))]",
              )}
            >
              {piece && (
                <span
                  className={cn(
                    "leading-none text-[clamp(1.5rem,7vw,3rem)]",
                    piece.color === "w" ? "text-foreground" : "text-foreground",
                  )}
                  style={{ textShadow: piece.color === "w" ? "0 0 2px hsl(var(--background))" : "none" }}
                >
                  {PIECES[`${piece.color}${piece.type.toUpperCase()}`]}
                </span>
              )}
              {fIdx === 0 && (
                <span className="absolute top-0.5 left-0.5 text-[8px] opacity-50 font-mono">{rank}</span>
              )}
              {rIdx === 7 && (
                <span className="absolute bottom-0.5 right-1 text-[8px] opacity-50 font-mono">{file}</span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
