import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { X, Volume2, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import {
  getAllWords, getWordsForCategory, getWordsForSubcategory, getWordById,
  globalLearningOrder, WordDetail, WordLang,
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
  const answerLang: WordLang = uiLang === "ar" ? "en" : (uiLang as WordLang);

  const initialExercises = useMemo<Exercise[]>(() => {
    const allWords = getAllWords();
    let scopeWordIds: string[];
    if (!practiceScope || practiceScope.type === "global") scopeWordIds = globalLearningOrder;
    else if (practiceScope.type === "category") scopeWordIds = getWordsForCategory(practiceScope.id!).map(w => w.id);
    else if (practiceScope.type === "subcategory") scopeWordIds = getWordsForSubcategory(practiceScope.id!).map(w => w.id);
    else scopeWordIds = [practiceScope.id!];

    const nextIds = getNextWordsForPractice(reviews, scopeWordIds, SESSION_SIZE);
    let words = nextIds.map(id => getWordById(id)).filter((w): w is WordDetail => !!w);

    if (words.length < SESSION_SIZE) {
      const have = new Set(words.map(w => w.id));
      const extra = scopeWordIds.filter(id => !have.has(id))
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
      speakWord: t("speakWord"),
    };
    return words.map((w, i) => buildExercise(w, i, allWords, courseLang, answerLang, labels));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceScope, courseLang, answerLang]);

  // The active queue. Wrongly-answered items get re-queued at the end.
  const [queue, setQueue] = useState<Exercise[]>(initialExercises);
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<any>(null);

  useEffect(() => { setQueue(initialExercises); setStep(0); setCompleted(0); }, [initialExercises]);

  const exitPath = selectedConcept ? `/${selectedConcept}` : "/home";
  const total = initialExercises.length;
  const current = queue[step];

  useEffect(() => {
    if (!current) return;
    if (current.type === "listen-type" && isSpeechAvailable()) {
      const id = setTimeout(() => speak(current.targetText, courseLang), 250);
      return () => clearTimeout(id);
    }
  }, [step, current, courseLang]);

  useEffect(() => {
    if (!current) return;
    if (current.type === "type-target" || current.type === "listen-type") {
      const id = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(id);
    }
  }, [step, current]);

  if (queue.length === 0 || !current) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p>{t("noWords")}</p>
        <Button onClick={() => navigate(exitPath)}>{t("backToHome")}</Button>
      </div>
    );
  }

  const isLast = completed >= total - 1 && queue.length === step + 1;
  const progress = (completed / total) * 100;

  const handleSelect = (i: number) => {
    if (checked) return;
    setSelected(i);
    // TTS the option (target language for ui→target, ui language otherwise)
    if (isSpeechAvailable() && current.options) {
      const text = current.options[i];
      const lang: WordLang = current.type === "mc-ui-to-target" ? courseLang : answerLang;
      speak(text, lang);
    }
  };

  const finalize = (correct: boolean) => {
    setChecked(true);
    setIsCorrect(correct);
    recordReview(current.wordId, correct);
    if (correct) setCompleted(c => c + 1);
  };

  const handleCheck = () => {
    let correct = false;
    if (current.type === "mc-target-to-ui" || current.type === "mc-ui-to-target") {
      if (selected === null) return;
      correct = selected === current.correct;
    } else if (current.type === "speak-target") {
      if (!transcript.trim()) return;
      correct = answersMatch(transcript, current.answer);
    } else {
      if (!typedAnswer.trim()) return;
      correct = answersMatch(typedAnswer, current.answer);
    }
    finalize(correct);
  };

  const advance = () => {
    // Re-queue incorrect at the end
    let nextQueue = queue;
    if (isCorrect === false) nextQueue = [...queue, current];

    if (step >= nextQueue.length - 1) {
      navigate(exitPath);
      return;
    }
    setQueue(nextQueue);
    setStep(step + 1);
    setSelected(null);
    setTypedAnswer("");
    setTranscript("");
    setChecked(false);
    setIsCorrect(null);
  };

  // STT
  const SR: any = typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;
  const sttAvailable = !!SR;

  const toggleListen = () => {
    if (!SR) return;
    if (listening) { recRef.current?.stop?.(); return; }
    const rec = new SR();
    rec.lang = courseLang === "nl" ? "nl-NL" : "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript || "";
      setTranscript(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setTranscript("");
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
  const isMC = current.type === "mc-target-to-ui" || current.type === "mc-ui-to-target";
  const isListen = current.type === "listen-type";
  const isSpeak = current.type === "speak-target";

  const canCheck = isMC ? selected !== null
    : isSpeak ? transcript.trim().length > 0
    : typedAnswer.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center gap-3 p-4">
        <Button size="icon" onClick={() => navigate(exitPath)}>
          <X className="h-5 w-5" />
        </Button>
        <div className="flex-1 h-3 bg-white border-2 border-black rounded-full overflow-hidden">
          <div className="h-full bg-black transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 p-6 max-w-md mx-auto w-full">
        <h2 className="text-lg font-semibold mb-6">{current.prompt}</h2>

        {(isListen || isSpeak) && (
          <div className="mb-6 flex justify-center gap-3">
            {isSpeechAvailable() && (
              <Button size="icon" onClick={() => speak(current.targetText, courseLang)}
                aria-label={t("play")} className="h-16 w-16">
                <Volume2 className="h-7 w-7" />
              </Button>
            )}
            {isSpeak && sttAvailable && (
              <Button size="icon" active={listening} onClick={toggleListen}
                aria-label={t("speakNow")} className="h-16 w-16">
                {listening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
              </Button>
            )}
          </div>
        )}

        {isSpeak && transcript && (
          <Container className="mb-4 text-sm">
            <span className="opacity-60 mr-1">»</span>
            <span className="font-medium">{transcript}</span>
          </Container>
        )}

        {isMC && current.options && (
          <div className="space-y-2">
            {current.options.map((opt, i) => (
              <Button
                key={i}
                active={selected === i && !checked}
                variant={checked && selected === i
                  ? isCorrect ? "primary" : "destructive"
                  : "secondary"}
                fullWidth
                disabled={checked}
                onClick={() => handleSelect(i)}
              >
                {opt}
              </Button>
            ))}
          </div>
        )}

        {!isMC && !isSpeak && (
          <Input
            ref={inputRef}
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !checked && canCheck) handleCheck(); }}
            placeholder={t("yourAnswer")}
            disabled={checked}
            className={cn(
              "h-12 text-base border-2 border-black rounded-[40px] px-4",
              checked && (isCorrect ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground")
            )}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          />
        )}

        {checked && !isCorrect && (() => {
          const correctText = isMC && current.options ? current.options[current.correct!] : current.answer;
          const userText = isMC && current.options && selected !== null ? current.options[selected]
            : isSpeak ? transcript : typedAnswer;
          const correctLang: WordLang = current.type === "mc-target-to-ui" ? answerLang : courseLang;
          return (
            <Container className="mt-4 border-destructive bg-destructive/5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                    {t("incorrect")}
                  </p>
                  {userText && (
                    <p className="text-sm opacity-70">
                      <span className="opacity-60 mr-1">{t("yourAnswerWas")}:</span>
                      <span className="line-through">{userText}</span>
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="opacity-60 mr-1">{t("correctAnswer")}:</span>
                    <span className="font-semibold text-base">{correctText}</span>
                  </p>
                </div>
                {isSpeechAvailable() && (
                  <Button
                    size="icon"
                    onClick={() => speak(correctText, correctLang)}
                    aria-label={t("play")}
                    className="shrink-0"
                  >
                    <Volume2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </Container>
          );
        })()}
        {checked && isCorrect && (
          <Container className="mt-4">
            <p className="text-sm font-medium">{t(randomEncouragement)} ✨</p>
          </Container>
        )}
      </div>

      <div className="p-4 max-w-md mx-auto w-full space-y-2">
        {!checked ? (
          <>
            <Button fullWidth disabled={!canCheck} onClick={handleCheck}>{t("check")}</Button>
            <Button fullWidth onClick={advance}
              className="bg-black text-white border-white hover:bg-white hover:text-black hover:border-black">
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
