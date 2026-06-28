// In-app Lessons flow driven by browsePath segments:
//   ["language", lang, "lessons"]                                 → sections (Beginner/Intermediate/Advanced)
//   ["language", lang, "lessons", sectionId]                      → folder list (one per subcategory)
//   ["language", lang, "lessons", sectionId, folderId]            → numbered round lesson buttons
//   ["language", lang, "lessons", sectionId, folderId, unitId]    → multiple-choice runner
import { useEffect, useMemo, useState } from "react";
import { Lock, Star, Flag, Loader2 } from "lucide-react";
import { CardButton } from "Client/Component/UI/card-button";
import { Button } from "Client/Component/UI/button";
import { Container } from "Client/Component/UI/container";
import { cn } from "Client/Library/utils";
import { toast } from "Client/Component/UI/use-toast";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { useApp } from "Client/Context/App";
import { lessonProgress } from "Client/Library/lessonProgress";
import { useMarkedWords } from "Client/Hook/useMarkedWords";
import {
  getCategories,
  getSubcategories,
  getWordsInSubcategory,
  type SupportedLang,
} from "Server/API/Language";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Unit {
  id: string;
  title: string;
  catId: string;
  subId: string;
  partIndex: number;
  words: Array<{ id: string; text: string; [key: string]: any }>;
}

export interface Section { id: string; name: string; folderIds: string[] }

// ─── Constants ────────────────────────────────────────────────────────────────

const UNIT_SIZE = 5;

const SECTION_DEFS: Array<[string, string]> = [
  ["sec-0", "Beginner"],
  ["sec-1", "Intermediate"],
  ["sec-2", "Advanced"],
];

// ─── Progress helpers ─────────────────────────────────────────────────────────

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

// ─── Unit builder (module-level, synchronous) ─────────────────────────────────

/**
 * Builds all units for a given language directly from the in-memory
 * Server/API/Language registry. No async fetch needed.
 *
 * `uiLang` is used to resolve subcategory display names; pass "en" as a
 * safe default when calling from outside a React component (e.g. Layout).
 */
export function buildAllUnits(lang: SupportedLang, uiLang = "en"): Unit[] {
  const units: Unit[] = [];
  const categoryIds = getCategories(lang, "Vocabulary");

  for (const catId of categoryIds) {
    const subIds = getSubcategories(lang, "Vocabulary", catId);

    for (const subId of subIds) {
      const wordsMap = getWordsInSubcategory(lang, "Vocabulary", catId, subId);
      const wordEntries = Object.entries(wordsMap);
      if (wordEntries.length === 0) continue;

      // Flatten each word entry into a plain object the runner can consume
      const words = wordEntries.map(([slug, entry]) => {
        const base = Array.isArray(entry) ? entry[0] : entry;
        return { id: slug, text: slug, ...(typeof base === "object" ? base : {}) };
      });

      const showPart = words.length > UNIT_SIZE;

      for (let i = 0; i < words.length; i += UNIT_SIZE) {
        const partNum = Math.floor(i / UNIT_SIZE) + 1;
        units.push({
          id: `${catId}:${subId}:${i}`,
          title: `${subId}${showPart ? ` (${partNum})` : ""}`,
          catId,
          subId,
          partIndex: partNum,
          words: words.slice(i, i + UNIT_SIZE),
        });
      }
    }
  }
  return units;
}

/**
 * Finds a single unit by its id without needing a React component.
 * Used by Layout.tsx to resolve breadcrumb titles.
 *
 * Since we don't know the lang at call-site in Layout, we scan all
 * supported langs and return the first match.
 */
export function findUnit(unitId: string): Unit | undefined {
  const LANGS: SupportedLang[] = ["Dutch", "English", "Arabic", "Pashto"];
  for (const lang of LANGS) {
    const unit = buildAllUnits(lang).find(u => u.id === unitId);
    if (unit) return unit;
  }
  return undefined;
}

// ─── Sections helper ──────────────────────────────────────────────────────────

