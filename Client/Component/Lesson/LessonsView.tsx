// Lessons view: level → lesson → runner. Locks progressively; triple-click on
// a locked card bypasses. Star mastery per lesson.
import { useEffect, useMemo, useState } from "react";
import { Lock, Star } from "lucide-react";
import { CardButton } from "Client/Component/UI/card-button";
import { Button } from "Client/Component/UI/button";
import { Container } from "Client/Component/UI/container";
import { cn } from "Client/Library/utils";
import { toast } from "Client/Component/UI/use-toast";
import { useApp } from "Client/Context/App";
import { Exercise } from "Client/Component/Lesson/Exercises";
import {
  LEVELS,
  getLessons,
  getSteps,
  getDefaultLessonEntry,
  type LessonLevel,
} from "Server/API/Lessons";
import {
  getMastery,
  isUnlocked,
  recordResult,
  lessonId,
  subscribeMastery,
  hasVisited,
  markVisited,
} from "Client/Library/lessonMastery";
import { lessonProgress } from "Client/Library/lessonProgress";
import type { SupportedLang } from "Server/API/Language";

const GRID = "grid grid-cols-2 gap-3 w-full px-4";
const CARD = "min-h-[64px] py-3 px-3 flex items-center justify-between gap-2 text-left";

// Practice-style exercises count toward the "perfect" grading.
const PRACTICE_KINDS = new Set([
  "multipleChoice", "matchPairs", "buildTranslation", "orderSentence",
  "fillBlank", "typeAnswer", "listenType", "imageSelect", "listenChoose",
]);

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
    <CardButton onClick={onClick} className={cn(CARD, locked && "opacity-60")}>
      <span className="flex-1">
        <span className="block font-semibold text-sm">{title}</span>
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
  // browsePath = ["language", code, "lessons", level?, lesson?]
  const level = browsePath[3];
  const lesson = browsePath[4];

  // First-visit redirect to the default lesson.
  useEffect(() => {
    if (browsePath.length !== 3) return;
    if (hasVisited(lang)) return;
    const entry = getDefaultLessonEntry(lang);
    if (!entry) return;
    markVisited(lang);
    setBrowsePath([browsePath[0], browsePath[1], "lessons", entry.level, entry.lesson]);
  }, [browsePath, lang, setBrowsePath]);

  // ── Runner ─────────────────────────────────────────────────────────────
  if (level && lesson) {
    const steps = getSteps(lang, level, lesson);
    if (!steps?.length) {
      return <div className="px-4 text-sm py-6 text-center opacity-60">Lesson is empty.</div>;
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
    const lessons = getLessons(lang, level);
    if (!lessons.length) return <div className="px-4 text-sm py-6 text-center opacity-60">No lessons yet.</div>;
    return (
      <div className={GRID}>
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
  return (
    <div className={GRID}>
      {LEVELS.map((lv: LessonLevel, i) => {
        const id = lessonId(lv);
        const prevId = i === 0 ? undefined : lessonId(LEVELS[i - 1]);
        // A level is unlocked when the first lesson of the previous level has ≥1 star.
        const firstOfPrev = i === 0 ? undefined : getLessons(lang, LEVELS[i - 1])[0];
        const prevLessonId = firstOfPrev ? lessonId(LEVELS[i - 1], firstOfPrev.slug) : undefined;
        const locked = i > 0 && !isUnlocked(lang, id, prevLessonId);
        const hasLessons = getLessons(lang, lv).length > 0;
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

  // Feed the header progress bar; hide it when unmounted.
  useEffect(() => {
    lessonProgress.set({ current: Math.min(idx, steps.length), total: steps.length });
    return () => lessonProgress.set(null);
  }, [idx, steps.length]);

  // Finalize mastery once when we reach the end.
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
      <div className="px-4 max-w-md mx-auto py-10">
        <Container className="p-6 text-center space-y-4">
          <h2 className="text-xl font-bold">Lesson complete</h2>
          <p className="text-sm opacity-70 capitalize">{title}</p>
          <div className="flex items-center justify-center gap-1 py-2">
            {[1, 2, 3, 4, 5].map(n => (
              <Star key={n} className={cn("h-7 w-7", (result?.stars ?? 0) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
            ))}
          </div>
          {practiceTotal > 0 && (
            <p className="text-sm opacity-70">
              Practice: {practiceOk} / {practiceTotal} ({Math.round(accuracy * 100)}%)
              {perfect ? " — perfect!" : ""}
            </p>
          )}
          {result?.stars === 5
            ? <p className="text-sm font-semibold text-amber-500">Mastered ★</p>
            : nextInDays !== null && <p className="text-xs opacity-60">Next review in {nextInDays} day{nextInDays === 1 ? "" : "s"}</p>}
          <Button active className="w-full" onClick={onDone}>Continue</Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="px-4 max-w-md mx-auto w-full space-y-4 py-4">
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
