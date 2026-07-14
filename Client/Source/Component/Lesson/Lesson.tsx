// Lessons view: level → lesson → runner. Locks progressively; triple-click on
// a locked card bypasses. Star mastery per lesson.
import { useEffect, useMemo, useState } from "react";
import { Lock, Star } from "lucide-react";
import { CardButton } from "@/Component/UI/card-button";
import { Button } from "@/Component/UI/Button";
import { Container } from "@/Component/UI/container";
import { cn } from "@/Library/utils";
import { toast } from "@/Component/UI/use-toast";
import { useApp } from "@/Context/App";
import { Exercise, LessonCompleteScreen } from "@/Component/Lesson/Types/Index";
import { parseAlphabetLesson, type AlphabetContentBlock } from "@/Parser/Language/Alphabet";
import {
  getMastery,
  isUnlocked,
  recordResult,
  lessonId,
  subscribeMastery,
  hasVisited,
  markVisited,
} from "@/Library/lessonMastery";
import { lessonProgress } from "@/Library/lessonProgress";

export type SupportedLang   = "Dutch" | "English" | "Arabic" | "Pashto";
export type I18nLang        = "Dutch" | "English" | "Arabic";

export interface LessonSummary {
  slug: string;
  title: string;
}

// 2 cols on phones, 3 from small screens up, 4 on large desktops.
const GRID = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 w-full";
// Slightly less thumb-sized padding once there's room to work with.
const CARD = "min-h-[64px] sm:min-h-[56px] py-3 px-3 sm:py-3.5 sm:px-4 flex items-center justify-between gap-2 text-left";

// Practice-style exercises count toward the "perfect" grading.
const PRACTICE_KINDS = new Set([
  "multipleChoice", "matchPairs", "typeAnswer", "orderSentence",
]);

function titleFromSlug(slug: string): string {
  return slug.split("-").filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function romanToInt(roman: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < roman.length; i++) {
    const cur = map[roman[i]] ?? 0;
    const next = map[roman[i + 1]] ?? 0;
    total += cur < next ? -cur : cur;
  }
  return total;
}

function flattenSteps(content: AlphabetContentBlock[]): any[] {
  return content.flatMap((block) => {
    if (block.kind === "vocab") {
      return block.entries.map((entry) => ({ kind: "vocab", ...entry }));
    }
    if (block.kind === "practice") {
      return block.activities.flatMap((activity) =>
        activity.items.map((item: any) => ({ kind: activity.kind, ...item }))
      );
    }
    return [block];
  });
}

function useMasteryTick() {
  const [, set] = useState(0);
  useEffect(() => { const off = subscribeMastery(() => set(n => n + 1)); return () => { off(); }; }, []);
}

function StarRow({ stars }: { stars: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={cn("h-3.5 w-3.5", n <= stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
      ))}
    </span>
  );
}

interface LockableCardProps {
  title: string;
  subtitle?: string;
  locked: boolean;
  stars: number;
  onOpen: () => void;
}
function LockableCard({ title, subtitle, locked, stars, onOpen }: LockableCardProps) {
  const [clicks, setClicks] = useState(0);
  const onClick = () => {
    if (!locked) { onOpen(); return; }
    const next = clicks + 1;
    setClicks(next);
    if (next >= 3) {
      setClicks(0);
      toast({ title: "Unlocked" });
      onOpen();
    } else {
      toast({ title: `Locked — ${3 - next} more to bypass` });
      setTimeout(() => setClicks(c => (c === next ? 0 : c)), 1200);
    }
  };
  return (
    <CardButton
      onClick={onClick}
      title={locked ? "Triple-click to bypass" : undefined}
      className={cn(CARD, "transition-transform sm:hover:scale-[1.02]", locked && "opacity-60")}
    >
      <span className="flex-1">
        <span className="block font-semibold text-sm sm:text-base">{title}</span>
        {subtitle && <span className="block text-xs opacity-70">{subtitle}</span>}
      </span>
      {locked ? <Lock className="h-4 w-4" /> : <StarRow stars={stars} />}
    </CardButton>
  );
}

