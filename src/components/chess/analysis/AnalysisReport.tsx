import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CLASS_META, CLASS_ORDER, type ClassKind, type PerMove, type PlayerSummary } from "./classification";

interface Props {
  perMove: PerMove[];
  white: PlayerSummary;
  black: PlayerSummary;
  onReview: () => void;
}

function pct(n: number | null): string {
  if (n === null) return "—";
  return `${n.toFixed(0)}%`;
}

function ClassificationBar({ counts }: { counts: Record<ClassKind, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="flex w-full h-2 rounded-full overflow-hidden border border-border">
      {CLASS_ORDER.map(k => {
        const n = counts[k];
        if (!n) return null;
        return (
          <div
            key={k}
            style={{ width: `${(n / total) * 100}%`, background: CLASS_META[k].color }}
            title={`${CLASS_META[k].label}: ${n}`}
          />
        );
      })}
    </div>
  );
}

export function AnalysisReport({ perMove, white, black, onReview }: Props) {
  return (
    <Container className="p-4 space-y-4 overflow-y-auto">
      {/* Player row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
        <div className="text-left">
          <p className="text-[10px] uppercase tracking-wider opacity-60">White</p>
          <p className="font-semibold">{white.accuracy.toFixed(1)}%</p>
        </div>
        <span className="text-[10px] uppercase tracking-wider opacity-60">Accuracy</span>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider opacity-60">Black</p>
          <p className="font-semibold">{black.accuracy.toFixed(1)}%</p>
        </div>
      </div>

      {/* Phase accuracy */}
      <div className="space-y-1.5 text-sm">
        {(["opening","middlegame","endgame"] as const).map(p => (
          <div key={p} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <span className="text-right tabular-nums">{pct(white.phases[p])}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-60 px-2">{p}</span>
            <span className="text-left tabular-nums">{pct(black.phases[p])}</span>
          </div>
        ))}
      </div>

      {/* Estimated rating */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
        <span className="text-right font-semibold">{white.estimatedRating}</span>
        <span className="text-[10px] uppercase tracking-wider opacity-60 px-2">Est. Rating</span>
        <span className="text-left font-semibold">{black.estimatedRating}</span>
      </div>

      {/* Move classification table */}
      <div className="space-y-1">
        {CLASS_ORDER.map(k => {
          const meta = CLASS_META[k];
          const w = white.counts[k];
          const b = black.counts[k];
          return (
            <div key={k} className="grid grid-cols-[2.5rem_1fr_2.5rem_2rem_2.5rem] items-center gap-1 text-sm">
              <span className={cn("text-right tabular-nums font-mono", meta.text)}>{w}</span>
              <span className="text-right opacity-70">{meta.label}</span>
              <span
                className="text-center"
                style={{ color: meta.color }}
                aria-hidden
              >{meta.glyph}</span>
              <span className="opacity-30 text-center text-xs">·</span>
              <span className={cn("text-left tabular-nums font-mono", meta.text)}>{b}</span>
            </div>
          );
        })}
      </div>

      {/* Horizontal class color bars */}
      <div className="space-y-1.5">
        <ClassificationBar counts={white.counts} />
        <ClassificationBar counts={black.counts} />
      </div>

      <Button onClick={onReview} active className="w-full">
        Review Game
      </Button>
    </Container>
  );
}
