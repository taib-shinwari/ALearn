import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { Check, Lock, Star, Trophy, BookOpen, Play, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PATH_SECTIONS,
  PathLesson,
  PathUnit,
  PathSection,
  getAllPathLessons,
  lessonProgress,
} from "@/data/learningUnits";
import { getCategoryForSubcategory } from "@/data/courseData";

function loc<T extends { en: string; nl: string; ar?: string }>(o: T, lang: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (o as any)[lang] || o.en;
}

/**
 * Brilliant-inspired learning path:
 * - Slim chapter (section) header.
 * - Stacked unit cards with a progress ring and Continue CTA.
 * - Tap a card to expand and reveal its lessons inline.
 * - Locked units are dimmed with a lock icon.
 */
export function LearningPath() {
  const navigate = useNavigate();
  const { reviews, selectedConcept, setPracticeScope, pathProgress } = useApp();
  const { uiLang, t } = useCourseLanguage();

  const learnedIds = useMemo(
    () => new Set(reviews.filter(r => (r.reps ?? 0) > 0 || r.learned).map(r => r.wordId)),
    [reviews],
  );

  const currentLessonId = useMemo(() => {
    const all = getAllPathLessons();
    const next = all.find(l => !lessonProgress(l, learnedIds, pathProgress).completed);
    return next?.id ?? all[all.length - 1]?.id;
  }, [learnedIds, pathProgress]);

  const conceptPrefix = selectedConcept ? `/${selectedConcept}` : "";

  const startLesson = (lesson: PathLesson) => {
    setPracticeScope({ type: "subcategory", id: lesson.subcategoryId, lessonId: lesson.id });
    navigate("/practice");
  };

  const openDictionary = (lesson: PathLesson) => {
    const cat = getCategoryForSubcategory(lesson.subcategoryId);
    if (cat) navigate(`${conceptPrefix}/${cat.id}/${lesson.subcategoryId}`);
  };

  // Determine the first not-yet-completed unit so we can auto-expand it.
  const initialOpenUnit = useMemo(() => {
    for (const s of PATH_SECTIONS) {
      for (const u of s.units) {
        if (u.lessons.some(l => l.id === currentLessonId)) return u.id;
      }
    }
    return null;
  }, [currentLessonId]);

  return (
    <div className="space-y-8">
      {PATH_SECTIONS.map(section => (
        <SectionBlock
          key={section.id}
          section={section}
          uiLang={uiLang}
          t={t}
          currentLessonId={currentLessonId}
          learnedIds={learnedIds}
          pathProgress={pathProgress}
          initialOpenUnit={initialOpenUnit}
          onStart={startLesson}
          onBrowse={openDictionary}
        />
      ))}
    </div>
  );
}

function SectionBlock({
  section, uiLang, t, currentLessonId, learnedIds, pathProgress,
  initialOpenUnit, onStart, onBrowse,
}: {
  section: PathSection;
  uiLang: string;
  t: (k: string) => string;
  currentLessonId?: string;
  learnedIds: Set<string>;
  pathProgress: Record<string, { stars: number; completedAt?: number; attempts: number }>;
  initialOpenUnit: string | null;
  onStart: (l: PathLesson) => void;
  onBrowse: (l: PathLesson) => void;
}) {
  // Track which units are previously unlocked (sequential gating across units).
  let prevUnitDone = true;

  return (
    <section className="space-y-3">
      {/* Slim chapter header */}
      <div className="flex items-baseline gap-3 px-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          {t("unit")} {section.number}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <h3 className="text-xl font-bold leading-tight px-1">{loc(section.title, uiLang)}</h3>

      <div className="space-y-3">
        {section.units.map(unit => {
          const wasUnlocked = prevUnitDone;
          const allDone = unit.lessons.every(l =>
            lessonProgress(l, learnedIds, pathProgress).completed
          );
          prevUnitDone = allDone;

          return (
            <UnitCard
              key={unit.id}
              unit={unit}
              uiLang={uiLang}
              t={t}
              locked={!wasUnlocked}
              currentLessonId={currentLessonId}
              learnedIds={learnedIds}
              pathProgress={pathProgress}
              defaultOpen={unit.id === initialOpenUnit}
              onStart={onStart}
              onBrowse={onBrowse}
            />
          );
        })}
      </div>
    </section>
  );
}

