import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { Check, Lock, Star, Trophy, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PATH_SECTIONS,
  PathLesson,
  PathUnit,
  getAllPathLessons,
  lessonProgress,
} from "@/data/learningUnits";

function loc<T extends { en: string; nl: string; ar?: string }>(o: T, lang: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (o as any)[lang] || o.en;
}

/**
 * Duolingo-inspired winding path:
 * - Sections (chapters) with themed banners.
 * - Units with 1–2 lessons, rendered as circular nodes that zig-zag left/right.
 * - Current node pulses; locked nodes greyed out; completed nodes filled.
 */
export function LearningPath() {
  const navigate = useNavigate();
  const { reviews, selectedConcept, setPracticeScope } = useApp();
  const { uiLang, t } = useCourseLanguage();

  const learnedIds = useMemo(
    () => new Set(reviews.filter(r => (r.reps ?? 0) > 0 || r.learned).map(r => r.wordId)),
    [reviews],
  );

  // First not-completed lesson across the whole track = "current".
  const currentLessonId = useMemo(() => {
    const all = getAllPathLessons();
    const next = all.find(l => !lessonProgress(l, learnedIds).completed);
    return next?.id ?? all[all.length - 1]?.id;
  }, [learnedIds]);

  const conceptPrefix = selectedConcept ? `/${selectedConcept}` : "";

  const startLesson = (lesson: PathLesson) => {
    setPracticeScope({ type: "subcategory", id: lesson.subcategoryId });
    navigate("/practice");
  };

  const openDictionary = (lesson: PathLesson) => {
    // Find category for this subcategory
    // We just navigate to the subcategory page for word browsing
    // Use the existing nested route shape
    const path = subcategoryToPath(conceptPrefix, lesson.subcategoryId);
    if (path) navigate(path);
  };

  return (
    <div className="space-y-10">
      {PATH_SECTIONS.map((section, sIdx) => (
        <section key={section.id} className="space-y-6">
          {/* Section banner */}
          <div
            className="rounded-2xl px-5 py-4 flex items-center justify-between"
            style={{
              background: `linear-gradient(135deg, hsl(${(sIdx * 47 + 200) % 360} 70% 92%), hsl(${(sIdx * 47 + 260) % 360} 70% 96%))`,
              color: `hsl(${(sIdx * 47 + 200) % 360} 40% 25%)`,
            }}
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] opacity-70">
                {t("unit")} {section.number}
              </p>
              <h3 className="text-lg font-bold leading-tight">{loc(section.title, uiLang)}</h3>
            </div>
            <BookOpen className="h-6 w-6 opacity-50" />
          </div>

          {section.units.map(unit => (
            <UnitBlock
              key={unit.id}
              unit={unit}
              currentLessonId={currentLessonId}
              learnedIds={learnedIds}
              uiLang={uiLang}
              onStart={startLesson}
              onBrowse={openDictionary}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

function UnitBlock({
  unit, currentLessonId, learnedIds, uiLang, onStart, onBrowse,
}: {
  unit: PathUnit;
  currentLessonId?: string;
  learnedIds: Set<string>;
  uiLang: string;
  onStart: (l: PathLesson) => void;
  onBrowse: (l: PathLesson) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="px-1">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: `hsl(${unit.hue} 50% 35%)` }}
        >
          {loc(unit.title, uiLang)}
        </p>
        <p className="text-xs text-muted-foreground">{loc(unit.subtitle, uiLang)}</p>
      </div>

      <ol className="relative py-2">
        {unit.lessons.map((lesson, i) => {
          const prog = lessonProgress(lesson, learnedIds);
          const isCurrent = lesson.id === currentLessonId;
          const isLocked =
            !prog.completed && !isCurrent &&
            // locked if a prior lesson in this unit isn't done
            unit.lessons.slice(0, i).some(prev => !lessonProgress(prev, learnedIds).completed);

          // Zig-zag: shift by index
          const offset = ["ml-0", "ml-16", "ml-8", "ml-20", "ml-4"][i % 5];

          return (
            <li key={lesson.id} className={cn("flex items-center gap-4 py-2", offset)}>
              <PathNode
                hue={unit.hue}
                completed={prog.completed}
                current={isCurrent}
                locked={isLocked}
                kind={lesson.kind}
                onClick={() => (isLocked ? null : onStart(lesson))}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">
                  {loc(lesson.title, uiLang)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {prog.done}/{prog.total} · {labelFor(lesson.kind, uiLang)}
                </p>
              </div>
              {!isLocked && (
                <button
                  type="button"
                  onClick={() => onBrowse(lesson)}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  {uiLang === "nl" ? "bekijk" : uiLang === "ar" ? "تصفح" : "browse"}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PathNode({
  hue, completed, current, locked, kind, onClick,
}: {
  hue: number;
  completed: boolean;
  current: boolean;
  locked: boolean;
  kind: "lesson" | "review" | "checkpoint";
  onClick: () => void;
}) {
  const Icon =
    kind === "checkpoint" ? Trophy
    : kind === "review" ? Star
    : completed ? Check
    : BookOpen;

  const bg = locked
    ? "hsl(var(--muted))"
    : completed
      ? `hsl(${hue} 55% 45%)`
      : current
        ? `hsl(${hue} 75% 55%)`
        : "hsl(var(--background))";

  const fg = locked
    ? "hsl(var(--muted-foreground))"
    : completed || current
      ? "white"
      : `hsl(${hue} 50% 35%)`;

  const ring = current
    ? `0 0 0 4px hsl(${hue} 75% 55% / 0.18), 0 8px 0 hsl(${hue} 55% 38%)`
    : completed
      ? `0 4px 0 hsl(${hue} 55% 32%)`
      : locked
        ? "0 3px 0 hsl(var(--border))"
        : `0 5px 0 hsl(${hue} 40% 75%)`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      aria-current={current ? "step" : undefined}
      className={cn(
        "relative flex items-center justify-center rounded-full transition-transform",
        "h-16 w-16 shrink-0",
        !locked && "hover:-translate-y-0.5 active:translate-y-0",
        current && "animate-pulse",
      )}
      style={{
        background: bg,
        color: fg,
        boxShadow: ring,
        border: locked ? "2px dashed hsl(var(--border))" : "none",
      }}
    >
      {locked ? <Lock className="h-5 w-5" /> : <Icon className="h-6 w-6" strokeWidth={2.5} />}
    </button>
  );
}

function labelFor(kind: "lesson" | "review" | "checkpoint", lang: string) {
  if (kind === "checkpoint") return lang === "nl" ? "Checkpoint" : lang === "ar" ? "نقطة تفتيش" : "Checkpoint";
  if (kind === "review") return lang === "nl" ? "Herhaling" : lang === "ar" ? "مراجعة" : "Review";
  return lang === "nl" ? "Les" : lang === "ar" ? "درس" : "Lesson";
}

// Map a subcategory id to a navigable dictionary URL.
function subcategoryToPath(conceptPrefix: string, subcategoryId: string): string | null {
  // We rely on the same data; find the owning category.
  // Lazy require to avoid circular import noise.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getCategoryForSubcategory } = require("@/data/courseData");
  const cat = getCategoryForSubcategory(subcategoryId);
  if (!cat) return null;
  return `${conceptPrefix}/${cat.id}/${subcategoryId}`;
}
