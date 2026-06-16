import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CLASS_META, CLASS_ORDER, type ClassKind, type PerMove, type PlayerSummary } from "./classification";
import { EvalChart } from "./EvalChart";

interface Props {
  perMove: PerMove[];
  fens: string[];
  white: PlayerSummary;
  black: PlayerSummary;
  currentIndex: number;
  onSelect?: (i: number) => void;
  onReview: () => void;
}

function pct(n: number | null): string {
  if (n === null) return "—";
  return `${n.toFixed(0)}%`;
}

export function AnalysisReport({
  perMove, fens, white, black, currentIndex, onSelect, onReview,
}: Props) {
  return (
    <div className="space-y-3 overflow-y-auto pr-1 max-h-full">
      {/* Accuracy */}
      <Card className="p-3">
        <p className="text-[10px] uppercase tracking-wider opacity-60 text-center mb-1">Accuracy</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider opacity-60">White</p>
            <p className="font-bold text-lg">{white.accuracy.toFixed(1)}</p>
          </div>
          <span className="opacity-40">vs</span>
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-wider opacity-60">Black</p>
            <p className="font-bold text-lg">{black.accuracy.toFixed(1)}</p>
          </div>
        </div>
        <div className="mt-2 space-y-0.5 text-xs">
          {(["opening","middlegame","endgame"] as const).map(p => (
            <div key={p} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <span className="text-right tabular-nums opacity-80">{pct(white.phases[p])}</span>
              <span className="text-[9px] uppercase tracking-wider opacity-50 px-2">{p}</span>
              <span className="text-left tabular-nums opacity-80">{pct(black.phases[p])}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Rating */}
      <Card className="p-3">
        <p className="text-[10px] uppercase tracking-wider opacity-60 text-center mb-1">Estimated Rating</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
          <span className="text-right font-bold text-lg">{white.estimatedRating}</span>
          <span className="opacity-40">vs</span>
          <span className="text-left font-bold text-lg">{black.estimatedRating}</span>
        </div>
      </Card>

      {/* Move classification breakdown */}
      <Card className="p-3">
        <p className="text-[10px] uppercase tracking-wider opacity-60 text-center mb-2">Move Classification</p>
        <div className="space-y-0.5">
          {CLASS_ORDER.map(k => {
            const meta = CLASS_META[k];
            const w = white.counts[k];
            const b = black.counts[k];
            return (
              <div key={k} className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-1 text-sm">
                <span className={cn("text-right tabular-nums font-mono font-semibold", meta.text)}>{w}</span>
                <span className={cn("text-center text-xs font-medium", meta.text)}>
                  <span className="mr-1">{meta.glyph}</span>{meta.label}
                </span>
                <span className={cn("text-left tabular-nums font-mono font-semibold", meta.text)}>{b}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Eval chart */}
      <Card className="p-2">
        <p className="text-[10px] uppercase tracking-wider opacity-60 text-center mb-1">Evaluation</p>
        <EvalChart fens={fens} perMove={perMove} currentIndex={currentIndex} onSelect={onSelect} />
      </Card>

      <Button variant="outline" className="w-full" onClick={onReview}>
        Review Game
      </Button>
    </div>
  );
}
