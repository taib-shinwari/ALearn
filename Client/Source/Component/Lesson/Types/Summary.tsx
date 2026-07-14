import { Container } from "@/Component/UI/container";
import { ActionBar, type ExerciseProps } from "./Shared";

export function SummaryExercise({ step, onResult }: ExerciseProps) {
  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-3">{step.title ?? "You learned"}</h2>
        <ul className="space-y-2 text-sm">
          {(step.points ?? []).map((p: string, i: number) => (
            <li key={i} className="flex gap-2"><span className="opacity-60">✓</span><span>{p}</span></li>
          ))}
        </ul>
      </Container>
      <ActionBar primary={{ label: "Finish", onClick: () => onResult(true) }} />
    </div>
  );
}