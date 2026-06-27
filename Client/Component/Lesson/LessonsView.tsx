// In-app Lessons flow driven by browsePath segments:
//   ["language", lang, "lessons"]                                 → sections (Beginner/Intermediate/Advanced)
//   ["language", lang, "lessons", sectionId]                      → folder list (one per subcategory)
//   ["language", lang, "lessons", sectionId, folderId]            → numbered round lesson buttons
//   ["language", lang, "lessons", sectionId, folderId, unitId]    → multiple-choice runner
import { useEffect, useMemo, useState } from "react";
import { Lock, Star, Flag } from "lucide-react";
import { CardButton } from "Client/Component/UI/card-button";
import { Button } from "Client/Component/UI/button";
import { Container } from "Client/Component/UI/container";
import { cn } from "Client/Library/utils";
import { toast } from "Client/Component/UI/use-toast";
import {
  categories,
  getWordText,
  localizedName,
  type Lang,
  type WordLang,
  type WordDetail,
} from "Server/Data/courseData";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { useApp } from "Client/Context/App";
import { lessonProgress } from "Client/Library/lessonProgress";
import { useMarkedWords } from "Client/Hook/useMarkedWords";


export interface Unit {
  id: string;
  title: string;
  catId: string;
  subId: string;
  partIndex: number; // 1-based part number within the subcategory
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
          catId: cat.id,
          subId: sub.id,
          partIndex: partNum,
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

interface Folder {
  id: string;        // `${catId}:${subId}`
  title: string;
  units: Unit[];
}

function groupByFolder(units: Unit[], lang: Lang): Folder[] {
  const map = new Map<string, Folder>();
  for (const u of units) {
    const key = `${u.catId}:${u.subId}`;
    let f = map.get(key);
    if (!f) {
      const cat = categories.find(c => c.id === u.catId);
      const sub = cat?.subcategories.find(s => s.id === u.subId);
      const title = sub ? localizedName(sub.name, lang) : key;
      f = { id: key, title, units: [] };
      map.set(key, f);
    }
    f.units.push(u);
  }
  // Preserve original ordering within each folder by partIndex
  for (const f of map.values()) f.units.sort((a, b) => a.partIndex - b.partIndex);
  return Array.from(map.values());
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
  const { uiLang } = useCourseLanguage();
  const { browsePath, pushBrowse, popBrowse } = useApp();
  // Hooks must be unconditional — call them all up front, then branch.
  const sections = useMemo(buildSections, []);

  const sectionId = browsePath[3];
  const folderId = browsePath[4];
  const unitId = browsePath[5];

  const section = useMemo(
    () => (sectionId ? sections.find(s => s.id === sectionId) : undefined),
    [sectionId, sections],
  );
  const folders = useMemo(
    () => (section ? groupByFolder(section.units, uiLang) : []),
    [section, uiLang],
  );
  const folder = useMemo(
    () => (folderId ? folders.find(f => f.id === folderId) : undefined),
    [folderId, folders],
  );
  const unit = useMemo(
    () => (unitId ? findUnit(unitId) : undefined),
    [unitId],
  );

  // Runner
  if (sectionId && folderId && unitId) {
    return <LessonRunner lang={lang} unit={unit} onDone={popBrowse} />;
  }

  // Folder detail — numbered round lesson buttons (with lock gating)
  if (sectionId && folderId) {
    if (!folder) return <div className="px-4 text-sm">Folder not found.</div>;
    const progress = loadProgress(lang);
    return (
      <div className="px-4 w-full max-w-3xl mx-auto">
        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
          {folder.units.map((u, i) => {
            const stars = progress[u.id] ?? 0;
            const prevStars = i === 0 ? 1 : (progress[folder.units[i - 1].id] ?? 0);
            const locked = prevStars <= 0;
            return (
              <button
                key={u.id}
                onClick={() => !locked && pushBrowse(u.id)}
                disabled={locked}
                aria-label={`Lesson ${i + 1}${locked ? " (locked)" : ""}`}
                className={cn(
                  "relative h-20 w-20 rounded-full border-2 font-bold text-2xl transition-all",
                  "flex items-center justify-center select-none",
                  locked
                    ? "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                    : stars > 0
                      ? "border-emerald-500 bg-emerald-500/15 text-foreground hover:scale-105"
                      : "border-border bg-background text-foreground hover:bg-muted hover:scale-105",
                )}
              >
                {locked ? <Lock className="h-6 w-6" /> : i + 1}
                {!locked && stars > 0 && (
                  <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 bg-background border-2 border-border rounded-full px-1.5 py-0.5 text-[10px] font-mono">
                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> {stars}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Section detail — folders (one per subcategory)
  if (sectionId) {
    if (!section) return <div className="px-4 text-sm">Section not found.</div>;
    return (
      <div className="px-4 w-full max-w-3xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {folders.map(f => (
            <CardButton
              key={f.id}
              onClick={() => pushBrowse(f.id)}
              className="min-h-[64px] py-3 px-4 flex items-center justify-between gap-3"
            >
              <span className="font-semibold text-sm">{f.title}</span>
              <span className="text-xs opacity-70 whitespace-nowrap">{f.units.length}</span>
            </CardButton>
          ))}
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
  const { isMarked, toggle } = useMarkedWords();
  const initialQuestions = useMemo(
    () => unit ? buildQuestions(unit, lang as WordLang, uiLang) : [],
    [unit, lang, uiLang],
  );

  const totalRounds = initialQuestions.length;
  // Queue allows pushing missed questions to the end.
  const [queue, setQueue] = useState<Question[]>(initialQuestions);
  const [completed, setCompleted] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    setQueue(initialQuestions);
    setCompleted(0);
    setPicked(null);
    setChecked(false);
    setCorrect(0);
  }, [unit?.id, totalRounds]);

  // Snapshot which word ids were ALREADY in the dictionary at lesson start.
  // A word is shown green only while we're on the FIRST question that
  // introduces it; on the next question it's no longer "new".
  const [alreadyMarked] = useState<Set<string>>(() => {
    const out = new Set<string>();
    if (!unit) return out;
    for (const w of unit.words) {
      if (isMarked(lang, w.id)) out.add(w.id);
    }
    return out;
  });
  // Word ids that have been "seen" (auto-added to dict) so we stop colouring them.
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set(alreadyMarked));

  // Map answer text → wordId so we can color options.
  const textToId = useMemo(() => {
    const m = new Map<string, string>();
    if (unit) for (const w of unit.words) m.set(getWordText(w, lang as WordLang), w.id);
    return m;
  }, [unit, lang]);

  // Publish progress to the global header bar.
  useEffect(() => {
    if (!unit || !totalRounds) return;
    lessonProgress.set({ current: Math.min(completed, totalRounds), total: totalRounds });
    return () => lessonProgress.set(null);
  }, [unit, totalRounds, completed]);

  if (!unit || !totalRounds) {
    return (
      <div className="px-4 max-w-md mx-auto text-center space-y-3 py-10">
        <p className="text-sm opacity-70">Lesson not available.</p>
        <Button onClick={onDone}>Back</Button>
      </div>
    );
  }

  const q = queue[0];
  const done = !q;

  if (done) {
    const pct = correct / Math.max(1, totalRounds);
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
          <p className="text-sm opacity-70">{correct} / {totalRounds} correct</p>
          <Button active className="w-full" onClick={onDone}>Continue</Button>
        </Container>
      </div>
    );
  }

  const isCorrect = picked === q.answer;

  const L = {
    check: uiLang === "nl" ? "Controleren" : uiLang === "ar" ? "تحقق" : "Check",
    skip: uiLang === "nl" ? "Overslaan" : uiLang === "ar" ? "تخطي" : "Skip",
    cont: uiLang === "nl" ? "Doorgaan" : uiLang === "ar" ? "متابعة" : "Continue",
    correctAns: uiLang === "nl" ? "Juiste antwoord" : uiLang === "ar" ? "الإجابة الصحيحة" : "Correct answer",
    nice: uiLang === "nl" ? "Goed gedaan!" : uiLang === "ar" ? "أحسنت!" : "Nice!",
    notQuite: uiLang === "nl" ? "Niet helemaal" : uiLang === "ar" ? "ليس تمامًا" : "Not quite",
    translate: uiLang === "nl" ? "Vertaal" : uiLang === "ar" ? "ترجم" : "Translate",
    reported: uiLang === "nl" ? "Bedankt voor de melding" : uiLang === "ar" ? "شكرًا للإبلاغ" : "Thanks for the report",
  };

  const handleCheck = () => {
    if (picked === null) return;
    setChecked(true);
    if (isCorrect) {
      setCorrect(c => c + 1);
      const answerId = textToId.get(q.answer);
      if (answerId && !alreadyMarked.has(answerId) && !seenIds.has(answerId)) {
        toggle(lang, answerId);
        setSeenIds(prev => { const n = new Set(prev); n.add(answerId); return n; });
      }
    }
  };

  const advance = (opts?: { requeue?: boolean }) => {
    setQueue(prev => {
      const [head, ...rest] = prev;
      if (!head) return prev;
      return opts?.requeue ? [...rest, head] : rest;
    });
    if (!opts?.requeue) setCompleted(c => c + 1);
    setPicked(null);
    setChecked(false);
  };

  const handleContinue = () => {
    if (!checked) return;
    advance({ requeue: !isCorrect });
  };

  const handleSkip = () => {
    if (checked) return;
    advance();
  };

  const handleReport = () => {
    toast({ description: L.reported });
  };

  return (
    <div className="px-4 max-w-md mx-auto w-full space-y-6 py-4 pb-40">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider opacity-60 mb-2">{L.translate}</p>
        <p className="text-2xl font-bold">{q.prompt}</p>
      </div>
      <div className="grid gap-2">
        {q.options.map(opt => {
          const id = textToId.get(opt);
          const isNew = id ? (!alreadyMarked.has(id) && !seenIds.has(id)) : false;
          const isPicked = picked === opt;
          return (
            <button
              key={opt}
              onClick={() => { if (!checked) setPicked(opt); }}
              disabled={checked}
              className={cn(
                "px-4 py-3 rounded-[14px] border-2 text-left font-semibold transition-colors",
                !checked && !isPicked && "border-border hover:bg-muted",
                !checked && !isPicked && isNew && "text-emerald-600 dark:text-emerald-400",
                !checked && isPicked && "border-foreground bg-muted",
                checked && opt === q.answer && "border-emerald-500 bg-emerald-500/15",
                checked && isPicked && opt !== q.answer && "border-rose-500 bg-rose-500/15",
                checked && !isPicked && opt !== q.answer && "opacity-50 border-border",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {checked && (
        <Container
          className={cn(
            "p-3 flex items-start gap-3",
            isCorrect ? "border-emerald-500/60 bg-emerald-500/5" : "border-rose-500/60 bg-rose-500/5",
          )}
        >
          <div className="flex-1 min-w-0 space-y-1">
            <p className={cn("text-sm font-semibold", isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
              {isCorrect ? L.nice : L.notQuite}
            </p>
            {!isCorrect && (
              <p className="text-sm">
                <span className="opacity-60">{L.correctAns}: </span>
                <span className="font-semibold">{q.answer}</span>
              </p>
            )}
          </div>
          <button
            onClick={handleReport}
            aria-label="Report"
            title="Report a problem"
            className="p-2 rounded-md opacity-60 hover:opacity-100 hover:bg-muted"
          >
            <Flag className="h-4 w-4" />
          </button>
        </Container>
      )}

      {/* Footer: mobile stacked (Check top, Skip below), desktop side-by-side (Skip left, Check right). */}
      <div className="fixed left-0 right-0 bottom-0 z-40 border-t-2 border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="max-w-md mx-auto flex flex-col-reverse sm:flex-row gap-2">
          {!checked && (
            <Button onClick={handleSkip} fullWidth className="sm:flex-1">
              {L.skip}
            </Button>
          )}
          {!checked ? (
            <Button
              active={picked !== null}
              disabled={picked === null}
              onClick={handleCheck}
              fullWidth
              className="sm:flex-1"
            >
              {L.check}
            </Button>
          ) : (
            <Button active onClick={handleContinue} fullWidth>
              {L.cont}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

