import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Lock, Play, Star, Trophy, BookOpen, RefreshCw } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import {
  SKILL_TREE, nodesByTier, SkillNode, SkillBranch, BRANCH_LABELS,
} from "@/data/skillTree";
import { computeAllStatuses, getNodeMastery, NodeStatus } from "@/lib/mastery";
import { PathLesson, lessonProgress } from "@/data/learningUnits";

function loc<T extends { en: string; nl: string; ar?: string }>(o: T, lang: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (o as any)[lang] || o.en;
}

const STATUS_BADGE: Record<NodeStatus, string> = {
  locked:    "opacity-50",
  available: "ring-2 ring-foreground/30",
  learning:  "ring-2 ring-amber-500/60",
  mastered:  "ring-2 ring-emerald-500/70",
  rusty:     "ring-2 ring-rose-500/60",
};

const BRANCHES: SkillBranch[] = ["vocab", "listening", "speaking", "grammar"];

export function SkillTree() {
  const navigate = useNavigate();
  const { reviews, pathProgress, setPracticeScope } = useApp();
  const { uiLang, t } = useCourseLanguage();

  const tiers = useMemo(() => nodesByTier(), []);
  const statuses = useMemo(
    () => computeAllStatuses(SKILL_TREE, pathProgress),
    [pathProgress],
  );
  const learnedIds = useMemo(
    () => new Set(reviews.filter(r => (r.reps ?? 0) > 0 || r.learned).map(r => r.wordId)),
    [reviews],
  );

  const startLesson = (lesson: PathLesson) => {
    setPracticeScope({ type: "subcategory", id: lesson.subcategoryId, lessonId: lesson.id });
    navigate("/practice");
  };

  return (
    <div className="space-y-4">
      {/* Branch legend */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        {BRANCHES.map(b => (
          <Container key={b} className="px-2 py-0.5">
            {loc(BRANCH_LABELS[b], uiLang)}
          </Container>
        ))}
      </div>

      {/* Tree, tier by tier */}
      <div className="space-y-4">
        {tiers.map((tierNodes, tierIdx) => (
          <div key={tierIdx} className="space-y-2">
            <div className="text-[10px] uppercase tracking-widest opacity-60 px-1">
              {t("unit") || "Tier"} {tierIdx + 1}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BRANCHES.map(branch => {
                const node = tierNodes.find(n => n.branch === branch);
                if (!node) return <div key={branch} aria-hidden />;
                return (
                  <NodeCard
                    key={node.id}
                    node={node}
                    status={statuses[node.id]}
                    pathProgress={pathProgress}
                    learnedIds={learnedIds}
                    uiLang={uiLang}
                    t={t}
                    onStartLesson={startLesson}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NodeCard({
  node, status, pathProgress, learnedIds, uiLang, t, onStartLesson,
}: {
  node: SkillNode;
  status: NodeStatus;
  pathProgress: Record<string, import("@/context/AppContext").LessonProgressEntry>;
  learnedIds: Set<string>;
  uiLang: string;
  t: (k: string) => string;
  onStartLesson: (l: PathLesson) => void;
}) {
  const mastery = getNodeMastery(node, pathProgress);
  const locked = status === "locked";

  return (
    <Container className={cn("p-3 space-y-2", STATUS_BADGE[status], locked && "opacity-60")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest opacity-60">
            {loc(BRANCH_LABELS[node.branch], uiLang)}
          </div>
          <h3 className="text-sm font-semibold truncate">{loc(node.title, uiLang)}</h3>
        </div>
        <StatusIcon status={status} />
      </div>

      {/* Mastery bar */}
      <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all",
            status === "mastered" ? "bg-emerald-500"
            : status === "rusty" ? "bg-rose-500"
            : "bg-foreground/70",
          )}
          style={{ width: `${(mastery / 5) * 100}%` }}
        />
      </div>

      {/* Lessons */}
      {!locked && (
        <div className="space-y-1 pt-1">
          {node.lessons.map(lesson => {
            const prog = lessonProgress(lesson, learnedIds, pathProgress);
            const stars = pathProgress[lesson.id]?.stars ?? 0;
            const Icon =
              lesson.kind === "checkpoint" ? Trophy
              : lesson.kind === "review" ? Star
              : prog.completed ? Check
              : BookOpen;
            return (
              <Button
                key={lesson.id}
                fullWidth
                onClick={() => onStartLesson(lesson)}
                className="justify-between text-xs h-9 px-3"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{loc(lesson.title, uiLang)}</span>
                </span>
                {stars > 0 && (
                  <span className="text-amber-500 shrink-0">{"★".repeat(stars)}</span>
                )}
              </Button>
            );
          })}
        </div>
      )}
    </Container>
  );
}

function StatusIcon({ status }: { status: NodeStatus }) {
  if (status === "locked") return <Lock className="h-4 w-4 opacity-60" />;
  if (status === "mastered") return <Check className="h-4 w-4 text-emerald-500" />;
  if (status === "rusty") return <RefreshCw className="h-4 w-4 text-rose-500" />;
  if (status === "learning") return <Play className="h-4 w-4 text-amber-500" />;
  return <Play className="h-4 w-4 opacity-70" />;
}
