import { useState } from "react";
import { Container } from "@/Component/UI/container";
import { ActionBar, type ExerciseProps } from "./Shared";

export function FlashcardExercise({ step, onResult }: ExerciseProps) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6 text-center">
        <button
          onClick={() => setFlipped(f => !f)}
          className="w-full min-h-[160px] rounded-2xl border-2 border-border flex items-center justify-center text-3xl font-bold hover:bg-muted"
        >
          {flipped ? step.back : step.front}
        </button>
      </Container>
      <ActionBar
        secondary={{ label: "Hard", onClick: () => onResult(false) }}
        primary={{ label: "Easy", onClick: () => onResult(true) }}
      />
    </div>
  );
}