function buildSections(allUnits: Unit[]): Section[] {
  const uniqueFolderIds = Array.from(new Set(allUnits.map(u => `${u.catId}:${u.subId}`)));
  const chunkCount = Math.ceil(uniqueFolderIds.length / 3);

  return SECTION_DEFS.map(([id, name], idx) => {
    const start = idx * chunkCount;
    return { id, name, folderIds: uniqueFolderIds.slice(start, start + chunkCount) };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props { lang: string }

export function LessonsView({ lang }: Props) {
  const { uiLang } = useCourseLanguage();
  const { browsePath, pushBrowse, popBrowse } = useApp();

  const sectionId = browsePath[3];
  const folderId  = browsePath[4]; // `${catId}:${subId}`
  const unitId    = browsePath[5];

  // Build units synchronously from in-memory registry
  const allUnits = useMemo<Unit[]>(
    () => buildAllUnits(lang as SupportedLang, uiLang),
    [lang, uiLang],
  );

  const sections = useMemo(() => buildSections(allUnits), [allUnits]);

  const currentSection = useMemo(
    () => sections.find(s => s.id === sectionId),
    [sectionId, sections],
  );

  const activeFolderData = useMemo(() => {
    if (!folderId) return null;
    const units = allUnits.filter(u => `${u.catId}:${u.subId}` === folderId);
    if (!units.length) return null;

    const [, subId] = folderId.split(":");
    return {
      id: folderId,
      title: subId ?? folderId,
      units: units.sort((a, b) => a.partIndex - b.partIndex),
    };
  }, [folderId, allUnits]);

  const activeUnit = useMemo(
    () => allUnits.find(u => u.id === unitId),
    [unitId, allUnits],
  );

  // 1. Exercise runner
  if (sectionId && folderId && unitId) {
    return <LessonRunner lang={lang} unit={activeUnit} onDone={popBrowse} />;
  }

  // 2. Folder detail — circular progress nodes
  if (sectionId && folderId) {
    if (!activeFolderData) {
      return <div className="px-4 text-sm opacity-60">Folder resources unavailable.</div>;
    }
    const progress = loadProgress(lang);

    return (
      <div className="px-4 w-full max-w-3xl mx-auto">
        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
          {activeFolderData.units.map((u, i) => {
            const stars = progress[u.id] ?? 0;
            const prevStars = i === 0 ? 1 : (progress[activeFolderData.units[i - 1].id] ?? 0);
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

  // 3. Section detail — folder grid
  if (sectionId) {
    if (!currentSection) {
      return <div className="px-4 text-sm opacity-60">Section target out of reach.</div>;
    }

    return (
      <div className="px-4 w-full max-w-3xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {currentSection.folderIds.map(fId => {
            const [, subId] = fId.split(":");
            const count = allUnits.filter(u => `${u.catId}:${u.subId}` === fId).length;

            return (
              <CardButton
                key={fId}
                onClick={() => pushBrowse(fId)}
                className="min-h-[64px] py-3 px-4 flex items-center justify-between gap-3"
              >
                <span className="font-semibold text-sm line-clamp-2 text-left">{subId ?? fId}</span>
                <span className="text-xs opacity-70 whitespace-nowrap">{count}</span>
              </CardButton>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. Top-level milestone grid
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
            <span className="text-xs opacity-70 whitespace-nowrap">{sec.folderIds.length} Groups</span>
          </CardButton>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── Lesson Runner ─────────────────────────── */

interface Question { prompt: string; answer: string; options: string[] }

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildQuestions(unit: Unit, uiLang: string): Question[] {
  const promptProp = uiLang === "ar" ? "en" : uiLang;
  const pool = unit.words.map(w => w.text || w.id).filter(Boolean);

  return unit.words.map(w => {
    const answer     = w.text || w.id;
    const promptText = w[promptProp]?.word || w.word || w.id;
    const distractors = shuffle(pool.filter(x => x !== answer)).slice(0, 3);
    return { prompt: promptText, answer, options: shuffle([answer, ...distractors]) };
  });
}

function LessonRunner({ lang, unit, onDone }: { lang: string; unit?: Unit; onDone: () => void }) {
  const { uiLang } = useCourseLanguage();
  const { isMarked, toggle } = useMarkedWords();

  const initialQuestions = useMemo(
    () => (unit ? buildQuestions(unit, uiLang) : []),
    [unit, uiLang],
  );

  const totalRounds = initialQuestions.length;
  const [queue, setQueue]       = useState<Question[]>(initialQuestions);
  const [completed, setCompleted] = useState(0);
  const [picked, setPicked]     = useState<string | null>(null);
  const [checked, setChecked]   = useState(false);
  const [correct, setCorrect]   = useState(0);

  useEffect(() => {
    setQueue(initialQuestions);
    setCompleted(0);
    setPicked(null);
    setChecked(false);
    setCorrect(0);
  }, [unit?.id, totalRounds]);

  const [alreadyMarked] = useState<Set<string>>(() => {
    const out = new Set<string>();
    if (!unit) return out;
    for (const w of unit.words) { if (isMarked(lang, w.id)) out.add(w.id); }
    return out;
  });

  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set(alreadyMarked));

  const textToId = useMemo(() => {
    const m = new Map<string, string>();
    if (unit) for (const w of unit.words) m.set(w.text || w.id, w.id);
    return m;
  }, [unit]);

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

  const q    = queue[0];
  const done = !q;

  if (done) {
    const pct   = correct / Math.max(1, totalRounds);
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
    check:      uiLang === "nl" ? "Controleren"        : uiLang === "ar" ? "تحقق"          : "Check",
    skip:       uiLang === "nl" ? "Overslaan"          : uiLang === "ar" ? "تخطي"          : "Skip",
    cont:       uiLang === "nl" ? "Doorgaan"           : uiLang === "ar" ? "متابعة"        : "Continue",
    correctAns: uiLang === "nl" ? "Juiste antwoord"    : uiLang === "ar" ? "الإجابة الصحيحة" : "Correct answer",
    nice:       uiLang === "nl" ? "Goed gedaan!"       : uiLang === "ar" ? "أحسنت!"        : "Nice!",
    notQuite:   uiLang === "nl" ? "Niet helemaal"      : uiLang === "ar" ? "ليس تمامًا"    : "Not quite",
    translate:  uiLang === "nl" ? "Vertaal"            : uiLang === "ar" ? "ترجم"          : "Translate",
    reported:   uiLang === "nl" ? "Bedankt voor de melding" : uiLang === "ar" ? "شكرًا للإبلاغ" : "Thanks for the report",
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

  const handleContinue = () => { if (checked) advance({ requeue: !isCorrect }); };
  const handleSkip     = () => { if (!checked) advance(); };

  return (
    <div className="px-4 max-w-md mx-auto w-full space-y-6 py-4 pb-40">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider opacity-60 mb-2">{L.translate}</p>
        <p className="text-2xl font-bold">{q.prompt}</p>
      </div>
      <div className="grid gap-2">
        {q.options.map(opt => {
          const id    = textToId.get(opt);
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
            onClick={() => toast({ description: L.reported })}
            aria-label="Report"
            title="Report a problem"
            className="p-2 rounded-md opacity-60 hover:opacity-100 hover:bg-muted"
          >
            <Flag className="h-4 w-4" />
          </button>
        </Container>
      )}

      <div className="fixed left-0 right-0 bottom-0 z-40 border-t-2 border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="max-w-md mx-auto flex flex-col-reverse sm:flex-row gap-2">
          {!checked && (
            <Button onClick={handleSkip} fullWidth className="sm:flex-1">{L.skip}</Button>
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
            <Button active onClick={handleContinue} fullWidth>{L.cont}</Button>
          )}
        </div>
      </div>
    </div>
  );
}