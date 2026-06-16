// Panel rendered above the moves list. Shows:
// - the move just played (SAN + classification)
// - the next 3 moves in the mainline; hovering one previews its position.
import { Chess } from "chess.js";
import { useMemo } from "react";
import { Container } from "@/components/ui/container";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { Chessboard } from "./Chessboard";
import { PieceTracker } from "./chessHelpers";
import { CLASS_META, type PerMove } from "./analysis/classification";

interface Props {
  sans: string[];
  fens: string[];          // length = sans.length + 1
  currentIndex: number;    // -1 = before first move
  perMove?: PerMove[];
  orientation?: "white" | "black";
  onSelect?: (index: number) => void;
}

function moveLabel(index: number): string {
  const n = Math.floor(index / 2) + 1;
  return index % 2 === 0 ? `${n}.` : `${n}...`;
}

export function MoveDetailPanel({
  sans, fens, currentIndex, perMove, orientation = "white", onSelect,
}: Props) {
  const current = currentIndex >= 0 && currentIndex < sans.length
    ? { san: sans[currentIndex], kind: perMove?.[currentIndex]?.kind }
    : null;

  const nextMoves = useMemo(() => {
    const out: { index: number; san: string; fen: string }[] = [];
    const start = currentIndex + 1;
    for (let i = start; i < Math.min(sans.length, start + 3); i++) {
      out.push({ index: i, san: sans[i], fen: fens[i + 1] });
    }
    return out;
  }, [sans, fens, currentIndex]);

  return (
    <Container className="p-3 space-y-2">
      <div className="flex items-baseline justify-between gap-3 min-h-[1.25rem]">
        <span className="text-[10px] uppercase tracking-wider opacity-60">Last move</span>
        {current ? (
          <span className="font-mono text-sm">
            <span className="opacity-60 mr-1">{moveLabel(currentIndex)}</span>
            <span>{current.san}</span>
            {current.kind && (
              <span className={cn("ml-2 font-bold", CLASS_META[current.kind].text)}>
                {CLASS_META[current.kind].glyph}
              </span>
            )}
          </span>
        ) : (
          <span className="opacity-50 text-xs">—</span>
        )}
      </div>

      {nextMoves.length > 0 && (
        <div className="border-t border-border/60 pt-2">
          <p className="text-[10px] uppercase tracking-wider opacity-60 mb-1">Coming up</p>
          <div className="flex flex-wrap gap-1.5 font-mono text-xs">
            {nextMoves.map(m => (
              <HoverCard key={m.index} openDelay={120} closeDelay={60}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onSelect?.(m.index)}
                    className="px-1.5 py-0.5 rounded hover:bg-muted/60"
                  >
                    <span className="opacity-60 mr-1">{moveLabel(m.index)}</span>
                    {m.san}
                  </button>
                </HoverCardTrigger>
                <HoverCardContent side="left" className="w-56 p-2">
                  <MiniBoard fen={m.fen} orientation={orientation} />
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}

function MiniBoard({ fen, orientation }: { fen: string; orientation: "white" | "black" }) {
  const pieces = useMemo(() => {
    try {
      const g = new Chess(fen);
      const t = new PieceTracker();
      t.reset(g);
      return t.withIds(g);
    } catch { return []; }
  }, [fen]);
  return <Chessboard pieces={pieces} interactive={false} animate={false} orientation={orientation} />;
}
