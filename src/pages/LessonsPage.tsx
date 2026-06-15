// Duolingo-style Lessons page.
// - Vertical zig-zag path of nodes (unit lessons).
// - Each node opens a small LessonRunner overlay that quizzes the user
//   on a few words from the course content.
// - Progress is stored in localStorage per learning language.
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Lock, Play, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import {
  categories, getWordText, type Lang, type WordDetail, type WordLang,
} from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

interface Unit {
  id: string;
  title: string;
  words: WordDetail[];
}

const UNIT_SIZE = 5;

function buildUnits(): Unit[] {
  const units: Unit[] = [];
  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      if (sub.words.length === 0) continue;
      // Split each subcategory into UNIT_SIZE chunks.
      for (let i = 0; i < sub.words.length; i += UNIT_SIZE) {
        units.push({
          id: `${cat.id}:${sub.id}:${i}`,
          title: `${sub.name.en}${sub.words.length > UNIT_SIZE ? ` ${Math.floor(i / UNIT_SIZE) + 1}` : ""}`,
          words: sub.words.slice(i, i + UNIT_SIZE),
        });
      }
    }
  }
  return units.slice(0, 24); // cap so the path stays manageable
}

function progressKey(lang: string) { return `lessons:${lang}`; }

function loadProgress(lang: string): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(progressKey(lang)) || "{}"); }
  catch { return {}; }
}

function saveProgress(lang: string, data: Record<string, number>) {
  try { localStorage.setItem(progressKey(lang), JSON.stringify(data)); } catch { /* noop */ }
}

