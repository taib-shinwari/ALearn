import { useState } from "react";
import { Container } from "@/Component/UI/container";
import { cn } from "@/Library/utils";
import { ActionBar, type ExerciseProps } from "./Shared";

export function TypeAnswerExercise({ step, onResult }: ExerciseProps) {
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(false);
  const correct = text.trim().toLowerCase() === String(step.answer).trim().toLowerCase();
  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold">{step.prompt}</h2>
      </Container>
      <input
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={checked}
        className="w-full px-4 py-3 rounded-[12px] border-2 border-border bg-background"
      />
      {checked && (
        <p className={cn("text-center font-semibold", correct ? "text-emerald-500" : "text-rose-500")}>
          {correct ? "Correct!" : `Answer: ${step.answer}`}
        </p>
      )}
      <ActionBar
        primary={
          !checked
            ? { label: "Check", disabled: !text, onClick: () => setChecked(true) }
            : { label: "Continue", onClick: () => onResult(correct) }
        }
      />
    </div>
  );
}