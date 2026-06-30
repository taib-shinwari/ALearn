// New slug-based Lessons view: CEFR levels → units → lessons → sub-lessons → runner.
// Locks progressively; triple-click on a locked card bypasses.
import { useEffect, useMemo, useState } from "react";
import { Lock, Check } from "lucide-react";
import { CardButton } from "Client/Component/UI/card-button";
import { Button } from "Client/Component/UI/button";
import { Container } from "Client/Component/UI/container";
import { cn } from "Client/Library/utils";
import { toast } from "Client/Component/UI/use-toast";
import { useApp } from "Client/Context/App";
import { Exercise } from "Client/Component/Lesson/Exercises";
import {
  LEVELS,
  getUnits,
  getLessons,
  getSubLessons,
  getSteps,
  getDefaultLessonEntry,
  type LessonLevel,
} from "Server/API/Lessons";
import {
  isCompleted,
  isUnlocked,
  bypass,
  markCompleted,
  lessonId,
  subscribeUnlock,
  hasVisited,
  markVisited,
} from "Client/Library/lessonsUnlock";
import type { SupportedLang } from "Server/API/Language";

const GRID = "grid grid-cols-2 gap-3 w-full px-4";
const CARD = "min-h-[64px] py-3 px-3 flex items-center justify-between gap-2 text-left";

function useUnlockTick() {
  const [, set] = useState(0);
  useEffect(() => { const off = subscribeUnlock(() => set(n => n + 1)); return () => { off(); }; }, []);
}