export default function LessonsPage() {
  const params = useParams<{ lang?: string }>();
  const navigate = useNavigate();
  const lang = (params.lang ?? "nl") as Lang;
  const { uiLang } = useCourseLanguage();
  const units = useMemo(buildUnits, []);
  const [progress, setProgress] = useState<Record<string, number>>(() => loadProgress(lang));
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);

  const firstIncomplete = units.findIndex(u => (progress[u.id] ?? 0) < 1);
  const currentIndex = firstIncomplete === -1 ? units.length : firstIncomplete;

  const onComplete = (unit: Unit, stars: number) => {
    const next = { ...progress, [unit.id]: Math.max(progress[unit.id] ?? 0, stars) };
    setProgress(next);
    saveProgress(lang, next);
    setActiveUnit(null);
  };

  return (
    <div className="px-4 w-full max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Lessons</h1>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>Back</Button>
      </div>

      <div className="relative flex flex-col items-center gap-6 py-4">
        {units.map((u, i) => {
          const stars = progress[u.id] ?? 0;
          const locked = i > currentIndex;
          const isCurrent = i === currentIndex;
          // Zig-zag offsets.
          const offset = [0, 60, 90, 60, 0, -60, -90, -60][i % 8];
          return (
            <div key={u.id} className="flex flex-col items-center gap-1" style={{ transform: `translateX(${offset}px)` }}>
              <button
                type="button"
                disabled={locked}
                onClick={() => setActiveUnit(u)}
                className={cn(
                  "relative h-16 w-16 rounded-full border-4 flex items-center justify-center transition-all",
                  "shadow-[0_6px_0_0_rgba(0,0,0,0.25)] active:translate-y-[3px] active:shadow-[0_3px_0_0_rgba(0,0,0,0.25)]",
                  stars > 0 && "bg-emerald-500 border-emerald-700 text-white",
                  isCurrent && stars === 0 && "bg-primary border-primary-foreground text-primary-foreground animate-pulse",
                  !isCurrent && stars === 0 && !locked && "bg-muted border-border",
                  locked && "bg-muted/40 border-border text-muted-foreground cursor-not-allowed",
                )}
                aria-label={u.title}
              >
                {locked ? <Lock className="h-6 w-6" />
                  : stars > 0 ? <Check className="h-7 w-7" />
                  : <Play className="h-6 w-6" />}
                {isCurrent && stars === 0 && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 shadow">
                    START
                  </span>
                )}
              </button>
              <p className="text-[11px] opacity-70 text-center max-w-[140px] truncate">{u.title}</p>
              <div className="flex gap-0.5">
                {[1, 2, 3].map(n => (
                  <Star key={n} className={cn("h-3 w-3", n <= stars ? "fill-amber-400 text-amber-400" : "opacity-30")} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {activeUnit && (
        <LessonRunner
          unit={activeUnit}
          courseLang={lang as WordLang}
          uiLang={uiLang}
          onClose={() => setActiveUnit(null)}
          onComplete={(stars) => onComplete(activeUnit, stars)}
        />
      )}
    </div>
  );
}

/* ───────────────────────── LessonRunner ───────────────────────── */

interface Question {
  prompt: string;
  answer: string;
  options: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildQuestions(unit: Unit, courseLang: WordLang, uiLang: Lang): Question[] {
  const promptLang: WordLang = uiLang === "ar" ? "en" : uiLang;
  const pool = unit.words.map(w => getWordText(w, courseLang)).filter(Boolean);
  return unit.words.map(w => {
    const answer = getWordText(w, courseLang);
    const promptText = w[promptLang]?.word ?? w.en.word;
    const distractors = shuffle(pool.filter(x => x !== answer)).slice(0, 3);
    return {
      prompt: promptText,
      answer,
      options: shuffle([answer, ...distractors]),
    };
  });
}

function LessonRunner({
  unit, courseLang, uiLang, onClose, onComplete,
}: {
  unit: Unit;
  courseLang: WordLang;
  uiLang: Lang;
  onClose: () => void;
  onComplete: (stars: number) => void;
}) {
  const questions = useMemo(() => buildQuestions(unit, courseLang, uiLang), [unit, courseLang, uiLang]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
        <Container className="p-6 text-center space-y-3 max-w-sm">
          <p className="text-sm opacity-70">No words available for this unit.</p>
          <Button onClick={onClose} active>Close</Button>
        </Container>
      </div>
    );
  }

  const q = questions[i];
  const done = i >= questions.length;

  if (done) {
    const pct = correct / questions.length;
    const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
        <Container className="p-6 text-center space-y-4 max-w-sm w-full">
          <h2 className="text-xl font-bold">Lesson complete!</h2>
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map(n => (
              <Star key={n} className={cn("h-8 w-8", n <= stars ? "fill-amber-400 text-amber-400" : "opacity-30")} />
            ))}
          </div>
          <p className="text-sm opacity-70">{correct} / {questions.length} correct</p>
          <Button onClick={() => onComplete(stars)} active className="w-full">Continue</Button>
        </Container>
      </div>
    );
  }

  const isCorrect = picked === q.answer;
  const next = () => {
    if (picked === null) return;
    if (isCorrect) setCorrect(c => c + 1);
    setPicked(null);
    setI(n => n + 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col p-4">
      <div className="flex items-center gap-2 max-w-md mx-auto w-full">
        <button onClick={onClose} aria-label="Close" className="p-2 rounded hover:bg-muted">
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(i / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider opacity-60 mb-2">Translate</p>
          <p className="text-2xl font-bold">{q.prompt}</p>
        </div>
        <div className="grid gap-2">
          {q.options.map(opt => (
            <button
              key={opt}
              onClick={() => setPicked(opt)}
              disabled={picked !== null}
              className={cn(
                "px-4 py-3 rounded-[14px] border-2 text-left font-semibold transition-colors",
                picked === null && "border-border hover:bg-muted",
                picked === opt && opt === q.answer && "border-emerald-500 bg-emerald-500/15",
                picked === opt && opt !== q.answer && "border-rose-500 bg-rose-500/15",
                picked !== null && picked !== opt && opt === q.answer && "border-emerald-500 bg-emerald-500/10",
                picked !== null && picked !== opt && opt !== q.answer && "opacity-50 border-border",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-md mx-auto w-full">
        <Button onClick={next} active disabled={picked === null} className="w-full">
          {picked === null ? "Pick an answer" : isCorrect ? "Correct — continue" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
