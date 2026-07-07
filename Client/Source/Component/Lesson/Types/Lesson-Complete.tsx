import { Star } from "lucide-react";
import { Container } from "@/Component/UI/container";
import { cn } from "@/Library/utils";
import { ActionBar } from "./Shared";

// Shown once a runner finishes all steps. Title/stars/stats live in a
// Container; the Continue button uses the same fixed ActionBar as exercises.
interface LessonCompleteScreenProps {
  title: string;
  stars: number;
  practiceTotal: number;
  practiceOk: number;
  accuracy: number;
  perfect: boolean;
  nextInDays: number | null;
  onDone: () => void;
}
export function LessonCompleteScreen({
  title, stars, practiceTotal, practiceOk, accuracy, perfect, nextInDays, onDone,
}: LessonCompleteScreenProps) {
  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6 sm:p-8 text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold">Lesson complete</h2>
        <p className="text-sm opacity-70 capitalize">{title}</p>
        <div className="flex items-center justify-center gap-1 py-2">
          {[1, 2, 3, 4, 5].map(n => (
            <Star key={n} className={cn("h-7 w-7 sm:h-8 sm:w-8", stars >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
          ))}
        </div>
        {practiceTotal > 0 && (
          <p className="text-sm opacity-70">
            Practice: {practiceOk} / {practiceTotal} ({Math.round(accuracy * 100)}%)
            {perfect ? " — perfect!" : ""}
          </p>
        )}
        {stars === 5
          ? <p className="text-sm font-semibold text-amber-500">Mastered ★</p>
          : nextInDays !== null && <p className="text-xs opacity-60">Next review in {nextInDays} day{nextInDays === 1 ? "" : "s"}</p>}
      </Container>
      <ActionBar primary={{ label: "Continue", onClick: onDone }} />
    </div>
  );
}