// Lessons page: Sections grid → Lessons grid. No title/back/stars; uses standard <Button>.
// Locked lessons prompt confirmation before opening.
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { categories, type Lang, type WordDetail } from "@/data/courseData";

export interface Unit {
  id: string;            // category:sub:offset
  title: string;
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
          words: sub.words.slice(i, i + UNIT_SIZE),
        });
      }
    }
  }
  return units;
}

interface Section {
  id: string;
  number: number;
  name: string;
  units: Unit[];
}

function buildSections(): Section[] {
  const all = buildAllUnits();
  // Heuristic split: first 8 → Beginner, next 12 → Intermediate, rest → Advanced.
  const sections: Section[] = [];
  const groups: [string, number][] = [
    ["Beginner", 8],
    ["Intermediate", 12],
    ["Advanced", Infinity],
  ];
  let idx = 0;
  groups.forEach(([name, size], gi) => {
    const slice = all.slice(idx, idx + size);
    if (slice.length === 0) return;
    sections.push({
      id: `sec-${gi}`,
      number: gi + 1,
      name,
      units: slice,
    });
    idx += size;
  });
  return sections;
}

function progressKey(lang: string) { return `lessons:${lang}`; }
function loadProgress(lang: string): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(progressKey(lang)) || "{}"); }
  catch { return {}; }
}

export default function LessonsPage() {
  const params = useParams<{ lang?: string }>();
  const navigate = useNavigate();
  const lang = (params.lang ?? "nl") as Lang;
  const sections = useMemo(buildSections, []);
  const progress = loadProgress(lang);

  const [openSection, setOpenSection] = useState<string | null>(sections[0]?.id ?? null);
  const [lockedPrompt, setLockedPrompt] = useState<Unit | null>(null);

  // Compute global completion order across all units.
  const allUnits = useMemo(() => sections.flatMap(s => s.units), [sections]);
  const firstIncomplete = allUnits.findIndex(u => (progress[u.id] ?? 0) < 1);
  const unlockedThrough = firstIncomplete === -1 ? allUnits.length : firstIncomplete;

  const isLocked = (unit: Unit) => {
    const i = allUnits.findIndex(u => u.id === unit.id);
    return i > unlockedThrough;
  };

  const goToLesson = (unit: Unit) => {
    navigate(`/lesson/${lang}/${encodeURIComponent(unit.id)}`);
  };

  return (
    <div className="px-4 w-full max-w-3xl mx-auto space-y-4">
      <div className="grid gap-2">
        {sections.map(sec => {
          const isOpen = openSection === sec.id;
          const lessonCount = sec.units.length;
          return (
            <div key={sec.id} className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-3 px-4 text-left"
                onClick={() => setOpenSection(isOpen ? null : sec.id)}
              >
                <span className="flex items-center gap-3">
                  <span className="font-mono opacity-60 text-sm">
                    {String(sec.number).padStart(2, "0")}
                  </span>
                  <span className="font-semibold text-base">{sec.name}</span>
                </span>
                <span className="text-xs opacity-70">{lessonCount} Lessons</span>
              </Button>

              {isOpen && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-2">
                  {sec.units.map((u, i) => {
                    const locked = isLocked(u);
                    const stars = progress[u.id] ?? 0;
                    return (
                      <Button
                        key={u.id}
                        variant="outline"
                        className="h-auto py-2 px-2 flex flex-col items-stretch gap-1 text-left"
                        onClick={() => locked ? setLockedPrompt(u) : goToLesson(u)}
                      >
                        <span className="text-[10px] uppercase tracking-wider opacity-60 flex justify-between">
                          <span>#{i + 1}</span>
                          {stars > 0 && <span className="opacity-80">✓</span>}
                          {locked && !stars && <span className="opacity-60">🔒</span>}
                        </span>
                        <span className="text-xs font-medium leading-tight border-t border-border/50 pt-1 truncate">
                          {u.title}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!lockedPrompt} onOpenChange={(o) => !o && setLockedPrompt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This lesson is locked</AlertDialogTitle>
            <AlertDialogDescription>
              Complete the earlier lessons first to keep the path in order. Would you still like to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const u = lockedPrompt;
              setLockedPrompt(null);
              if (u) goToLesson(u);
            }}>Proceed</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
