import { useEffect } from "react";
import { Container } from "@/Component/UI/container";
import { ActionBar, type ExerciseProps } from "./Shared";

export function VocabExercise({ step, onResult }: ExerciseProps) {
  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(step.sound ?? step.letter ?? step.word ?? "");
      u.lang = step.lang ?? "en-US";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch { /* noop */ }
  };
  useEffect(() => { speak(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const main = step.letter ?? step.word ?? step.title;
  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6 text-center space-y-3">
        <button onClick={speak} className="text-7xl font-bold py-4 w-full rounded-[16px] hover:bg-muted transition-colors">
          {main}
        </button>
        {step.uppercase && step.lowercase && (
          <p className="text-2xl font-mono opacity-80">{step.uppercase} · {step.lowercase}</p>
        )}
        {step.ipa && <p className="text-lg opacity-70 font-mono">{step.ipa}</p>}
        {step.note && <p className="text-sm opacity-70">{step.note}</p>}
      </Container>
      <ActionBar
        secondary={{ label: "Play sound", onClick: speak }}
        primary={{ label: "Next", onClick: () => onResult(true) }}
      />
    </div>
  );
}