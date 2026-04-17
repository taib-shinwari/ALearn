import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  getAllWords,
  getWordsForCategory,
  getWordsForSubcategory,
  getWordById,
  globalLearningOrder,
  WordDetail,
  WordLang,
  getWordText,
} from "@/data/courseData";
import { getNextWordsForPractice } from "@/lib/spacedRepetition";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

interface Exercise {
  wordId: string;
  question: string;
  options: string[];
  correct: number;
}

const encouragements = ["greatJob", "keepGoing", "nice", "perfect", "wellDone", "awesome"] as const;

function generateExercises(
  words: WordDetail[],
  allWords: WordDetail[],
  courseLang: WordLang,
  answerLang: WordLang,
  tWhatDoes: string
): Exercise[] {
  return words.map(word => {
    const wrongOptions = allWords
      .filter(w => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => getWordText(w, answerLang));

    const correctAnswer = getWordText(word, answerLang);
    const options = [...wrongOptions, correctAnswer].sort(() => Math.random() - 0.5);
    const correct = options.indexOf(correctAnswer);

    return {
      wordId: word.id,
      question: `${tWhatDoes} "${getWordText(word, courseLang)}"?`,
      options,
      correct,
    };
  });
}

export default function PracticePage() {
  const navigate = useNavigate();
  const { practiceScope, reviews, recordReview, selectedConcept } = useApp();
  const { courseLang, uiLang, t } = useCourseLanguage();

  // Answer options must be a language that exists in word data: nl/en.
  // If interface is Arabic, fall back to English for answers.
  const answerLang: WordLang = uiLang === "ar" ? "en" : (uiLang as WordLang);

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
      scopeWordIds = [practiceScope.id!];
    }

    const nextWordIds = getNextWordsForPractice(reviews, scopeWordIds, 5);

    const words = nextWordIds
      .map(id => getWordById(id))
      .filter((w): w is WordDetail => !!w);

    if (words.length === 0) {
      const fallback = scopeWordIds
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map(id => getWordById(id))
        .filter((w): w is WordDetail => !!w);
      return generateExercises(fallback, allWords, courseLang, answerLang, t("whatDoes"));
    }

    return generateExercises(words, allWords, courseLang, answerLang, t("whatDoes"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceScope, reviews, courseLang, answerLang]);

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [sessionDone, setSessionDone] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

  const exitPath = selectedConcept ? `/${selectedConcept}` : "/home";

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p>{t("noWords")}</p>
        <Button onClick={() => navigate(exitPath)}>{t("backToHome")}</Button>
      </div>
    );
  }

  if (sessionDone) {
    const accuracy = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-2">🎉</h1>
        <h2 className="text-xl font-bold mb-6">{t("sessionComplete")}</h2>

        <div className="grid grid-cols-2 gap-4 w-full mb-8">
          <Container className="text-center p-3">
            <p className="text-2xl font-bold">{sessionStats.total}</p>
            <p className="text-xs opacity-70">{t("wordsLearned")}</p>
          </Container>
          <Container className="text-center p-3">
            <p className="text-2xl font-bold">{accuracy}%</p>
            <p className="text-xs opacity-70">{t("accuracy")}</p>
          </Container>
        </div>

        <Button onClick={() => navigate(exitPath)} fullWidth>{t("continue")}</Button>
      </div>
    );
  }

  const current = exercises[step];
  const isLast = step === exercises.length - 1;
  const progress = ((step + (checked && isCorrect ? 1 : 0)) / exercises.length) * 100;

  const handleSelect = (i: number) => {
    if (checked) return;
    setSelected(i);
  };

  const handleCheck = () => {
    if (selected === null) return;
    const correct = selected === current.correct;
    setChecked(true);
    setIsCorrect(correct);
    recordReview(current.wordId, correct);
    setSessionStats(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  };

  const advance = () => {
    if (isLast) {
      setSessionDone(true);
    } else {
      setStep(step + 1);
      setSelected(null);
      setChecked(false);
      setIsCorrect(null);
    }
  };

  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center gap-3 p-4">
        <Button size="icon" onClick={() => navigate(exitPath)}>
          <X className="h-5 w-5" />
        </Button>
        <div className="flex-1 h-3 bg-white border-2 border-black rounded-full overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 p-6 max-w-md mx-auto w-full">
        <h2 className="text-lg font-semibold mb-6">{current.question}</h2>
        <div className="space-y-2">
          {current.options.map((opt, i) => (
            <Button
              key={i}
              active={selected === i && !checked}
              variant={
                checked && selected === i
                  ? isCorrect ? "primary" : "destructive"
                  : "secondary"
              }
              fullWidth
              disabled={checked}
              onClick={() => handleSelect(i)}
            >
              {opt}
            </Button>
          ))}
        </div>

        {checked && !isCorrect && (
          <Container className="mt-4 border-destructive">
            <p className="text-sm font-medium text-destructive">{t("incorrect")}</p>
            <p className="text-sm mt-1">{t("correctAnswer")}: <span className="font-medium">{current.options[current.correct]}</span></p>
          </Container>
        )}
        {checked && isCorrect && (
          <Container className="mt-4">
            <p className="text-sm font-medium">{t(randomEncouragement)} ✨</p>
          </Container>
        )}
      </div>

      <div className="p-4 max-w-md mx-auto w-full space-y-2">
        {!checked ? (
          <>
            <Button fullWidth disabled={selected === null} onClick={handleCheck}>
              {t("check")}
            </Button>
            <Button variant="ghost" fullWidth onClick={advance}>
              {t("skip")}
            </Button>
          </>
        ) : (
          <Button fullWidth onClick={advance}>
            {isLast ? t("finish") : t("continue")}
          </Button>
        )}
      </div>
    </div>
  );
}
