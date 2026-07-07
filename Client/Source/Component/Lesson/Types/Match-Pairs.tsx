import { useEffect, useState } from "react";
import { cn } from "@/Library/utils";
import { shuffle, type ExerciseProps } from "./Shared";

export function MatchPairsExercise({ step, onResult }: ExerciseProps) {
  const pairs: [string, string][] = step.pairs;
  const [left] = useState(() => pairs.map(p => p[0]));
  const [right, setRight] = useState(() => shuffle(pairs.map(p => p[1])));
  const [selLeft, setSelLeft] = useState<number | null>(null);
  const [selRight, setSelRight] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);

  useEffect(() => {
    if (selLeft === null || selRight === null) return;
    const l = left[selLeft];
    const r = right[selRight];
    const isMatch = pairs.some(p => p[0] === l && p[1] === r);
    if (isMatch) {
      setMatched(m => new Set([...m, l, r]));
    } else {
      setWrong(w => w + 1);
    }
    setTimeout(() => { setSelLeft(null); setSelRight(null); }, 300);
  }, [selLeft, selRight, left, right, pairs]);

  useEffect(() => {
    if (matched.size === pairs.length * 2) {
      setTimeout(() => onResult(wrong <= 1), 400);
    }
  }, [matched, pairs.length, wrong, onResult]);

  const cell = (text: string, selected: boolean, done: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={done}
      className={cn(
        "px-3 py-3 rounded-[12px] border-2 font-semibold text-sm transition-all",
        done && "opacity-30 border-border",
        !done && selected && "border-foreground bg-muted",
        !done && !selected && "border-border hover:bg-muted",
      )}
    >{text}</button>
  );

  return (
    <div className="space-y-4 pb-24">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          {left.map((t, i) => cell(t, selLeft === i, matched.has(t), () => setSelLeft(i)))}
        </div>
        <div className="grid gap-2">
          {right.map((t, i) => cell(t, selRight === i, matched.has(t), () => setSelRight(i)))}
        </div>
      </div>
    </div>
  );
}