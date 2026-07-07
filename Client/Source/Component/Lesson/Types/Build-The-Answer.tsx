import { useState } from "react";
import { Container } from "@/Component/UI/container";
import { cn } from "@/Library/utils";
import { ActionBar, type ExerciseProps } from "./Shared";

// Prompt in a Container; the tray + token buttons float standalone below it.
export function BuildExercise({ step, onResult }: ExerciseProps) {
  const tokens: string[] = step.tokens;
  const answer: number[] = step.answer;
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const correct = picked.length === answer.length && picked.every((p, i) => p === answer[i]);

  const toggle = (i: number) => {
    if (checked) return;
    setPicked(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  };

  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold">{step.prompt}</h2>
      </Container>
      <div className="min-h-[60px] p-3 rounded-[12px] border-2 border-dashed border-border flex flex-wrap gap-2">
        {picked.map((i, pos) => (
          <button key={pos} onClick={() => toggle(i)} disabled={checked}
            className="px-3 py-2 rounded-[10px] border-2 border-foreground bg-muted font-semibold text-sm">
            {tokens[i]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {tokens.map((t, i) => (
          <button key={i} onClick={() => toggle(i)} disabled={checked || picked.includes(i)}
            className={cn(
              "px-3 py-2 rounded-[10px] border-2 font-semibold text-sm transition-colors",
              picked.includes(i) ? "opacity-30 border-border" : "border-border hover:bg-muted",
            )}>
            {t}
          </button>
        ))}
      </div>
      {checked && (
        <p className={cn("text-center font-semibold", correct ? "text-emerald-500" : "text-rose-500")}>
          {correct ? "Correct!" : "Not quite."}
        </p>
      )}
      {checked && !correct && (
        <p className="text-sm text-center opacity-70">Answer: {answer.map(i => tokens[i]).join(" ")}</p>
      )}
      <ActionBar
        primary={
          !checked
            ? { label: "Check", disabled: picked.length === 0, onClick: () => setChecked(true) }
            : { label: "Continue", onClick: () => onResult(correct) }
        }
      />
    </div>
  );
}