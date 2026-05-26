import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { Check, Lock, Play, Star, Trophy, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
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
 * Learning path built entirely from <Container/> + <Button/> primitives —
 * no custom color tokens, no bespoke gradients. Each Unit is a Container.
 * Tap it to expand and reveal its lessons (also Container/Button only).
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

  const initialOpenUnit = useMemo(() => {
    for (const s of PATH_SECTIONS) {
      for (const u of s.units) {
        if (u.lessons.some(l => l.id === currentLessonId)) return u.id;
      }
    }
    return null;
  }, [currentLessonId]);

  return (
    <div className="space-y-6">
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
  let prevUnitDone = true;
  return (
    <section className="space-y-3">
      <div className="space-y-3">
        {section.units.map(unit => {
          const wasUnlocked = prevUnitDone;
          const allDone = unit.lessons.every(l =>
            lessonProgress(l, learnedIds, pathProgress).completed,
          );
          prevUnitDone = allDone;

          return (
            <UnitCard
              key={unit.id}
              unit={unit}
              section={section}
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
  unit, section, uiLang, t, locked, currentLessonId, learnedIds, pathProgress,
  defaultOpen, onStart, onBrowse,
}: {
  unit: PathUnit;
  section: PathSection;
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

  const total = unit.lessons.length;
  const done = unit.lessons.filter(l =>
    lessonProgress(l, learnedIds, pathProgress).completed,
  ).length;

  const activeIdx = unit.lessons.findIndex(l => l.id === currentLessonId);
  const continueLesson =
    activeIdx >= 0 ? unit.lessons[activeIdx]
    : unit.lessons.find(l => !lessonProgress(l, learnedIds, pathProgress).completed)
    ?? unit.lessons[unit.lessons.length - 1];
  const continueDone = continueLesson
    ? lessonProgress(continueLesson, learnedIds, pathProgress).completed
    : true;

  return (
    <Container
      className={cn(
        "transition-all p-4 space-y-3",
        locked && "opacity-60",
      )}
    >
      {/* Top row: small "Unit #" tag at the left, name centered */}
      <div className="relative flex items-center justify-center min-h-[28px]">
        <div className="absolute left-0 top-0">
          <Container className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
            {t("unit") || "Unit"} {section.number}
          </Container>
        </div>
        <h3 className="text-base font-semibold text-center px-20 truncate">
          {loc(unit.title, uiLang)}
        </h3>
        {locked && <Lock className="absolute right-0 top-1 h-4 w-4 text-muted-foreground" />}
      </div>

      {/* Single primary CTA — opens/closes the unit */}
      <Button
        onClick={() => !locked && setOpen(o => !o)}
        disabled={locked}
        fullWidth
        active={!locked && open}
        className="gap-2"
      >
        {open ? (uiLang === "nl" ? "Sluiten" : uiLang === "ar" ? "إغلاق" : "Close")
              : continueDone
                ? (uiLang === "nl" ? "Herhaal" : uiLang === "ar" ? "كرر" : "Replay")
                : done > 0
                  ? (uiLang === "nl" ? "Doorgaan" : uiLang === "ar" ? "متابعة" : "Continue")
                  : (uiLang === "nl" ? "Beginnen" : uiLang === "ar" ? "ابدأ" : "Start")}
        <span className="opacity-60 text-[11px]">· {done}/{total}</span>
      </Button>

      {open && !locked && (
        <div className="space-y-2 pt-1">
          {unit.lessons.map((lesson, i) => {
            const prog = lessonProgress(lesson, learnedIds, pathProgress);
            const stars = pathProgress[lesson.id]?.stars ?? 0;
            const isCurrent = lesson.id === currentLessonId;
            const lessonLocked = !prog.completed && !isCurrent &&
              unit.lessons.slice(0, i).some(p => !lessonProgress(p, learnedIds, pathProgress).completed);
            return (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                uiLang={uiLang}
                t={t}
                prog={prog}
                stars={stars}
                locked={lessonLocked}
                onStart={() => onStart(lesson)}
                onBrowse={() => onBrowse(lesson)}
              />
            );
          })}
        </div>
      )}
    </Container>
  );
}

function LessonRow({
  lesson, uiLang, t, prog, stars, locked, onStart, onBrowse,
}: {
  lesson: PathLesson;
  uiLang: string;
  t: (k: string) => string;
  prog: { done: number; total: number; completed: boolean };
  stars: number;
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
    <Container className={cn("p-3 flex items-center gap-3", locked && "opacity-60")}>
      <div className="h-8 w-8 rounded-full border border-foreground flex items-center justify-center shrink-0">
        {locked ? <Lock className="h-3.5 w-3.5" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight truncate">
          {loc(lesson.title, uiLang)}
        </p>
        {stars > 0 && (
          <p className="text-[11px] text-amber-500 mt-0.5">
            {"★".repeat(stars)}{"☆".repeat(3 - stars)}
          </p>
        )}
      </div>
      {!locked && (
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={onBrowse} variant="ghost">
            {uiLang === "nl" ? "bekijk" : uiLang === "ar" ? "تصفح" : "browse"}
          </Button>
          <Button size="sm" active onClick={onStart} className="gap-1">
            <Play className="h-3 w-3" />
            {prog.completed
              ? (uiLang === "nl" ? "Herhaal" : uiLang === "ar" ? "كرر" : "Replay")
              : t("practice")}
          </Button>
        </div>
      )}
    </Container>
  );
}
