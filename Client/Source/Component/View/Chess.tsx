import { CardButton } from "@/Component/UI/card-button";
import { Container } from "@/Component/UI/container";
import { ChessLessonView } from "@/Component/Chess/View/Lesson";
import { ChessPlayView } from "@/Component/Chess/View/Play/Index";
import { ChessPuzzleView } from "@/Component/Chess/View/Puzzle";
import { useApp } from "@/Context/App";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useEffect, useState, useMemo } from "react";

// Explicitly defined local type boundaries to prevent backend cross-contamination
export type I18nLang = "Dutch" | "English" | "Arabic";

/* ─────────────────────────── EmptyState ─────────────────────────── */

type EmptyKind = "subcategories" | "words" | "groups" | "lessons" | "puzzles";

const EMPTY_MESSAGES: Record<EmptyKind, Record<I18nLang, string>> = {
  subcategories: {
    Dutch:   "Deze categorie is leeg. Voeg subcategorieën of woorden toe.",
    English: "This category is empty. Add subcategories or words.",
    Arabic:  "هذه الفئة فارغة. أضف فئات فرعية أو كلمات.",
  },
  words: {
    Dutch:   "Geen woorden hier. Tik op + om er een toe te voegen.",
    English: "No words here. Tap + to add one.",
    Arabic:  "لا توجد كلمات هنا. اضغط + للإضافة.",
  },
  groups: {
    Dutch:   "Dit niveau is nog leeg. Binnenkort meer lessen.",
    English: "This level is empty. More lessons coming soon.",
    Arabic:  "هذا المستوى فارغ. قريباً المزيد من الدروس.",
  },
  lessons: {
    Dutch:   "Deze groep is nog leeg. Binnenkort meer lessen.",
    English: "This group is empty. More lessons coming soon.",
    Arabic:  "هذه المجموعة فارغة. قريباً المزيد من الدروس.",
  },
  puzzles: {
    Dutch:   "Geen tactische puzzels gevonden.",
    English: "No tactical puzzles found.",
    Arabic:  "لم يتم العثور على ألعاب ألغاز.",
  }
};

export function EmptyState({ uiLang, kind }: { uiLang: I18nLang; kind: EmptyKind; onBack?: () => void }) {
  return (
    <div className="px-4 w-full">
      <Container className="p-6 text-center text-sm opacity-70">
        {EMPTY_MESSAGES[kind][uiLang] ?? EMPTY_MESSAGES[kind].English}
      </Container>
    </div>
  );
}

/* ─────────────────────────── ChessBranch ─────────────────────────── */

const CHESS_MENU_LABELS: Record<string, Record<I18nLang, string>> = {
  lesson: { Dutch: "Les",    English: "Lesson", Arabic: "درس"  },
  puzzle: { Dutch: "Puzzel", English: "Puzzle", Arabic: "لغز"  },
  play:   { Dutch: "Spelen", English: "Play",   Arabic: "العب" },
};

const GRID_CLASS = "grid grid-cols-2 gap-3 w-full px-4";
const CARD_CLASS = "min-h-[64px] py-3 px-3 flex items-center justify-center text-center";

