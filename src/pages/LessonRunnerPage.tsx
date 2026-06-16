// Lesson runner page (single slug: /lesson/:lang/:lessonId).
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { getWordText, type Lang, type WordLang } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { buildAllUnits, type Unit } from "./LessonsPage";

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
    return { prompt: promptText, answer, options: shuffle([answer, ...distractors]) };
  });
}

function progressKey(lang: string) { return `lessons:${lang}`; }
function saveStars(lang: string, unitId: string, stars: number) {
  try {
    const data = JSON.parse(localStorage.getItem(progressKey(lang)) || "{}");
    data[unitId] = Math.max(data[unitId] ?? 0, stars);
    localStorage.setItem(progressKey(lang), JSON.stringify(data));
  } catch { /* noop */ }
}

export default function LessonRunnerPage() {
  const params = useParams<{ lang?: string; lessonId?: string }>();
  const navigate = useNavigate();
  const lang = (params.lang ?? "nl") as Lang;
  const lessonId = decodeURIComponent(params.lessonId ?? "");
  const { uiLang } = useCourseLanguage();

  const unit = useMemo(() => buildAllUnits().find(u => u.id === lessonId), [lessonId]);
  const questions = useMemo(
    () => unit ? buildQuestions(unit, lang as WordLang, uiLang) : [],
    [unit, lang, uiLang],
  );

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);

  if (!unit) {
    return (
      <div className="px-4 max-w-md mx-auto text-center space-y-3 py-10">
        <p className="text-sm opacity-70">Lesson not found.</p>
        <Button onClick={() => navigate(`/lessons/${lang}`)}>Back to Lessons</Button>
      </div>
    );
  }
  if (questions.length === 0) {
    return (
      <div className="px-4 max-w-md mx-auto text-center space-y-3 py-10">
        <p className="text-sm opacity-70">No words available for this lesson.</p>
        <Button onClick={() => navigate(`/lessons/${lang}`)}>Back to Lessons</Button>
      </div>
    );
  }

  const q = questions[i];
  const done = i >= questions.length;

  if (done) {
    const pct = correct / questions.length;
    const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
    saveStars(lang, unit.id, stars);
    return (
      <div className="px-4 max-w-md mx-auto py-10">
        <Container className="p-6 text-center space-y-4">
          <h2 className="text-xl font-bold">Lesson complete!</h2>
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map(n => (
              <Star key={n} className={cn("h-8 w-8", n <= stars ? "fill-amber-400 text-amber-400" : "opacity-30")} />
            ))}
          </div>
          <p className="text-sm opacity-70">{correct} / {questions.length} correct</p>
          <Button active className="w-full" onClick={() => navigate(`/lessons/${lang}`)}>Continue</Button>
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
    <div className="px-4 max-w-md mx-auto w-full space-y-6 py-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(`/lessons/${lang}`)} aria-label="Close" className="p-2 rounded hover:bg-muted">
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(i / questions.length) * 100}%` }} />
        </div>
      </div>

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

      <Button active disabled={picked === null} className="w-full" onClick={next}>
        {picked === null ? "Pick an answer" : isCorrect ? "Correct — continue" : "Continue"}
      </Button>
    </div>
  );
}
