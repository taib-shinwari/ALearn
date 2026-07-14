import { Container } from "@/Component/UI/container";
import { ActionBar, type ExerciseProps } from "./Shared";

export function DidYouKnowExercise({ step, onResult }: ExerciseProps) {
  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6 text-center">
        <p className="text-base leading-relaxed">{step.fact}</p>
      </Container>
      <ActionBar primary={{ label: "Cool", onClick: () => onResult(true) }} />
    </div>
  );
}