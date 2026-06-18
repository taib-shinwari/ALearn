// Panel rendered above the moves list. Shows:
// - the move just played (SAN + classification + explanation)
// - the engine's preferred follow-up line; hovering a move previews the position.
import { Chess } from "chess.js";
import { useMemo } from "react";
import { Container } from "@/components/ui/container";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { Chessboard } from "./Chessboard";
import { PieceTracker } from "./chessHelpers";
import { CLASS_META, explainMove, type PerMove } from "./analysis/classification";
import { getBestLine } from "@/lib/chessEngine";

interface Props {
  sans: string[];
  fens: string[];          // length = sans.length + 1
  currentIndex: number;    // -1 = before first move
  perMove?: PerMove[];
  orientation?: "white" | "black";
  /** When true, the engine's best line is shown (analysis/review mode). */
  showBestLine?: boolean;
  onSelect?: (index: number) => void;
}

function moveLabel(index: number): string {
  const n = Math.floor(index / 2) + 1;
  return index % 2 === 0 ? `${n}.` : `${n}...`;
}

export function MoveDetailPanel({
  sans, fens, currentIndex, perMove, orientation = "white", showBestLine = false, onSelect,
}: Props) {
  const current = currentIndex >= 0 && currentIndex < sans.length
    ? { san: sans[currentIndex], kind: perMove?.[currentIndex]?.kind, cpl: perMove?.[currentIndex]?.cpl ?? 0 }
    : null;

  // Either the mainline upcoming moves OR (in analysis) the engine's best line
  // computed from the current position.
  const followUps = useMemo(() => {
    if (showBestLine) {
      const fen = fens[currentIndex + 1];
      if (!fen) return [];
      try {
        const g = new Chess(fen);
        const line = getBestLine(g, 4, 3);
        const proj = new Chess(fen);
        return line.map((m, k) => {
          let san = `${m.from}${m.to}`;
          try { const mv = proj.move({ from: m.from, to: m.to, promotion: m.promotion ?? "q" }); if (mv) san = mv.san; }
          catch { /* ignore */ }
          return {
            index: currentIndex + 1 + k,
            san,
            fen: proj.fen(),
            isEngine: true,
          };
        });
      } catch { return []; }
    }
    const start = currentIndex + 1;
    const out: { index: number; san: string; fen: string; isEngine: false }[] = [];
    for (let i = start; i < Math.min(sans.length, start + 3); i++) {
      out.push({ index: i, san: sans[i], fen: fens[i + 1], isEngine: false });
    }
    return out;
  }, [sans, fens, currentIndex, showBestLine]);

  const explanation = current && current.kind
    ? explainMove(current.kind, current.cpl)
    : null;

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

      {explanation && (
        <p className={cn("text-xs leading-snug", current?.kind && CLASS_META[current.kind].text)}>
          {explanation}
        </p>
      )}

      {followUps.length > 0 && (
        <div className="border-t border-border/60 pt-2">
          <p className="text-[10px] uppercase tracking-wider opacity-60 mb-1">
            {showBestLine ? "Engine line" : "Coming up"}
          </p>
          <div className="flex flex-wrap gap-1.5 font-mono text-xs">
            {followUps.map(m => (
              <HoverCard key={`${m.index}-${m.san}`} openDelay={120} closeDelay={60}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    onClick={() => !showBestLine && onSelect?.(m.index)}
                    className={cn(
                      "px-1.5 py-0.5 rounded hover:bg-muted/60",
                      showBestLine && "text-emerald-400",
                    )}
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