function UnitCard({
  unit, uiLang, t, locked, currentLessonId, learnedIds, pathProgress,
  defaultOpen, onStart, onBrowse,
}: {
  unit: PathUnit;
  uiLang: string;
  t: (k: string) => string;
  locked: boolean;
  currentLessonId?: string;
  learnedIds: Set<string>;
  pathProgress: Record<string, { stars: number; completedAt?: number; attempts: number }>;
  defaultOpen: boolean;
  onStart: (l: PathLesson) => void;
  onBrowse: (l: PathLesson) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const totalLessons = unit.lessons.length;
  const doneLessons = unit.lessons.filter(l =>
    lessonProgress(l, learnedIds, pathProgress).completed
  ).length;
  const pct = totalLessons === 0 ? 0 : Math.round((doneLessons / totalLessons) * 100);

  // The active lesson within this unit (if any)
  const activeIdx = unit.lessons.findIndex(l => l.id === currentLessonId);
  const continueLesson =
    activeIdx >= 0 ? unit.lessons[activeIdx] : unit.lessons.find(l => !lessonProgress(l, learnedIds, pathProgress).completed) ?? unit.lessons[unit.lessons.length - 1];

  return (
    <article
      className={cn(
        "glass-card rounded-2xl overflow-hidden transition-all",
        locked && "opacity-60",
      )}
      style={{
        borderTop: `3px solid hsl(${unit.hue} 70% 55%)`,
      }}
    >
      <button
        type="button"
        onClick={() => !locked && setOpen(o => !o)}
        disabled={locked}
        className="w-full text-left p-4 flex items-center gap-4"
      >
        <ProgressRing hue={unit.hue} pct={pct} locked={locked} done={doneLessons} total={totalLessons} />

        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold leading-tight truncate">
            {loc(unit.title, uiLang)}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {loc(unit.subtitle, uiLang)} · {doneLessons}/{totalLessons} {t("lesson") || "lessons"}
          </p>
        </div>

        {locked ? (
          <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform shrink-0",
              open && "rotate-180",
            )}
          />
        )}
      </button>

      {open && !locked && (
        <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3">
          {unit.lessons.map((lesson, i) => {
            const prog = lessonProgress(lesson, learnedIds, pathProgress);
            const stars = pathProgress[lesson.id]?.stars ?? 0;
            const isCurrent = lesson.id === currentLessonId;
            const lessonLocked = !prog.completed && !isCurrent &&
              unit.lessons.slice(0, i).some(p => !lessonProgress(p, learnedIds, pathProgress).completed);

            return (
              <LessonRow
                key={lesson.id}
                hue={unit.hue}
                lesson={lesson}
                uiLang={uiLang}
                t={t}
                prog={prog}
                stars={stars}
                current={isCurrent}
                locked={lessonLocked}
                onStart={() => onStart(lesson)}
                onBrowse={() => onBrowse(lesson)}
              />
            );
          })}

          {continueLesson && !lessonProgress(continueLesson, learnedIds, pathProgress).completed && (
            <button
              type="button"
              onClick={() => onStart(continueLesson)}
              className="w-full mt-2 rounded-xl py-3 px-4 font-semibold text-white flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: `linear-gradient(135deg, hsl(${unit.hue} 75% 55%), hsl(${unit.hue} 70% 45%))`,
                boxShadow: `0 4px 0 hsl(${unit.hue} 60% 35%)`,
              }}
            >
              <Play className="h-4 w-4" />
              {pct > 0 ? (uiLang === "nl" ? "Doorgaan" : uiLang === "ar" ? "متابعة" : "Continue") : (uiLang === "nl" ? "Beginnen" : uiLang === "ar" ? "ابدأ" : "Start")}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function LessonRow({
  hue, lesson, uiLang, t, prog, stars, current, locked, onStart, onBrowse,
}: {
  hue: number;
  lesson: PathLesson;
  uiLang: string;
  t: (k: string) => string;
  prog: { done: number; total: number; completed: boolean };
  stars: number;
  current: boolean;
  locked: boolean;
  onStart: () => void;
  onBrowse: () => void;
}) {
  const Icon =
    lesson.kind === "checkpoint" ? Trophy
    : lesson.kind === "review" ? Star
    : prog.completed ? Check
    : BookOpen;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-xl",
        current && "bg-muted/40 ring-1 ring-border",
      )}
    >
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: locked ? "hsl(var(--muted))"
            : prog.completed ? `hsl(${hue} 55% 45%)`
            : current ? `hsl(${hue} 75% 55%)`
            : `hsl(${hue} 70% 92%)`,
          color: locked ? "hsl(var(--muted-foreground))"
            : prog.completed || current ? "white"
            : `hsl(${hue} 50% 30%)`,
        }}
      >
        {locked ? <Lock className="h-4 w-4" /> : <Icon className="h-5 w-5" strokeWidth={2.5} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight truncate">{loc(lesson.title, uiLang)}</p>
        <p className="text-[11px] text-muted-foreground">
          {prog.done}/{prog.total}
          {stars > 0 && (
            <span className="ml-2 text-amber-500">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</span>
          )}
        </p>
      </div>

      {!locked && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onBrowse}
            className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/60"
          >
            {uiLang === "nl" ? "bekijk" : uiLang === "ar" ? "تصفح" : "browse"}
          </button>
          <button
            type="button"
            onClick={onStart}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
            style={{ background: `hsl(${hue} 70% 50%)` }}
          >
            {prog.completed ? (uiLang === "nl" ? "Herhaal" : uiLang === "ar" ? "كرر" : "Replay") : t("practice")}
          </button>
        </div>
      )}
    </div>
  );
}

function ProgressRing({
  hue, pct, locked, done, total,
}: { hue: number; pct: number; locked: boolean; done: number; total: number }) {
  const size = 52;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const color = locked ? "hsl(var(--muted-foreground))" : `hsl(${hue} 70% 50%)`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 400ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold" style={{ color }}>
        {done}/{total}
      </div>
    </div>
  );
}
