// Barrel export + dispatcher for every exercise type. This is the single
// entry point the rest of the app imports from.
import type { ExerciseProps } from "./Shared";
import { LearnExercise } from "./Learn";
import { FlashcardExercise } from "./Flashcard";
import { MultipleChoiceExercise } from "./Multiple-Choice";
import { MatchPairsExercise } from "./Match-Pairs";
import { BuildExercise } from "./Build-The-Answer";
import { TypeAnswerExercise } from "./Type-Answer";
import { ImageSelectExercise } from "./Image-Select";
import { ObjectiveExercise } from "./Objective";
import { ExplanationExercise } from "./Explanation";
import { DidYouKnowExercise } from "./Did-You-Know";
import { VocabExercise } from "./Vocabulary";
import { SummaryExercise } from "./Summary";
import { LessonCompleteScreen } from "./Lesson-Complete";

export type { ExerciseProps };
export { ActionBar, shuffle } from "./Shared";
export { LearnExercise } from "./Learn";
export { FlashcardExercise } from "./Flashcard";
export { MultipleChoiceExercise } from "./Multiple-Choice";
export { MatchPairsExercise } from "./Match-Pairs";
export { BuildExercise } from "./Build-The-Answer";
export { TypeAnswerExercise } from "./Type-Answer";
export { ImageSelectExercise } from "./Image-Select";
export { ObjectiveExercise } from "./Objective";
export { ExplanationExercise } from "./Explanation";
export { DidYouKnowExercise } from "./Did-You-Know";
export { VocabExercise } from "./Vocabulary";
export { SummaryExercise } from "./Summary";
export { LessonCompleteScreen } from "./Lesson-Complete";

// ── Dispatcher ───────────────────────────────────────────────────────────────
export function Exercise({ step, onResult }: ExerciseProps) {
  switch (step.kind) {
    case "objective":        return <ObjectiveExercise step={step} onResult={onResult} />;
    case "explanation":      return <ExplanationExercise step={step} onResult={onResult} />;
    case "didYouKnow":       return <DidYouKnowExercise step={step} onResult={onResult} />;
    case "vocab":            return <VocabExercise step={step} onResult={onResult} />;
    case "summary":          return <SummaryExercise step={step} onResult={onResult} />;
    case "activeRecall":     return <ExplanationExercise step={step} onResult={onResult} />;
    case "learn":            return <LearnExercise step={step} onResult={onResult} />;
    case "flashcard":        return <FlashcardExercise step={step} onResult={onResult} />;
    case "multipleChoice":   return <MultipleChoiceExercise step={step} onResult={onResult} />;
    case "matchPairs":       return <MatchPairsExercise step={step} onResult={onResult} />;
    case "buildTranslation":
    case "orderSentence":    return <BuildExercise step={step} onResult={onResult} />;
    case "fillBlank":
    case "typeAnswer":
    case "listenType":       return <TypeAnswerExercise step={step} onResult={onResult} />;
    case "imageSelect":      return <ImageSelectExercise step={step} onResult={onResult} />;
    case "listenChoose":     return <MultipleChoiceExercise step={step} onResult={onResult} />;
    case "speaking":         return <LearnExercise step={step} onResult={onResult} />;
    default:                 return <LearnExercise step={step} onResult={onResult} />;
  }
}