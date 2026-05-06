import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { X, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import {
  getAllWords,
  getWordsForCategory,
  getWordsForSubcategory,
  getWordById,
  globalLearningOrder,
  WordDetail,
  WordLang,
} from "@/data/courseData";
import { getNextWordsForPractice } from "@/lib/spacedRepetition";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { buildExercise, answersMatch, Exercise } from "@/components/practice/exerciseGenerator";
import { speak, isSpeechAvailable } from "@/components/practice/speech";

const SESSION_SIZE = 10;
const encouragements = ["greatJob", "keepGoing", "nice", "perfect", "wellDone", "awesome"] as const;

export default function PracticePage() {
  const navigate = useNavigate();
  const { practiceScope, reviews, recordReview, selectedConcept } = useApp();
  const { courseLang, uiLang, t } = useCourseLanguage();

  // Words exist only in nl/en. Arabic interface falls back to English answers.
  const answerLang: WordLang = uiLang === "ar" ? "en" : (uiLang as WordLang);

  const exercises = useMemo<Exercise[]>(() => {
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

    const nextIds = getNextWordsForPractice(reviews, scopeWordIds, SESSION_SIZE);
    let words = nextIds.map(id => getWordById(id)).filter((w): w is WordDetail => !!w);

    // Top up with random scope words if SR returned too few.
    if (words.length < SESSION_SIZE) {
      const have = new Set(words.map(w => w.id));
      const extra = scopeWordIds
        .filter(id => !have.has(id))
        .sort(() => Math.random() - 0.5)
        .slice(0, SESSION_SIZE - words.length)
        .map(id => getWordById(id))
        .filter((w): w is WordDetail => !!w);
      words = [...words, ...extra];
    }

    const labels = {
      whatDoes: t("whatDoes"),
      typeAnswer: t("typeAnswer"),
      listenAndType: t("listenAndType"),
      selectMeaning: t("selectMeaning"),
    };

    return words.map((w, i) => buildExercise(w, i, allWords, courseLang, answerLang, labels));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceScope, reviews, courseLang, answerLang]);

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const exitPath = selectedConcept ? `/${selectedConcept}` : "/home";

  // Auto-play audio when a listen exercise appears
  useEffect(() => {
    if (exercises.length === 0) return;
    const ex = exercises[step];
    if (ex?.type === "listen-type" && isSpeechAvailable()) {
      const id = setTimeout(() => speak(ex.targetText, courseLang), 250);
      return () => clearTimeout(id);
    }
  }, [step, exercises, courseLang]);

  // Focus input when entering a typing exercise
  useEffect(() => {
    if (exercises.length === 0) return;
    const ex = exercises[step];
    if (ex?.type === "type-target" || ex?.type === "listen-type") {
      const id = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(id);
    }
  }, [step, exercises]);

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p>{t("noWords")}</p>
        <Button onClick={() => navigate(exitPath)}>{t("backToHome")}</Button>
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
    let correct = false;
    if (current.type === "mc-target-to-ui" || current.type === "mc-ui-to-target") {
      if (selected === null) return;
      correct = selected === current.correct;
    } else {
      if (!typedAnswer.trim()) return;
      correct = answersMatch(typedAnswer, current.answer);
    }
    setChecked(true);
    setIsCorrect(correct);
    recordReview(current.wordId, correct);
  };

  const advance = () => {
    if (isLast) {
      // No completion screen — return to the active concept root immediately.
      navigate(exitPath);
      return;
    }
    setStep(step + 1);
    setSelected(null);
    setTypedAnswer("");
    setChecked(false);
    setIsCorrect(null);
  };

  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
  const isMC = current.type === "mc-target-to-ui" || current.type === "mc-ui-to-target";
  const isListen = current.type === "listen-type";

  const canCheck = isMC ? selected !== null : typedAnswer.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar: close + progress */}
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
        <h2 className="text-lg font-semibold mb-6">{current.prompt}</h2>

        {/* Listen exercise: replay button */}
        {isListen && (
          <div className="mb-6 flex justify-center">
            <Button
              size="icon"
              onClick={() => speak(current.targetText, courseLang)}
              aria-label={t("play")}
              className="h-16 w-16"
            >
              <Volume2 className="h-7 w-7" />
            </Button>
          </div>
        )}

        {/* Multiple-choice options */}
        {isMC && current.options && (
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
        )}

        {/* Typed-answer input (also used for listen exercises) */}
        {!isMC && (
          <div className="space-y-2">
            <Input
              ref={inputRef}
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !checked && canCheck) handleCheck();
              }}
              placeholder={t("yourAnswer")}
              disabled={checked}
              className={cn(
                "h-12 text-base border-2 border-black rounded-[40px] px-4",
                checked && (isCorrect ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground")
              )}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>
        )}

        {/* Feedback */}
        {checked && !isCorrect && (
          <Container className="mt-4 border-destructive">
            <p className="text-sm font-medium text-destructive">{t("incorrect")}</p>
            <p className="text-sm mt-1">
              {t("correctAnswer")}:{" "}
              <span className="font-medium">
                {isMC && current.options ? current.options[current.correct!] : current.answer}
              </span>
            </p>
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
            <Button fullWidth disabled={!canCheck} onClick={handleCheck}>
              {t("check")}
            </Button>
            <Button
              fullWidth
              onClick={advance}
              className="bg-black text-white border-white hover:bg-white hover:text-black hover:border-black"
            >
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
