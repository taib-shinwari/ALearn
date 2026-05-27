import { useMemo } from "react";
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

function loc<T extends { en: string; nl: string; ar?: string }>(o: T, lang: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (o as any)[lang] || o.en;
}

/**
 * Brilliant-style learning path: each Unit is a Container that always shows
 * its lessons inline. Lessons are plain <Button/> components — no expand /
 * collapse, no "Browse" CTA, no custom styling.
 */
export function LearningPath() {
  const navigate = useNavigate();
  const { reviews, setPracticeScope, pathProgress } = useApp();
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

  const startLesson = (lesson: PathLesson) => {
    setPracticeScope({ type: "subcategory", id: lesson.subcategoryId, lessonId: lesson.id });
    navigate("/practice");
  };

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
          onStart={startLesson}
        />
      ))}
    </div>
  );
}

function SectionBlock({
  section, uiLang, t, currentLessonId, learnedIds, pathProgress, onStart,
}: {
  section: PathSection;
  uiLang: string;
  t: (k: string) => string;
  currentLessonId?: string;
  learnedIds: Set<string>;
  pathProgress: Record<string, { stars: number; completedAt?: number; attempts: number }>;
  onStart: (l: PathLesson) => void;
}) {
  let prevUnitDone = true;
  return (
    <section className="space-y-3">
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
            onStart={onStart}
          />
        );
      })}
    </section>
  );
}

function UnitCard({
  unit, section, uiLang, t, locked, currentLessonId, learnedIds, pathProgress, onStart,
}: {
  unit: PathUnit;
  section: PathSection;
  uiLang: string;
  t: (k: string) => string;
  locked: boolean;
  currentLessonId?: string;
  learnedIds: Set<string>;
  pathProgress: Record<string, { stars: number; completedAt?: number; attempts: number }>;
  onStart: (l: PathLesson) => void;
}) {
  const total = unit.lessons.length;
  const done = unit.lessons.filter(l =>
    lessonProgress(l, learnedIds, pathProgress).completed,
  ).length;

  return (
    <Container className={cn("p-4 space-y-3", locked && "opacity-60")}>
      {/* Header: small "Unit #" tag at the left, name centered */}
      <div className="relative flex items-center justify-center min-h-[28px]">
        <div className="absolute left-0 top-0">
          <Container className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
            {t("unit") || "Unit"} {section.number}
          </Container>
        </div>
        <h3 className="text-base font-semibold text-center px-20 truncate">
          {loc(unit.title, uiLang)}
        </h3>
        {locked ? (
          <Lock className="absolute right-0 top-1 h-4 w-4 text-muted-foreground" />
        ) : (
          <span className="absolute right-0 top-1 text-[11px] opacity-60">
            {done}/{total}
          </span>
        )}
      </div>

      {/* Lessons — always visible, each is a Button */}
      <div className="space-y-2 pt-1">
        {unit.lessons.map((lesson, i) => {
          const prog = lessonProgress(lesson, learnedIds, pathProgress);
          const stars = pathProgress[lesson.id]?.stars ?? 0;
          const isCurrent = lesson.id === currentLessonId;
          const prevIncomplete = unit.lessons.slice(0, i).some(
            p => !lessonProgress(p, learnedIds, pathProgress).completed,
          );
          const lessonLocked = locked || (!prog.completed && !isCurrent && prevIncomplete);

          const Icon =
            lesson.kind === "checkpoint" ? Trophy
            : lesson.kind === "review" ? Star
            : prog.completed ? Check
            : lessonLocked ? Lock
            : isCurrent ? Play
            : BookOpen;

          return (
            <Button
              key={lesson.id}
              fullWidth
              active={isCurrent && !lessonLocked}
              disabled={lessonLocked}
              onClick={() => onStart(lesson)}
              className="justify-between"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{loc(lesson.title, uiLang)}</span>
              </span>
              <span className="flex items-center gap-2 text-[11px] opacity-70 shrink-0">
                {stars > 0 && <span className="text-amber-500">{"★".repeat(stars)}</span>}
                {prog.completed
                  ? (uiLang === "nl" ? "Herhaal" : uiLang === "ar" ? "كرر" : "Replay")
                  : isCurrent
                    ? t("practice")
                    : ""}
              </span>
            </Button>
          );
        })}
      </div>
    </Container>
  );
}