interface LockableCardProps {
  title: string;
  subtitle?: string;
  locked: boolean;
  done: boolean;
  onOpen: () => void;
  onBypass: () => void;
}
function LockableCard({ title, subtitle, locked, done, onOpen, onBypass }: LockableCardProps) {
  const [clicks, setClicks] = useState(0);

  const onClick = () => {
    if (!locked) { onOpen(); return; }
    const next = clicks + 1;
    setClicks(next);
    if (next >= 3) {
      setClicks(0);
      onBypass();
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
      {done ? <Check className="h-4 w-4 text-emerald-500" /> : locked ? <Lock className="h-4 w-4" /> : null}
    </CardButton>
  );
}

interface Props { lang: SupportedLang }

export function LessonsView({ lang }: Props) {
  useUnlockTick();
  const { browsePath, pushBrowse, setBrowsePath } = useApp();
  // browsePath = ["language", code, "lessons", level?, unit?, lesson?, sub?]
  const level = browsePath[3];
  const unit  = browsePath[4];
  const lesson = browsePath[5];
  const sub   = browsePath[6];

  // First-visit redirect into the default lesson.
  useEffect(() => {
    if (browsePath.length !== 3) return;
    if (hasVisited(lang)) return;
    const entry = getDefaultLessonEntry(lang);
    if (!entry) return;
    markVisited(lang);
    setBrowsePath([browsePath[0], browsePath[1], "lessons", entry.level, entry.unit, entry.lesson, entry.sub]);
  }, [browsePath, lang, setBrowsePath]);

  // ── Runner ─────────────────────────────────────────────────────────────
  if (level && unit && lesson && sub) {
    const steps = getSteps(lang, level, unit, lesson, sub);
    if (!steps?.length) {
      return <div className="px-4 text-sm py-6 text-center opacity-60">Lesson is empty.</div>;
    }
    return (
      <LessonRunner
        lang={lang}
        id={lessonId(level, unit, lesson, sub)}
        steps={steps}
        onDone={() => setBrowsePath(browsePath.slice(0, -1))}
      />
    );
  }

  // ── Sub-lessons grid ───────────────────────────────────────────────────
  if (level && unit && lesson) {
    const subs = getSubLessons(lang, level, unit, lesson);
    if (!subs.length) return <div className="px-4 text-sm py-6 text-center opacity-60">Empty.</div>;
    return (
      <div className={GRID}>
        {subs.map((s, i) => {
          const id = lessonId(level, unit, lesson, s.slug);
          const prevId = i === 0 ? undefined : lessonId(level, unit, lesson, subs[i - 1].slug);
          const locked = !isUnlocked(lang, id, prevId);
          return (
            <LockableCard
              key={s.slug}
              title={s.title}
              locked={locked}
              done={isCompleted(lang, id)}
              onOpen={() => pushBrowse(s.slug)}
              onBypass={() => bypass(lang, id)}
            />
          );
        })}
      </div>
    );
  }

  // ── Lessons grid ───────────────────────────────────────────────────────
  if (level && unit) {
    const lessons = getLessons(lang, level, unit);
    if (!lessons.length) return <div className="px-4 text-sm py-6 text-center opacity-60">Empty.</div>;
    return (
      <div className={GRID}>
        {lessons.map((l, i) => {
          const id = lessonId(level, unit, l.slug);
          const prevId = i === 0 ? undefined : lessonId(level, unit, lessons[i - 1].slug);
          const locked = !isUnlocked(lang, id, prevId);
          return (
            <LockableCard
              key={l.slug}
              title={l.title}
              locked={locked}
              done={isCompleted(lang, id)}
              onOpen={() => pushBrowse(l.slug)}
              onBypass={() => bypass(lang, id)}
            />
          );
        })}
      </div>
    );
  }

  // ── Units grid ─────────────────────────────────────────────────────────
  if (level) {
    const units = getUnits(lang, level);
    if (!units.length) return <div className="px-4 text-sm py-6 text-center opacity-60">No units yet.</div>;
    return (
      <div className={GRID}>
        {units.map((u, i) => {
          const id = lessonId(level, u.slug);
          const prevId = i === 0 ? undefined : lessonId(level, units[i - 1].slug);
          const locked = !isUnlocked(lang, id, prevId);
          return (
            <LockableCard
              key={u.slug}
              title={u.title}
              locked={locked}
              done={isCompleted(lang, id)}
              onOpen={() => pushBrowse(u.slug)}
              onBypass={() => bypass(lang, id)}
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
        const locked = !isUnlocked(lang, id, prevId);
        const hasUnits = getUnits(lang, lv).length > 0;
        return (
          <LockableCard
            key={lv}
            title={lv}
            subtitle={hasUnits ? undefined : "Coming soon"}
            locked={locked}
            done={isCompleted(lang, id)}
            onOpen={() => pushBrowse(lv)}
            onBypass={() => bypass(lang, id)}
          />
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Runner ─────────────────────────── */

function LessonRunner({ lang, id, steps, onDone }: {
  lang: SupportedLang;
  id: string;
  steps: any[];
  onDone: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const done = idx >= steps.length;

  // Re-shuffle the queue between runs to avoid stale state.
  const queue = useMemo(() => steps, [steps, id]);

  useEffect(() => { setIdx(0); setCorrect(0); }, [id]);

  if (done) {
    markCompleted(lang, id);
    const pct = correct / Math.max(1, steps.length);
    return (
      <div className="px-4 max-w-md mx-auto py-10">
        <Container className="p-6 text-center space-y-4">
          <h2 className="text-xl font-bold">Lesson complete!</h2>
          <p className="text-sm opacity-70">{correct} / {steps.length} correct ({Math.round(pct * 100)}%)</p>
          <Button active className="w-full" onClick={onDone}>Continue</Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="px-4 max-w-md mx-auto w-full space-y-4 py-4">
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-foreground transition-all"
          style={{ width: `${(idx / steps.length) * 100}%` }}
        />
      </div>
      <Exercise
        key={idx}
        step={queue[idx]}
        onResult={(ok) => {
          if (ok) setCorrect(c => c + 1);
          setIdx(i => i + 1);
        }}
      />
    </div>
  );
}

// Legacy compat exports for Layout.tsx / older callers.
export interface Unit { id: string; title: string }
export function buildAllUnits(_lang: SupportedLang): Unit[] { return []; }
export function findUnit(_unitId: string): Unit | undefined { return undefined; }
