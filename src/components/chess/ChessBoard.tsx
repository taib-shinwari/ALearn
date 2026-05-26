import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Position, Square, legalMovesFrom, UNICODE, idxToSq,
} from "@/lib/chess/engine";

interface Props {
  position: Position;
  orientation?: "white" | "black";
  /** Squares to highlight (e.g. lesson focus). */
  highlightSquares?: Square[];
  /** Called when the user attempts a move. Return true to accept. */
  onMove?: (from: Square, to: Square) => boolean;
  /** When set, only this square's piece is movable. */
  restrictTo?: Square;
  disabled?: boolean;
}

/**
 * Self-contained chess board. No external chess library used.
 * Click-to-select interaction (no drag — works on touch + mouse).
 */
export function ChessBoard({
  position,
  orientation = "white",
  highlightSquares = [],
  onMove,
  restrictTo,
  disabled = false,
}: Props) {
  const [selected, setSelected] = useState<Square | null>(null);

  const legal = useMemo(() => {
    if (!selected) return [] as Square[];
    return legalMovesFrom(position, selected).map(m => m.to);
  }, [position, selected]);

  // Render order: rank 8 top → 1 bottom (white orientation)
  const ranks = orientation === "white" ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const files = orientation === "white" ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];

  const handleSquareClick = (sq: Square) => {
    if (disabled) return;
    const idx = ranks.length; // unused, keeps tsc happy
    void idx;
    const piece = position.board[sqIndex(sq)];

    if (selected) {
      if (selected === sq) { setSelected(null); return; }
      // attempt move
      const isLegal = legal.includes(sq);
      if (isLegal && onMove) {
        const accepted = onMove(selected, sq);
        setSelected(null);
        if (!accepted) return;
        return;
      }
      // reselect own piece
      if (piece && piece.color === position.turn && (!restrictTo || sq === restrictTo)) {
        setSelected(sq);
        return;
      }
      setSelected(null);
      return;
    }

    if (piece && piece.color === position.turn) {
      if (restrictTo && sq !== restrictTo) return;
      setSelected(sq);
    }
  };

  return (
    <div className="w-full aspect-square rounded-[16px] overflow-hidden border-2 border-border bg-background select-none">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {ranks.map(r => files.map(f => {
          const sq = idxToSq(r * 8 + f);
          const isLight = (f + r) % 2 === 1;
          const piece = position.board[r * 8 + f];
          const isSelected = selected === sq;
          const isLegalTarget = legal.includes(sq);
          const isHighlighted = highlightSquares.includes(sq);
          const isRestrictedFocus = restrictTo === sq;

          return (
            <button
              type="button"
              key={sq}
              onClick={() => handleSquareClick(sq)}
              className={cn(
                "relative flex items-center justify-center transition-colors",
                isLight ? "bg-[hsl(var(--muted))]" : "bg-[hsl(var(--foreground)/0.85)]",
                isSelected && "ring-2 ring-inset ring-[hsl(var(--ring))]",
                (isHighlighted || isRestrictedFocus) && "ring-2 ring-inset ring-[hsl(var(--ring))]",
                disabled && "cursor-default",
              )}
              aria-label={sq}
            >
              {piece && (
                <span
                  className={cn(
                    "leading-none font-semibold drop-shadow",
                    isLight ? "text-foreground" : "text-background",
                  )}
                  style={{ fontSize: "min(7vw, 44px)" }}
                >
                  {UNICODE[piece.color][piece.type]}
                </span>
              )}
              {isLegalTarget && !piece && (
                <span className="absolute h-3 w-3 rounded-full bg-[hsl(var(--ring)/0.55)]" />
              )}
              {isLegalTarget && piece && (
                <span className="absolute inset-1 rounded-md ring-2 ring-[hsl(var(--ring)/0.7)]" />
              )}
              {/* Coordinate labels on edge squares */}
              {f === (orientation === "white" ? 0 : 7) && (
                <span className={cn(
                  "absolute top-0.5 left-1 text-[9px] font-semibold opacity-60",
                  isLight ? "text-foreground" : "text-background",
                )}>{r + 1}</span>
              )}
              {r === (orientation === "white" ? 0 : 7) && (
                <span className={cn(
                  "absolute bottom-0.5 right-1 text-[9px] font-semibold opacity-60",
                  isLight ? "text-foreground" : "text-background",
                )}>{"abcdefgh"[f]}</span>
              )}
            </button>
          );
        }))}
      </div>
    </div>
  );
}

function sqIndex(sq: Square) {
  const file = "abcdefgh".indexOf(sq[0]);
  const rank = parseInt(sq[1], 10) - 1;
  return rank * 8 + file;
}