export function ChessBranch() {
  const { browsePath, pushBrowse, setBrowsePath } = useApp();
  const { i18nLang, t } = useCourseLanguage();

  // Dynamic remote state engines
  const [corpus, setCorpus] = useState<{ levels: any[]; puzzles: string[] } | null>(null);
  const [activePuzzle, setActivePuzzle] = useState<{ data: any; fenId: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Initial Sync of Main Chess Database Metadata
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    fetch(`${baseUrl}/api/chess-corpus`)
      .then(res => res.json())
      .then(data => setCorpus(data))
      .catch(err => console.error("Error connecting to chess asset stream:", err))
      .finally(() => setLoading(false));
  }, []);

  // 2. Focused Side-Effect Listener to Query Puzzles on Demand
  const currentFenId = browsePath[1] === "puzzle" && browsePath[2] ? browsePath[2] : null;
  useEffect(() => {
    if (!currentFenId) {
      setActivePuzzle(null);
      return;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    fetch(`${baseUrl}/api/chess-puzzle?fen=${encodeURIComponent(currentFenId)}`)
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(puzzleData => {
        if (puzzleData) {
          setActivePuzzle({ data: puzzleData, fenId: currentFenId });
        }
      })
      .catch(err => console.error("Could not fetch puzzle item payload:", err));
  }, [currentFenId]);

  // Derived structural arrays
  const allLevels  = useMemo(() => corpus?.levels || [], [corpus]);
  const allPuzzles = useMemo(() => corpus?.puzzles || [], [corpus]);

  if (loading) {
    return <div className="text-sm py-12 text-center opacity-60">Synchronizing Chess maps...</div>;
  }

  // ── /chess ──────────────────────────────────────────────────────────
  if (browsePath.length === 1) {
    return (
      <div className={GRID_CLASS}>
        {Object.entries(CHESS_MENU_LABELS).map(([id, labels]) => (
          <CardButton key={id} onClick={() => pushBrowse(id)} className={CARD_CLASS}>
            <span className="font-semibold">{labels[i18nLang] ?? labels.English}</span>
          </CardButton>
        ))}
      </div>
    );
  }

  // ── /chess/play ──────────────────────────────────────────────────────
  if (browsePath[1] === "play") {
    return <ChessPlayView />;
  }

  // ── /chess/puzzle ────────────────────────────────────────────────────
  if (browsePath[1] === "puzzle" && browsePath.length === 2) {
    if (allPuzzles.length === 0) return <EmptyState uiLang={i18nLang} kind="puzzles" />;
    return (
      <div className={GRID_CLASS}>
        {allPuzzles.map(fenId => (
          <CardButton key={fenId} onClick={() => pushBrowse(fenId)} className={CARD_CLASS}>
            <span className="font-semibold text-sm">
              Puzzle #{fenId.slice(0, 6).toUpperCase()}
            </span>
          </CardButton>
        ))}
      </div>
    );
  }

  // ── /chess/puzzle/:id ────────────────────────────────────────────────
  if (browsePath[1] === "puzzle" && browsePath.length === 3) {
    if (!activePuzzle || activePuzzle.fenId !== currentFenId) {
      return <div className="text-sm py-12 text-center opacity-60">Loading puzzle matrix...</div>;
    }
    
    const currentIndex = allPuzzles.indexOf(activePuzzle.fenId);
    const nextFen = currentIndex !== -1 ? allPuzzles[currentIndex + 1] : undefined;

    return (
      <ChessPuzzleView
        puzzle={activePuzzle.data}
        fenId={activePuzzle.fenId}
        onSolved={nextFen ? () => setBrowsePath([...browsePath.slice(0, -1), nextFen]) : undefined}
      />
    );
  }

  // ── /chess/lesson ────────────────────────────────────────────────────
  if (browsePath[1] === "lesson" && browsePath.length === 2) {
    return (
      <div className={GRID_CLASS}>
        {allLevels.map(lvl => (
          <CardButton key={lvl.id} onClick={() => pushBrowse(lvl.id)} className={CARD_CLASS}>
            <span className="font-semibold">{lvl.name[i18nLang] ?? lvl.name.English}</span>
          </CardButton>
        ))}
      </div>
    );
  }

  // ── /chess/lesson/:levelId ───────────────────────────────────────────
  if (browsePath[1] === "lesson" && browsePath.length === 3) {
    const lvl = allLevels.find(l => l.id === browsePath[2]?.toLowerCase());
    if (!lvl) return <div className="px-4 text-sm py-6 text-center opacity-60">{t("notFound")}</div>;
    if (lvl.groups.length === 0) return <EmptyState uiLang={i18nLang} kind="groups" />;

    return (
      <div className={GRID_CLASS}>
        {lvl.groups.map(g => (
          <CardButton key={g.id} onClick={() => pushBrowse(g.id)} className={CARD_CLASS}>
            <span className="font-semibold">{g.name[i18nLang] ?? g.name.English}</span>
          </CardButton>
        ))}
      </div>
    );
  }

  // ── /chess/lesson/:levelId/:groupId ─────────────────────────────────
  if (browsePath[1] === "lesson" && browsePath.length === 4) {
    const lvl = allLevels.find(l => l.id === browsePath[2]?.toLowerCase());
    const grp = lvl?.groups.find(g => g.id === browsePath[3]);
    if (!grp) return <div className="px-4 text-sm py-6 text-center opacity-60">{t("notFound")}</div>;
    if (grp.lessons.length === 0) return <EmptyState uiLang={i18nLang} kind="lessons" />;

    return (
      <div className={GRID_CLASS}>
        {grp.lessons.map(ls => (
          <CardButton key={ls.id} onClick={() => pushBrowse(ls.id)} className={CARD_CLASS}>
            <span className="font-semibold">{ls.name[i18nLang] ?? ls.name.English}</span>
          </CardButton>
        ))}
      </div>
    );
  }

  // ── /chess/lesson/:levelId/:groupId/:lessonId ────────────────────────
  if (browsePath[1] === "lesson" && browsePath.length === 5) {
    const lvl = allLevels.find(l => l.id === browsePath[2]?.toLowerCase());
    const grp = lvl?.groups.find(g => g.id === browsePath[3]);
    const lesson = grp?.lessons.find(ls => ls.id === browsePath[4]);
    if (!lesson) return <div className="px-4 text-sm py-6 text-center opacity-60">{t("notFound")}</div>;

    const currentIndex = grp!.lessons.findIndex(l => l.id === lesson.id);
    const nextLesson = grp!.lessons[currentIndex + 1];

    return (
      <ChessLessonView
        category={browsePath[2]}
        subcategory={browsePath[3]}
        lessonId={browsePath[4]}
        onNext={nextLesson ? () => setBrowsePath([...browsePath.slice(0, -1), nextLesson.id]) : undefined}
      />
    );
  }

  return <div className="px-4 text-sm py-6 text-center opacity-60">{t("notFound")}</div>;
}