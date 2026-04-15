import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  getAllWords,
  getWordsForCategory,
  getWordsForSubcategory,
  getWordById,
  globalLearningOrder,
  WordDetail,
} from "@/data/courseData";
import { getNextWordsForPractice } from "@/lib/spacedRepetition";

interface Exercise {
  wordId: string;
  question: string;
  options: string[];
  correct: number;
}

function generateExercises(words: WordDetail[], allWords: WordDetail[]): Exercise[] {
  return words.map(word => {
    // Pick 3 random wrong answers from allWords
    const wrongOptions = allWords
      .filter(w => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.translation);

    const options = [...wrongOptions, word.translation].sort(() => Math.random() - 0.5);
    const correct = options.indexOf(word.translation);

    return {
      wordId: word.id,
      question: `What does "${word.word}" mean?`,
      options,
      correct,
    };
  });
}

export default function PracticePage() {
  const navigate = useNavigate();
  const { practiceScope, reviews, recordReview } = useApp();

  const exercises = useMemo(() => {
    const allWords = getAllWords();
    let scopeWordIds: string[];

    if (!practiceScope || practiceScope.type === "global") {
      scopeWordIds = globalLearningOrder;
    } else if (practiceScope.type === "category") {
      scopeWordIds = getWordsForCategory(practiceScope.id!).map(w => w.id);
    } else if (practiceScope.type === "subcategory") {
      scopeWordIds = getWordsForSubcategory(practiceScope.id!).map(w => w.id);
    } else {
      // single word
      scopeWordIds = [practiceScope.id!];
    }

    // Get next words using spaced repetition
    const nextWordIds = getNextWordsForPractice(reviews, scopeWordIds, 5);

    const words = nextWordIds
      .map(id => getWordById(id))
      .filter((w): w is WordDetail => !!w);

    if (words.length === 0) {
      // Fallback: if all words are reviewed and none due, pick random ones
      const fallback = scopeWordIds
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map(id => getWordById(id))
        .filter((w): w is WordDetail => !!w);
      return generateExercises(fallback, allWords);
    }

    return generateExercises(words, allWords);
  }, [practiceScope, reviews]);

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p>No words available for practice.</p>
        <Button onClick={() => navigate("/home")}>Back to Home</Button>
      </div>
    );
  }

  const current = exercises[step];
  const isLast = step === exercises.length - 1;
  const progress = ((step + (checked && isCorrect ? 1 : 0)) / exercises.length) * 100;

  const handleCheck = () => {
    if (selected === null) return;
    const correct = selected === current.correct;
    setChecked(true);
    setIsCorrect(correct);
    recordReview(current.wordId, correct);
  };

  const handleContinue = () => {
    if (isLast) {
      navigate("/home");
    } else {
      setStep(step + 1);
      setSelected(null);
      setChecked(false);
      setIsCorrect(null);
    }
  };

  const handleSkip = () => {
    if (isLast) {
      navigate("/home");
    } else {
      setStep(step + 1);
      setSelected(null);
      setChecked(false);
      setIsCorrect(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center gap-3 p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
          <X className="h-5 w-5" />
        </Button>
        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 p-6 max-w-md mx-auto w-full">
        <h2 className="text-lg font-medium mb-6">{current.question}</h2>
        <div className="space-y-2">
          {current.options.map((opt, i) => {
            let variant: "outline" | "default" | "destructive" = "outline";
            if (checked && selected === i) {
              variant = isCorrect ? "default" : "destructive";
            } else if (!checked && selected === i) {
              variant = "default";
            }
            return (
              <Button
                key={i}
                variant={variant}
                className="w-full"
                disabled={checked}
                onClick={() => setSelected(i)}
              >
                {opt}
              </Button>
            );
          })}
        </div>

        {checked && !isCorrect && (
          <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-medium text-destructive">Incorrect</p>
            <p className="text-sm mt-1">Correct answer: <span className="font-medium">{current.options[current.correct]}</span></p>
          </div>
        )}
        {checked && isCorrect && (
          <div className="mt-4 p-3 rounded-md bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium text-primary">Correct!</p>
          </div>
        )}
      </div>

      <div className="p-4 max-w-md mx-auto w-full space-y-2">
        {!checked ? (
          <>
            <Button className="w-full" disabled={selected === null} onClick={handleCheck}>
              Check
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleSkip}>
              Skip
            </Button>
          </>
        ) : (
          <Button className="w-full" onClick={handleContinue}>
            {isLast ? "Finish" : "Continue"}
          </Button>
        )}
      </div>
    </div>
  );
}
