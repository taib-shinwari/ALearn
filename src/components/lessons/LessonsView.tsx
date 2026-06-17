// In-app Lessons flow driven by browsePath segments:
//   ["language", lang, "lessons"]                       → sections list (Beginner/Intermediate/Advanced)
//   ["language", lang, "lessons", sectionId]            → lessons grid for that section
//   ["language", lang, "lessons", sectionId, unitId]    → multiple-choice lesson runner
//
// No dedicated routes — back/breadcrumbs use the existing browse stack.
import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { CardButton } from "@/components/ui/card-button";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { categories, getWordText, type Lang, type WordLang, type WordDetail } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useApp } from "@/context/AppContext";

export interface Unit {
  id: string;
  title: string;
  words: WordDetail[];
}

const UNIT_SIZE = 5;

export function buildAllUnits(): Unit[] {
  const units: Unit[] = [];
  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      if (sub.words.length === 0) continue;
      for (let i = 0; i < sub.words.length; i += UNIT_SIZE) {
        const partNum = Math.floor(i / UNIT_SIZE) + 1;
        const showPart = sub.words.length > UNIT_SIZE;
        units.push({
          id: `${cat.id}:${sub.id}:${i}`,
          title: `${sub.name.en}${showPart ? ` (${partNum})` : ""}`,
          words: sub.words.slice(i, i + UNIT_SIZE),
        });
      }
    }
  }
  return units;
}

export interface Section { id: string; name: string; units: Unit[] }
const SECTION_DEFS: Array<[string, string, number]> = [
  ["sec-0", "Beginner", 8],
  ["sec-1", "Intermediate", 12],
  ["sec-2", "Advanced", Infinity],
];

export function buildSections(): Section[] {
  const all = buildAllUnits();
  const out: Section[] = [];
  let idx = 0;
  for (const [id, name, size] of SECTION_DEFS) {
    const slice = all.slice(idx, idx + size);
    if (!slice.length) continue;
    out.push({ id, name, units: slice });
    idx += size;
  }
  return out;
}

export function sectionLabel(id: string): string | undefined {
  return SECTION_DEFS.find(s => s[0] === id)?.[1];
}

export function findUnit(id: string): Unit | undefined {
  return buildAllUnits().find(u => u.id === id);
}

function progressKey(lang: string) { return `lessons:${lang}`; }
function loadProgress(lang: string): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(progressKey(lang)) || "{}"); }
  catch { return {}; }
}
function saveStars(lang: string, unitId: string, stars: number) {
  try {
    const data = loadProgress(lang);
    data[unitId] = Math.max(data[unitId] ?? 0, stars);
    localStorage.setItem(progressKey(lang), JSON.stringify(data));
  } catch { /* noop */ }
}

interface Props { lang: Lang }

export function LessonsView({ lang }: Props) {
  const { browsePath, pushBrowse, popBrowse } = useApp();
  const sections = useMemo(buildSections, []);

  const sectionId = browsePath[3];
  const unitId = browsePath[4];

  // Runner
  if (sectionId && unitId) {
    const unit = useMemo(() => findUnit(unitId), [unitId]);
    return <LessonRunner lang={lang} unit={unit} onDone={() => popBrowse()} />;
  }

  // Section detail
  if (sectionId) {
    const sec = sections.find(s => s.id === sectionId);
    if (!sec) return <div className="px-4 text-sm">Section not found.</div>;
    const progress = loadProgress(lang);
    return (
      <div className="px-4 w-full max-w-3xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sec.units.map((u, i) => {
            const stars = progress[u.id] ?? 0;
            return (
              <CardButton
                key={u.id}
                onClick={() => pushBrowse(u.id)}
                className="min-h-[64px] py-3 px-4 flex items-center justify-between gap-3"
              >
                <span className="font-semibold text-sm">#{i + 1} · {u.title}</span>
                {stars > 0 && <span className="text-xs opacity-70 whitespace-nowrap">✓</span>}
              </CardButton>
            );
          })}
        </div>
      </div>
    );
  }

  // Sections list — three folders
  return (
    <div className="px-4 w-full max-w-3xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sections.map(sec => (
          <CardButton
            key={sec.id}
            onClick={() => pushBrowse(sec.id)}
            className="min-h-[64px] py-3 px-4 flex items-center justify-between gap-3"
          >
            <span className="font-semibold text-sm">{sec.name}</span>
            <span className="text-xs opacity-70 whitespace-nowrap">{sec.units.length} Lessons</span>
          </CardButton>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── Lesson Runner ─────────────────────── */

interface Question { prompt: string; answer: string; options: string[] }

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

function LessonRunner({ lang, unit, onDone }: { lang: Lang; unit?: Unit; onDone: () => void }) {
  const { uiLang } = useCourseLanguage();
  const questions = useMemo(
    () => unit ? buildQuestions(unit, lang as WordLang, uiLang) : [],
    [unit, lang, uiLang],
  );

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);

  if (!unit || !questions.length) {
    return (
      <div className="px-4 max-w-md mx-auto text-center space-y-3 py-10">
        <p className="text-sm opacity-70">Lesson not available.</p>
        <Button onClick={onDone}>Back</Button>
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
          <Button active className="w-full" onClick={onDone}>Continue</Button>
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
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(i / questions.length) * 100}%` }} />
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
