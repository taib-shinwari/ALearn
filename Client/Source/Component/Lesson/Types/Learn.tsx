import { Container } from "@/Component/UI/container";
import { ActionBar, type ExerciseProps } from "./Shared";

export function LearnExercise({ step, onResult }: ExerciseProps) {
  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6 text-center space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold">{step.word ?? step.title}</h2>
        {step.ipa && <p className="text-lg opacity-80 font-mono">{step.ipa}</p>}
        {step.note && <p className="text-sm opacity-70">{step.note}</p>}
      </Container>
      <ActionBar primary={{ label: "Got it", onClick: () => onResult(true) }} />
    </div>
  );
}