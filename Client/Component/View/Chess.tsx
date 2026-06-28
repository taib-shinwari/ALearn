// Client/Component/Chess/ChessBranch.tsx
import { ArrowLeft } from "lucide-react";
import { CardButton } from "Client/Component/UI/card-button";
import { Container } from "Client/Component/UI/container";
import { Button } from "Client/Component/UI/button";
import { ChessLessonView } from "Client/Component/Chess/ChessLessonView";
import { ChessPlayView } from "Client/Component/Chess/ChessPlayView";
import { ChessPuzzleView } from "Client/Component/Chess/ChessPuzzleView";
import { useApp } from "Client/Context/App";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { getChessLevels, getChessLevel, getAllPuzzles, getPuzzleByFen } from "Server/API/Chess";
import type { I18nLang } from "Server/API/Language";

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

export function EmptyState({ uiLang, kind, onBack }: { uiLang: I18nLang; kind: EmptyKind; onBack?: () => void }) {
  return (
    <div className="px-4 max-w-xl mx-auto w-full space-y-4">
      <Container className="p-6 text-center text-sm opacity-70">
        {EMPTY_MESSAGES[kind][uiLang] ?? EMPTY_MESSAGES[kind].English}
      </Container>
      {onBack && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── ChessBranch ─────────────────────────── */

const CHESS_MENU_LABELS: Record<string, Record<I18nLang, string>> = {
  lesson: { Dutch: "Les",    English: "Lesson", Arabic: "درس"  },
  puzzle: { Dutch: "Puzzel", English: "Puzzle", Arabic: "لغز"  },
  play:   { Dutch: "Spelen", English: "Play",   Arabic: "العب" },
};

export function ChessBranch() {
  const { browsePath, pushBrowse, popBrowse, setBrowsePath } = useApp();
  const { uiLang, i18nLang, t } = useCourseLanguage();

  // Unified sync file data access matrices
  const allLevels = getChessLevels();
  const allPuzzles = getAllPuzzles();

  const BackHeader = ({ label }: { label: string }) => (
    <div className="flex items-center gap-3 px-4 mb-4 w-full max-w-3xl mx-auto">
      <Button variant="ghost" size="icon" onClick={popBrowse} aria-label="Go Back" className="h-8 w-8 shrink-0">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h2 className="text-sm font-semibold tracking-wide opacity-70 uppercase">{label}</h2>
    </div>
  );

  // ── /chess ──────────────────────────────────────────────────────────
  if (browsePath.length === 1) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full px-4 max-w-3xl mx-auto">
        {Object.entries(CHESS_MENU_LABELS).map(([id, labels]) => (
          <CardButton
            key={id}
            onClick={() => pushBrowse(id)}
            className="min-h-[100px] flex items-center justify-center text-center p-4"
          >
            <span className="font-semibold text-base">{labels[uiLang]}</span>
          </CardButton>
        ))}
      </div>
    );
  }

  // ── /chess/play ──────────────────────────────────────────────────────
  if (browsePath[1] === "play") {
    return (
      <div className="w-full space-y-2">
        <BackHeader label={CHESS_MENU_LABELS.play[i18nLang]} />
        <ChessPlayView />
      </div>
    );
  }

  // ── /chess/puzzle ────────────────────────────────────────────────────
  if (browsePath[1] === "puzzle" && browsePath.length === 2) {
    if (allPuzzles.length === 0) return <EmptyState uiLang={i18nLang} kind="puzzles" onBack={popBrowse} />;

    return (
      <div className="w-full max-w-3xl mx-auto">
        <BackHeader label={CHESS_MENU_LABELS.puzzle[i18nLang]} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4">
          {allPuzzles.map(fenId => (
            <CardButton
              key={fenId}
              onClick={() => pushBrowse(fenId)}
              className="min-h-[72px] flex flex-col items-start justify-center text-left p-4"
            >
              <span className="font-semibold text-sm line-clamp-1">
                Puzzle #{fenId.slice(0, 6).toUpperCase()}...
              </span>
              <span className="text-xs opacity-40 truncate w-full">{fenId}</span>
            </CardButton>
          ))}
        </div>
      </div>
    );
  }

  // ── /chess/puzzle/:id ────────────────────────────────────────────────
  if (browsePath[1] === "puzzle" && browsePath.length === 3) {
    const fenId = browsePath[2];
    const puzzleData = getPuzzleByFen(fenId);
    if (!puzzleData) return <div className="px-4 text-sm py-6 text-center opacity-60">{t("notFound")}</div>;
    
    const currentIndex = allPuzzles.indexOf(fenId);
    const nextFen = allPuzzles[currentIndex + 1];

    return (
      <div className="w-full space-y-2">
        <BackHeader label={`Puzzle #${fenId.slice(0, 6).toUpperCase()}`} />
        <ChessPuzzleView
          puzzle={puzzleData}
          onSolved={nextFen ? () => setBrowsePath([...browsePath.slice(0, -1), nextFen]) : undefined}
        />
      </div>
    );
  }

  // ── /chess/lesson ────────────────────────────────────────────────────
  if (browsePath[1] === "lesson" && browsePath.length === 2) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <BackHeader label={CHESS_MENU_LABELS.lesson[i18nLang]} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4">
          {allLevels.map(lvl => (
            <CardButton
              key={lvl.id}
              onClick={() => pushBrowse(lvl.id)}
              className="min-h-[72px] p-4 flex items-center justify-center text-center"
            >
              <span className="font-semibold text-sm">{lvl.name[i18nLang] ?? lvl.name.English}</span>
            </CardButton>
          ))}
        </div>
      </div>
    );
  }

  // ── /chess/lesson/:levelId ───────────────────────────────────────────
  if (browsePath[1] === "lesson" && browsePath.length === 3) {
    const lvl = getChessLevel(browsePath[2]);
    if (!lvl) return <div className="px-4 text-sm py-6 text-center opacity-60">{t("notFound")}</div>;
    if (lvl.groups.length === 0) return <EmptyState uiLang={i18nLang} kind="groups" onBack={popBrowse} />;

    return (
      <div className="w-full max-w-3xl mx-auto">
        <BackHeader label={lvl.name[i18nLang] ?? lvl.name.English} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4">
          {lvl.groups.map(g => (
            <CardButton
              key={g.id}
              onClick={() => pushBrowse(g.id)}
              className="min-h-[72px] p-4 flex items-center justify-between gap-4"
            >
              <span className="font-semibold text-sm text-left">{g.name[i18nLang] ?? g.name.English}</span>
              <span className="text-xs opacity-50 shrink-0">{g.lessons.length} Lessons</span>
            </CardButton>
          ))}
        </div>
      </div>
    );
  }

  // ── /chess/lesson/:levelId/:groupId ─────────────────────────────────
  if (browsePath[1] === "lesson" && browsePath.length === 4) {
    const lvl = getChessLevel(browsePath[2]);
    const grp = lvl?.groups.find(g => g.id === browsePath[3]);
    if (!grp) return <div className="px-4 text-sm py-6 text-center opacity-60">{t("notFound")}</div>;
    if (grp.lessons.length === 0) return <EmptyState uiLang={i18nLang} kind="lessons" onBack={popBrowse} />;

    return (
      <div className="w-full max-w-3xl mx-auto">
        <BackHeader label={grp.name[i18nLang] ?? grp.name.English} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4">
          {grp.lessons.map(ls => (
            <CardButton
              key={ls.id}
              onClick={() => pushBrowse(ls.id)}
              className="min-h-[72px] p-4 flex items-center justify-center text-center text-sm font-semibold"
            >
              <span className="line-clamp-2">{ls.name[i18nLang] ?? ls.name.English}</span>
            </CardButton>
          ))}
        </div>
      </div>
    );
  }

  // ── /chess/lesson/:levelId/:groupId/:lessonId ────────────────────────
  if (browsePath[1] === "lesson" && browsePath.length === 5) {
    const lvl = getChessLevel(browsePath[2]);
    const grp = lvl?.groups.find(g => g.id === browsePath[3]);
    const lesson = grp?.lessons.find(ls => ls.id === browsePath[4]);
    if (!lesson) return <div className="px-4 text-sm py-6 text-center opacity-60">{t("notFound")}</div>;

    const currentIndex = grp!.lessons.findIndex(l => l.id === lesson.id);
    const nextLesson = grp!.lessons[currentIndex + 1];

    return (
      <div className="w-full space-y-2">
        <BackHeader label={lesson.name[i18nLang] ?? lesson.name.English} />
        <ChessLessonView
          category={browsePath[2]}
          subcategory={browsePath[3]}
          lessonId={browsePath[4]}
          onNext={nextLesson ? () => setBrowsePath([...browsePath.slice(0, -1), nextLesson.id]) : undefined}
        />
      </div>
    );
  }

  return <div className="px-4 text-sm py-6 text-center opacity-60">{t("notFound")}</div>;
}