interface Props { lang: SupportedLang }

export function LessonsView({ lang }: Props) {
  useMasteryTick();
  const { browsePath, pushBrowse, setBrowsePath } = useApp();
  
  // Local active memory cache holding database state blocks fetched via endpoints
  const [corpus, setCorpus] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const level = browsePath[3];
  const lesson = browsePath[4];

  // Async dynamic network listener hook context
  useEffect(() => {
    setLoading(true);
    fetch(`/api/language-corpus?lang=${lang}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP network degradation error: status ${res.status}`);
        return res.json();
      })
      .then(data => {
        setCorpus(data);
        setError(null);
      })
      .catch(err => {
        console.error("An error occurred fetching language data: ", err);
        setError(err.message || "Failed to fetch database information.");
      })
      .finally(() => setLoading(false));
  }, [lang]);

  // Derived calculations mapped directly out of compiled network responses
  const levels = useMemo(() => {
    if (!corpus?.lessons) return [];
    return Object.keys(corpus.lessons).sort((a, b) => romanToInt(a) - romanToInt(b));
  }, [corpus]);

  const defaultLessonEntry = useMemo(() => {
    if (!corpus?.lessons || levels.length === 0) return null;
    for (const lv of levels) {
      const lessons = Object.keys(corpus.lessons[lv] || {});
      if (lessons.length > 0) {
        return { level: lv, lesson: lessons[0] };
      }
    }
    return null;
  }, [corpus, levels]);

  // Handle first-visit routing logic
  useEffect(() => {
    if (loading || !corpus || browsePath.length !== 3) return;
    if (hasVisited(lang)) return;
    if (!defaultLessonEntry) return;
    
    markVisited(lang);
    setBrowsePath([browsePath[0], browsePath[1], "lessons", defaultLessonEntry.level, defaultLessonEntry.lesson]);
  }, [browsePath, lang, setBrowsePath, loading, corpus, defaultLessonEntry]);

  if (loading) return <div className="text-sm py-6 text-center opacity-60">Loading lesson configurations...</div>;
  if (error) return <div className="text-sm py-6 text-center text-destructive">Error loading systems: {error}</div>;
  if (!corpus) return null;

  // ── Runner ─────────────────────────────────────────────────────────────
  if (level && lesson) {
    const rawLessonData = corpus.lessons?.[level]?.[lesson];
    let steps: any[] | null = null;

    if (rawLessonData) {
      // Execute the layout verification schema locally inside the Client framework
      if (lesson === "The-Alphabet") {
        const parsed = parseAlphabetLesson(rawLessonData.steps);
        steps = flattenSteps(parsed.content);
      } else {
        steps = rawLessonData.steps;
      }
    }

    if (!steps?.length) {
      return <div className="text-sm py-6 text-center opacity-60">Lesson is empty.</div>;
    }
    return (
      <LessonRunner
        lang={lang}
        id={lessonId(level, lesson)}
        title={lesson.replace(/-/g, " ")}
        steps={steps}
        onDone={() => setBrowsePath(browsePath.slice(0, -1))}
      />
    );
  }

  // ── Lessons grid ───────────────────────────────────────────────────────
  if (level) {
    const rawLessonsObj = corpus.lessons?.[level] || {};
    const lessons: LessonSummary[] = Object.keys(rawLessonsObj).map(slug => ({
      slug,
      title: titleFromSlug(slug)
    }));

    if (!lessons.length) return <div className="text-sm py-6 text-center opacity-60">No lessons yet.</div>;
    return (
      <div className={cn(GRID, "max-w-4xl mx-auto")}>
        {lessons.map((l, i) => {
          const id = lessonId(level, l.slug);
          const prevId = i === 0 ? undefined : lessonId(level, lessons[i - 1].slug);
          const locked = !isUnlocked(lang, id, prevId);
          const m = getMastery(lang, id);
          return (
            <LockableCard
              key={l.slug}
              title={l.title}
              locked={locked}
              stars={m.stars}
              onOpen={() => pushBrowse(l.slug)}
            />
          );
        })}
      </div>
    );
  }

  // ── Levels grid ────────────────────────────────────────────────────────
  if (!levels.length) {
    return <div className="text-sm py-6 text-center opacity-60">No lessons yet.</div>;
  }

  return (
    <div className={cn(GRID, "max-w-4xl mx-auto")}>
      {levels.map((lv, i) => {
        const id = lessonId(lv);
        const rawPrevLessons = i === 0 ? [] : Object.keys(corpus.lessons[levels[i - 1]] || {});
        const firstOfPrevSlug = rawPrevLessons[0];
        const prevLessonId = firstOfPrevSlug ? lessonId(levels[i - 1], firstOfPrevSlug) : undefined;
        
        const locked = i > 0 && !isUnlocked(lang, id, prevLessonId);
        const hasLessons = Object.keys(corpus.lessons[lv] || {}).length > 0;
        return (
          <LockableCard
            key={lv}
            title={lv}
            subtitle={hasLessons ? undefined : "Coming soon"}
            locked={locked}
            stars={0}
            onOpen={() => pushBrowse(lv)}
          />
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Runner ─────────────────────────── */

function LessonRunner({ lang, id, title, steps, onDone }: {
  lang: SupportedLang;
  id: string;
  title: string;
  steps: any[];
  onDone: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [practiceTotal, setPracticeTotal] = useState(0);
  const [practiceOk, setPracticeOk] = useState(0);
  const [result, setResult] = useState<null | ReturnType<typeof recordResult>>(null);
  const done = idx >= steps.length;

  useEffect(() => { setIdx(0); setPracticeTotal(0); setPracticeOk(0); setResult(null); }, [id]);

  useEffect(() => {
    lessonProgress.set({ current: Math.min(idx, steps.length), total: steps.length });
    return () => lessonProgress.set(null);
  }, [idx, steps.length]);

  useEffect(() => {
    if (!done || result) return;
    const accuracy = practiceTotal ? practiceOk / practiceTotal : 1;
    const perfect = practiceTotal > 0 && practiceOk === practiceTotal;
    setResult(recordResult(lang, id, { perfect, accuracy }));
  }, [done, result, practiceOk, practiceTotal, lang, id]);

  if (done) {
    const accuracy = practiceTotal ? practiceOk / practiceTotal : 1;
    const perfect = practiceTotal > 0 && practiceOk === practiceTotal;
    const nextInDays = result?.nextReviewAt
      ? Math.max(1, Math.round((result.nextReviewAt - Date.now()) / 86_400_000))
      : null;
    return (
      <div className="max-w-md lg:max-w-xl mx-auto w-full">
        <LessonCompleteScreen
          title={title}
          stars={result?.stars ?? 0}
          practiceTotal={practiceTotal}
          practiceOk={practiceOk}
          accuracy={accuracy}
          perfect={perfect}
          nextInDays={nextInDays}
          onDone={onDone}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md lg:max-w-xl mx-auto w-full space-y-4">
      <Exercise
        key={idx}
        step={steps[idx]}
        onResult={(ok) => {
          const kind = steps[idx]?.kind;
          if (PRACTICE_KINDS.has(kind)) {
            setPracticeTotal(t => t + 1);
            if (ok) setPracticeOk(c => c + 1);
          }
          setIdx(i => i + 1);
        }}
      />
    </div>
  );
}

// Legacy compat exports for Layout / older callers.
export interface Unit { id: string; title: string }
export function buildAllUnits(_lang: SupportedLang): Unit[] { return []; }
export function findUnit(_unitId: string): Unit | undefined { return undefined; }