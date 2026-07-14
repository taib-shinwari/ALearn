import { useState } from "react";
import { Container } from "@/Component/UI/container";
import { cn } from "@/Library/utils";
import { ActionBar, type ExerciseProps } from "./Shared";

export function ImageSelectExercise({ step, onResult }: ExerciseProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correctIdx = step.options.findIndex((o: any) => o.correct);
  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold">{step.prompt}</h2>
      </Container>
      <div className="grid grid-cols-2 gap-3">
        {step.options.map((opt: any, i: number) => (
          <button key={i} disabled={checked} onClick={() => setPicked(i)}
            className={cn(
              "rounded-[14px] border-2 overflow-hidden aspect-square flex items-center justify-center",
              !checked && picked === i && "border-foreground",
              !checked && picked !== i && "border-border hover:bg-muted",
              checked && i === correctIdx && "border-emerald-500",
              checked && picked === i && i !== correctIdx && "border-rose-500",
            )}>
            {opt.image
              ? <img src={opt.image} alt={opt.label ?? ""} className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold p-4 text-center">{opt.label ?? "?"}</span>}
          </button>
        ))}
      </div>
      <ActionBar
        primary={
          !checked
            ? { label: "Check", disabled: picked === null, onClick: () => setChecked(true) }
            : { label: "Continue", onClick: () => onResult(picked === correctIdx) }
        }
      />
    </div>
  );
}