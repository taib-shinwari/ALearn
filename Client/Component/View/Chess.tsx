import { CardButton } from "Client/Component/UI/card-button";
import { Container } from "Client/Component/UI/container";
import { ChessLessonView } from "Client/Component/Chess/ChessLessonView";
import { ChessPlayView } from "Client/Component/Chess/ChessPlayView";
import { ChessPuzzleView } from "Client/Component/Chess/ChessPuzzleView";
import { useApp } from "Client/Context/App";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { chessLevels, cName } from "Server/Data/chessData";
import { PUZZLES } from "Server/Data/chessPuzzles";
import type { I18nLang } from "Server/API/Language";

/* ─────────────────────────── EmptyState ─────────────────────────── */

type EmptyKind = "subcategories" | "words" | "groups" | "lessons";

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
};

export function EmptyState({ uiLang, kind }: { uiLang: I18nLang; kind: EmptyKind }) {
  return (
    <div className="px-4">
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

export function ChessBranch() {
  const { browsePath, pushBrowse, setBrowsePath } = useApp();
  const { uiLang, t } = useCourseLanguage(); // uiLang: I18nLang

  // ── /chess ──────────────────────────────────────────────────────────
  if (browsePath.length === 1) {
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        {Object.entries(CHESS_MENU_LABELS).map(([id, labels]) => (
          <CardButton
            key={id}
            onClick={() => pushBrowse(id)}
            className="min-h-[88px] flex items-center justify-center text-center"
          >
            <span className="font-semibold text-sm">{labels[uiLang]}</span>
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
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        {PUZZLES.map(p => (
          <CardButton
            key={p.id}
            onClick={() => pushBrowse(p.id)}
            className="min-h-[80px] flex flex-col items-center justify-center text-center gap-1"
          >
            <span className="font-semibold text-sm">{p.title[uiLang] ?? p.title.English}</span>
            <span className="text-xs opacity-60">{p.theme[uiLang] ?? p.theme.English}</span>
          </CardButton>
        ))}
      </div>
    );
  }

  // ── /chess/puzzle/:id ────────────────────────────────────────────────
  if (browsePath[1] === "puzzle" && browsePath.length === 3) {
    const p = PUZZLES.find(x => x.id === browsePath[2]);
    if (!p) return <div className="px-4 text-sm">{t("notFound")}</div>;
    const next = PUZZLES[PUZZLES.findIndex(x => x.id === p.id) + 1];
    return (
      <ChessPuzzleView
        puzzle={p}
        onSolved={next ? () => setBrowsePath([...browsePath.slice(0, -1), next.id]) : undefined}
      />
    );
  }

  // ── /chess/lesson ────────────────────────────────────────────────────
  if (browsePath[1] === "lesson" && browsePath.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        {chessLevels.map(lvl => (
          <CardButton
            key={lvl.id}
            onClick={() => pushBrowse(lvl.id)}
            className="min-h-[64px] py-3 flex items-center justify-center text-center"
          >
            <span className="font-semibold text-sm">{cName(lvl.name, uiLang)}</span>
          </CardButton>
        ))}
      </div>
    );
  }

  // ── /chess/lesson/:levelId ───────────────────────────────────────────
  if (browsePath[1] === "lesson" && browsePath.length === 3) {
    const lvl = chessLevels.find(l => l.id === browsePath[2]);
    if (!lvl) return <div className="px-4 text-sm">{t("notFound")}</div>;
    if (lvl.groups.length === 0) return <EmptyState uiLang={uiLang} kind="groups" />;
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        {lvl.groups.map(g => (
          <CardButton
            key={g.id}
            onClick={() => pushBrowse(g.id)}
            className="min-h-[64px] py-3 flex items-center justify-center text-center"
          >
            <span className="font-semibold text-sm">{cName(g.name, uiLang)}</span>
          </CardButton>
        ))}
      </div>
    );
  }

  // ── /chess/lesson/:levelId/:groupId ─────────────────────────────────
  if (browsePath[1] === "lesson" && browsePath.length === 4) {
    const lvl = chessLevels.find(l => l.id === browsePath[2]);
    const grp = lvl?.groups.find(g => g.id === browsePath[3]);
    if (!grp) return <div className="px-4 text-sm">{t("notFound")}</div>;
    if (grp.lessons.length === 0) return <EmptyState uiLang={uiLang} kind="lessons" />;
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        {grp.lessons.map(ls => (
          <CardButton
            key={ls.id}
            onClick={() => pushBrowse(ls.id)}
            className="min-h-[80px] flex items-center justify-center text-center"
          >
            <span className="font-semibold text-sm">{cName(ls.name, uiLang)}</span>
          </CardButton>
        ))}
      </div>
    );
  }

  // ── /chess/lesson/:levelId/:groupId/:lessonId ────────────────────────
  if (browsePath[1] === "lesson" && browsePath.length === 5) {
    const lvl    = chessLevels.find(l => l.id === browsePath[2]);
    const grp    = lvl?.groups.find(g => g.id === browsePath[3]);
    const lesson = grp?.lessons.find(ls => ls.id === browsePath[4]);
    if (!lesson) return <div className="px-4 text-sm">{t("notFound")}</div>;
    const next = grp!.lessons[grp!.lessons.findIndex(l => l.id === lesson.id) + 1];
    return (
      <ChessLessonView
        lesson={lesson}
        onNext={next ? () => setBrowsePath([...browsePath.slice(0, -1), next.id]) : undefined}
      />
    );
  }

  return <div className="px-4 text-sm">{t("notFound")}</div>;
}