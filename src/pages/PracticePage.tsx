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
import { selectSessionWords, adaptiveSessionSize } from "@/lib/adaptiveEngine";
import { siblingWordIdsForLesson, findNodeByLesson } from "@/lib/sessionScope";
import { getNodeMastery } from "@/lib/mastery";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import {
  buildExercise, buildMatchPairs, answersMatch, normalizeAnswer,
  Exercise, ExerciseLabels,
} from "@/components/practice/exerciseGenerator";
import { speak, isSpeechAvailable } from "@/components/practice/speech";
import { TapTiles } from "@/components/practice/TapTiles";
import { MatchPairs } from "@/components/practice/MatchPairs";
import { SessionSummary } from "@/components/practice/SessionSummary";

const encouragements = ["greatJob", "keepGoing", "nice", "perfect", "wellDone", "awesome"] as const;

export default function PracticePage() {
  const navigate = useNavigate();
  const {
    practiceScope, reviews, recordReview, selectedConcept,
    markLessonComplete, exerciseStats, recordExerciseResult, pathProgress,
  } = useApp();
  const { courseLang, uiLang, t } = useCourseLanguage();
  const answerLang: WordLang = uiLang === "ar" ? "en" : (uiLang as WordLang);

  // STT availability (used for type selection too)
  const SR: any = typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;
  const sttAvailable = !!SR;

  const sessionStart = useRef(Date.now());
  const masteryBefore = useRef<Map<string, { title: string; before: number }>>(new Map());

  const initialExercises = useMemo<Exercise[]>(() => {
    const allWords = getAllWords();
    let scopeWordIds: string[];
    if (!practiceScope || practiceScope.type === "global") scopeWordIds = globalLearningOrder;
    else if (practiceScope.type === "category") scopeWordIds = getWordsForCategory(practiceScope.id!).map(w => w.id);
    else if (practiceScope.type === "subcategory") scopeWordIds = getWordsForSubcategory(practiceScope.id!).map(w => w.id);
    else scopeWordIds = [practiceScope.id!];

    const siblingWordIds = practiceScope?.lessonId
      ? siblingWordIdsForLesson(practiceScope.lessonId)
      : [];

    // Snapshot mastery before this session for the summary
    if (practiceScope?.lessonId) {
      const node = findNodeByLesson(practiceScope.lessonId);
      if (node) {
        masteryBefore.current.set(node.id, {
          title: (node.title as any)[uiLang] || node.title.en,
          before: getNodeMastery(node, pathProgress),
        });
      }
    }

    const count = adaptiveSessionSize(reviews);
    const ids = selectSessionWords({ reviews, scopeWordIds, siblingWordIds, count });
    const words = ids.map(getWordById).filter((w): w is WordDetail => !!w);

    const labels: ExerciseLabels = {
      whatDoes: t("whatDoes"),
      typeAnswer: t("typeAnswer"),
      listenAndType: t("listenAndType"),
      selectMeaning: t("selectMeaning"),
      speakWord: t("speakWord"),
      buildSentence: uiLang === "nl" ? "Bouw de zin" : uiLang === "ar" ? "كوّن الجملة" : "Build the sentence",
      dictation: uiLang === "nl" ? "Schrijf wat je hoort" : uiLang === "ar" ? "اكتب ما تسمع" : "Write what you hear",
      matchPairs: uiLang === "nl" ? "Verbind de paren" : uiLang === "ar" ? "طابِق الأزواج" : "Match the pairs",
    };

    const exercises: Exercise[] = words.map((w, i) =>
      buildExercise(w, i, allWords, courseLang, answerLang, labels, exerciseStats, sttAvailable),
    );

    // Inject a Match-Pairs round every ~5 cards
    if (words.length >= 4) {
      const matchEx = buildMatchPairs(
        [...words].sort(() => Math.random() - 0.5).slice(0, 4),
        courseLang, answerLang, labels,
      );
      if (matchEx) {
        const at = Math.min(exercises.length, Math.floor(exercises.length / 2));
        exercises.splice(at, 0, matchEx);
      }
    }
    return exercises;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceScope, courseLang, answerLang]);

  const [queue, setQueue] = useState<Exercise[]>(initialExercises);
  const [step, setStep] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<any>(null);

  useEffect(() => {
    setQueue(initialExercises);
    setStep(0); setCorrectCount(0); setFinished(false);
    sessionStart.current = Date.now();
  }, [initialExercises]);

  const exitPath = selectedConcept ? `/${selectedConcept}` : "/home";
  const total = initialExercises.length;
  const current = queue[step];

  useEffect(() => {
    if (!current) return;
    if ((current.type === "listen-type" || current.type === "dictation") && isSpeechAvailable()) {
      const id = setTimeout(() => speak(current.answer, courseLang), 250);
      return () => clearTimeout(id);
    }
  }, [step, current, courseLang]);

  useEffect(() => {
    if (!current) return;
    if (["type-target", "listen-type", "dictation"].includes(current.type)) {
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

  if (finished) {
    const deltas: { nodeId: string; title: string; before: number; after: number }[] = [];
    for (const [nodeId, snap] of masteryBefore.current.entries()) {
      const node = findNodeByLesson(
        // find any lesson belonging to this node to refresh mastery
        // (mastery is per-node so this is just a re-read)
        practiceScope?.lessonId ?? "",
      );
      if (!node || node.id !== nodeId) continue;
      deltas.push({
        nodeId,
        title: snap.title,
        before: snap.before,
        after: getNodeMastery(node, pathProgress),
      });
    }
    return (
      <SessionSummary
        total={total}
        correct={correctCount}
        durationMs={Date.now() - sessionStart.current}
        deltas={deltas}
        onContinue={() => navigate(exitPath)}
        continueLabel={t("continue")}
        headingLabel={uiLang === "nl" ? "Sessie voltooid!" : uiLang === "ar" ? "اكتملت الجلسة!" : "Session complete!"}
      />
    );
  }

  const isMC = current.type === "mc-target-to-ui" || current.type === "mc-ui-to-target";
  const isListen = current.type === "listen-type";
  const isSpeak = current.type === "speak-target";
  const isDictation = current.type === "dictation";
  const isTapTiles = current.type === "tap-tiles";
  const isMatch = current.type === "match-pairs";
  const isText = current.type === "type-target" || isListen || isDictation;

  const progress = (step / total) * 100;

  const handleSelect = (i: number) => {
    if (checked) return;
    setSelected(i);
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
    recordExerciseResult(current.type, correct);
    if (correct) setCorrectCount(c => c + 1);
  };

  const handleCheck = () => {
    let correct = false;
    if (isMC) {
      if (selected === null) return;
      correct = selected === current.correct;
    } else if (isSpeak) {
      if (!transcript.trim()) return;
      correct = answersMatch(transcript, current.answer);
    } else if (isTapTiles) {
      if (picked.length === 0) return;
      const built = picked.map(i => current.options![i]).join(" ");
      correct = normalizeAnswer(built) === normalizeAnswer(current.answer);
    } else {
      if (!typedAnswer.trim()) return;
      correct = answersMatch(typedAnswer, current.answer);
    }
    finalize(correct);
  };

  const advance = () => {
    let nextQueue = queue;
    if (isCorrect === false && !isMatch) nextQueue = [...queue, current];

    if (step >= nextQueue.length - 1) {
      // Star the lesson + show summary
      if (practiceScope?.lessonId) {
        const accuracy = total > 0 ? correctCount / total : 0;
        const stars: 0 | 1 | 2 | 3 = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : accuracy > 0 ? 1 : 0;
        markLessonComplete(practiceScope.lessonId, stars);
      }
      setFinished(true);
      return;
    }
    setQueue(nextQueue);
    setStep(step + 1);
    setSelected(null);
    setTypedAnswer("");
    setPicked([]);
    setTranscript("");
    setChecked(false);
    setIsCorrect(null);
  };

  // Match-pairs auto-completes itself
  const onMatchComplete = (perfect: boolean, perWord: Record<string, boolean>) => {
    for (const [wid, ok] of Object.entries(perWord)) {
      recordReview(wid, ok);
    }
    recordExerciseResult("match-pairs", perfect);
    if (perfect) setCorrectCount(c => c + 1);
    setChecked(true);
    setIsCorrect(perfect);
  };

  const toggleListen = () => {
    if (!SR) return;
    if (listening) { recRef.current?.stop?.(); return; }
    const rec = new SR();
    rec.lang = courseLang === "nl" ? "nl-NL" : courseLang === "ar" ? "ar-SA" : "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => setTranscript(e.results[0][0].transcript || "");
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setTranscript("");
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
  const canCheck = isMatch ? false
    : isMC ? selected !== null
    : isSpeak ? transcript.trim().length > 0
    : isTapTiles ? picked.length > 0
    : typedAnswer.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center gap-3 p-4">
        <Button size="icon" onClick={() => navigate(exitPath)}>
          <X className="h-5 w-5" />
        </Button>
        <div className="flex-1 h-3 bg-background border-2 border-border rounded-full overflow-hidden">
          <div className="h-full bg-foreground transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 p-6 max-w-md mx-auto w-full">
        <h2 className="text-lg font-semibold mb-6">{current.prompt}</h2>

        {(isListen || isSpeak || isDictation) && (
          <div className="mb-6 flex justify-center gap-3">
            {isSpeechAvailable() && (
              <Button size="icon" onClick={() => speak(current.answer, courseLang)}
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

        {isMatch && current.pairs && (
          <MatchPairs pairs={current.pairs} onComplete={onMatchComplete} />
        )}

        {isTapTiles && current.options && (
          <TapTiles
            options={current.options}
            picked={picked}
            onPick={(i) => setPicked(p => p.includes(i) ? p : [...p, i])}
            onUnpick={(pos) => setPicked(p => p.filter((_, idx) => idx !== pos))}
            disabled={checked}
          />
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

        {isText && (
          <Input
            ref={inputRef}
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !checked && canCheck) handleCheck(); }}
            placeholder={t("yourAnswer")}
            disabled={checked}
            className={cn(
              "h-12 text-base border-2 border-border rounded-[40px] px-4",
              checked && (isCorrect ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground")
            )}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          />
        )}

        {checked && !isCorrect && !isMatch && (() => {
          const correctText = isMC && current.options ? current.options[current.correct!] : current.answer;
          const userText = isMC && current.options && selected !== null ? current.options[selected]
            : isSpeak ? transcript
            : isTapTiles ? picked.map(i => current.options![i]).join(" ")
            : typedAnswer;
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
                  <Button size="icon" onClick={() => speak(correctText, correctLang)}
                    aria-label={t("play")} className="shrink-0">
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
        {!checked && !isMatch ? (
          <>
            <Button fullWidth disabled={!canCheck} onClick={handleCheck}>{t("check")}</Button>
            <Button fullWidth onClick={advance}
              className="bg-foreground text-background border-background hover:bg-background hover:text-foreground hover:border-border">
              {t("skip")}
            </Button>
          </>
        ) : checked ? (
          <Button fullWidth onClick={advance}>
            {step >= queue.length - 1 ? t("finish") : t("continue")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
