import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { TrendingUp, Trophy } from "lucide-react";

interface Delta { nodeId: string; title: string; before: number; after: number }

interface Props {
  total: number;
  correct: number;
  durationMs: number;
  deltas: Delta[];
  onContinue: () => void;
  continueLabel: string;
  headingLabel: string;
}

/** End-of-session summary. Shows mastery delta per skill node touched. */
export function SessionSummary({
  total, correct, durationMs, deltas, onContinue, continueLabel, headingLabel,
}: Props) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const seconds = Math.round(durationMs / 1000);

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-md mx-auto w-full justify-center gap-4">
      <div className="text-center space-y-2">
        <Trophy className="h-12 w-12 mx-auto" />
        <h1 className="text-2xl font-bold">{headingLabel}</h1>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Container className="text-center py-3">
          <div className="text-2xl font-bold">{accuracy}%</div>
          <div className="text-[10px] uppercase tracking-widest opacity-60">accuracy</div>
        </Container>
        <Container className="text-center py-3">
          <div className="text-2xl font-bold">{correct}/{total}</div>
          <div className="text-[10px] uppercase tracking-widest opacity-60">correct</div>
        </Container>
        <Container className="text-center py-3">
          <div className="text-2xl font-bold">{seconds}s</div>
          <div className="text-[10px] uppercase tracking-widest opacity-60">time</div>
        </Container>
      </div>

      {deltas.length > 0 && (
        <Container className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest opacity-60 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> mastery gained
          </div>
          {deltas.map(d => (
            <div key={d.nodeId} className="flex items-center justify-between text-sm">
              <span className="truncate">{d.title}</span>
              <span className="font-mono text-xs">
                {d.before.toFixed(1)} → <span className="font-bold">{d.after.toFixed(1)}</span>
              </span>
            </div>
          ))}
        </Container>
      )}

      <Button fullWidth active onClick={onContinue}>{continueLabel}</Button>
    </div>
  );
}
