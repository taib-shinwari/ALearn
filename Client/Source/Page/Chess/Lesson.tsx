import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Chessboard } from "@/Component/Chess/Chessboard";
import { Button } from "@/Component/UI/Button";
import { Container } from "@/Component/UI/container";
import { ChevronRight, Lock, Star } from "lucide-react";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useChessSettings } from "@/Library/chessSettings";
import {
  parseLessonStep,
  PlacedPiece,
  PieceColor,
  PieceType,
  Arrow
} from "@/Component/Parser/Chess/Learn-To-Play";

export type I18nLang = "Dutch" | "English" | "Arabic";

// Client-side local engines / ambient definitions
declare const isLegalMove: (type: PieceType, from: string, to: string, wouldCapture: boolean) => boolean;
declare const reachableSquares: (type: PieceType, square: string) => string[];

const GRID_CLASS = "grid grid-cols-2 gap-3 w-full px-4";
const CARD_CLASS = "min-h-[64px] py-3 px-3 flex items-center justify-center text-center text-base";

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
    English: "Deze groep is leeg. More lessons coming soon.",
    Arabic:  "هذه المجموعة فارغة. قريباً المزيد من الدروس.",
  },
  puzzles: {
    Dutch:   "Geen tactische puzzels gevonden.",
    English: "No tactical puzzles found.",
    Arabic:  "لم يتم العثور على ألعاب ألغاز.",
  }
};

function EmptyState({ uiLang, kind }: { uiLang: I18nLang; kind: EmptyKind }) {
  return (
    <div className="px-4 w-full">
      <Container className="p-6 text-center text-sm opacity-70">
        {EMPTY_MESSAGES[kind][uiLang] ?? EMPTY_MESSAGES[kind].English}
      </Container>
    </div>
  );
}

/**
 * Strips leading ordering prefixes like "1-", "02-", "3_" from names
 * e.g., "3-The-Bishop" => "The-Bishop"
 */
function cleanDisplayName(name: string | undefined): string {
  if (!name) return "";
  return name.replace(/^\d+[\s_-]*/, "");
}

function resolveLessonText(keyOrText: string | undefined, _lang: string): string {
  if (!keyOrText) return "";
  return keyOrText;
}

type Phase = "intro" | "play" | "done";

export function ChessLessonView() {
  const { category, subcategory, lessonId } = useParams();
  const navigate = useNavigate();
  const { uiLang, i18nLang, t } = useCourseLanguage();
  const [settings] = useChessSettings();

  const [corpus, setCorpus] = useState<{ levels: any[] } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Completed lessons tracker stored in local state/storage
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("chess_completed_lessons");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const markLessonComplete = (id: string) => {
    setCompletedLessons((prev) => {
      const updated = new Set(prev).add(id);
      try {
        localStorage.setItem("chess_completed_lessons", JSON.stringify([...updated]));
      } catch (err) {
        console.error("Failed to persist lesson progress:", err);
      }
      return updated;
    });
  };

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    fetch(`${baseUrl}/api/chess-corpus`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCorpus(data))
      .catch((err) => console.error("Corpus error:", err))
      .finally(() => setLoading(false));
  }, []);

  const allLevels = useMemo(() => corpus?.levels || [], [corpus]);

  const currentLvl = useMemo(() => allLevels.find((l) => l.id === category?.toLowerCase()), [allLevels, category]);
  const currentGrp = useMemo(() => currentLvl?.groups?.find((g: any) => g.id === subcategory), [currentLvl, subcategory]);
  const lessonEntry = useMemo(() => currentGrp?.lessons?.find((l: any) => l.id === lessonId), [currentGrp, lessonId]);

  const lesson = useMemo(() => {
    if (!category || !subcategory || !lessonId || !lessonEntry) return null;
    const raw = lessonEntry?.steps?.[0];
    return parseLessonStep(raw);
  }, [category, subcategory, lessonId, lessonEntry]);

  const [phase, setPhase] = useState<Phase>("intro");
  const [piece, setPiece] = useState<PlacedPiece | null>(null);
  const [extras, setExtras] = useState<PlacedPiece[]>([]);
  const [stars, setStars] = useState<string[]>([]);
  const [captured, setCaptured] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [canAdvance, setCanAdvance] = useState(false);
  const [pulse, setPulse] = useState(1);

  // Target sequence calculations for next step/lesson
  const nextLessonRoute = useMemo(() => {
    if (!currentGrp || !lessonEntry) return null;
    const currentIndex = currentGrp.lessons.findIndex((l: any) => l.id === lessonEntry.id);
    const next = currentGrp.lessons[currentIndex + 1];
    return next ? `/Chess/Lesson/${category}/${subcategory}/${next.id}` : null;
  }, [currentGrp, lessonEntry, category, subcategory]);

  useEffect(() => {
    if (!lesson) return;
    setPhase("intro");
    setPiece({ ...lesson.piece });
    setExtras((lesson.extras ?? []).map((p: any) => ({ ...p })));
    setCaptured(new Set());
    setSelected(null);
    setLastMove(null);
    setCanAdvance(false);

    if (lesson.randomStars && lesson.randomStars > 0 && typeof reachableSquares === "function") {
      const reach = reachableSquares(lesson.piece.type, lesson.piece.square).filter((s) => s !== lesson.piece.square);
      const picked: string[] = [];
      const pool = [...reach];
      const n = Math.min(lesson.randomStars, pool.length);
      for (let i = 0; i < n; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        picked.push(pool.splice(idx, 1)[0]);
      }
      setStars(picked);
    } else {
      setStars([...(lesson.stars ?? [])]);
    }
  }, [lesson]);

  // Handle immediate navigation on lesson completion
  useEffect(() => {
    if (phase !== "done" || !lessonEntry) return;

    markLessonComplete(lessonEntry.id);

    // Skip completion modal: go directly to next lesson or subcategory slug
    if (nextLessonRoute) {
      navigate(nextLessonRoute, { replace: true });
    } else {
      navigate(`/Chess/Lesson/${category}/${subcategory}`, { replace: true });
    }
  }, [phase, lessonEntry, nextLessonRoute, navigate, category, subcategory]);

  // Arrow animation pulse logic
  useEffect(() => {
    if (phase !== "intro" || !lesson) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const x = ((t - start) % 1200) / 1200;
      setPulse(0.45 + 0.55 * (0.5 - 0.5 * Math.cos(x * Math.PI * 2)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, lesson]);

  // Intro narration handler
  useEffect(() => {
    if (phase !== "intro" || !lesson) return;
    setCanAdvance(false);
    const txt = resolveLessonText(lesson.intro, uiLang);
    if (settings.speakNarration && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(txt);
        u.lang = uiLang === "nl" ? "nl-NL" : uiLang === "ar" ? "ar-SA" : "en-US";
        u.rate = 0.95;
        u.onend = () => setCanAdvance(true);
        u.onerror = () => setCanAdvance(true);
        window.speechSynthesis.speak(u);
        const tm = window.setTimeout(() => setCanAdvance(true), Math.max(1200, txt.length * 60));
        return () => window.clearTimeout(tm);
      } catch {
        setCanAdvance(true);
      }
    } else {
      const tm = window.setTimeout(() => setCanAdvance(true), 500);
      return () => window.clearTimeout(tm);
    }
  }, [phase, lesson, uiLang, settings.speakNarration]);

  const activeStars = useMemo(() => {
    if (phase !== "play") return [];
    const nextIdx = stars.findIndex((s) => !captured.has(s));
    return nextIdx === -1 ? [] : [stars[nextIdx]];
  }, [phase, stars, captured]);

  const introArrows: Arrow[] = useMemo(() => {
    if (phase !== "intro" || !lesson || !lesson.introArrows) return [];
    return lesson.introArrows.map((a: any) => ({ ...a, color: "hsl(var(--primary))" }));
  }, [phase, lesson]);

  const handleContinue = () => {
    if (phase === "intro") {
      setPhase("play");
      setCanAdvance(false);
    }
  };

  const tryMove = (from: string, to: string) => {
    if (phase !== "play" || !piece) return;
    if (from !== piece.square || from === to) return;
    const targetExtra = extras.find((e) => e.square === to);
    const wouldCapture = !!targetExtra || stars.includes(to);

    if (typeof isLegalMove === "function" && !isLegalMove(piece.type, from, to, wouldCapture)) return;

    setPiece((p) => (p ? { ...p, square: to } : null));
    if (targetExtra) setExtras((es) => es.filter((e) => e !== targetExtra));
    setLastMove({ from, to });

    if (stars.includes(to)) {
      const next = new Set(captured);
      next.add(to);
      setCaptured(next);

      // Trigger completion phase immediately once all sequence stars are captured
      if (stars.every((s) => next.has(s))) {
        setPhase("done");
      }
    }
  };

  const handleSquare = (sq: string) => {
    if (phase !== "play" || !piece) return;
    if (!selected) {
      if (piece.square === sq) setSelected(sq);
      return;
    }
    if (sq === selected) return;
    tryMove(selected, sq);
    setSelected(null);
  };

  const legalSquares = useMemo(() => {
    if (phase !== "play" || !selected || !piece || selected !== piece.square) return [];
    if (typeof reachableSquares !== "function" || typeof isLegalMove !== "function") return [];
    return reachableSquares(piece.type, piece.square).filter((to) => {
      const targetExtra = extras.find((e) => e.square === to);
      const wouldCapture = !!targetExtra || stars.includes(to);
      return isLegalMove(piece.type, piece.square, to, wouldCapture);
    });
  }, [phase, selected, piece, extras, stars]);

  if (loading) {
    return <div className="text-sm py-12 text-center opacity-60">Synchronizing lessons...</div>;
  }

  // ── VIEW 1: Pick Category Level ──
  if (!category) {
    if (allLevels.length === 0) return <EmptyState uiLang={i18nLang} kind="groups" />;

    return (
      <div className={GRID_CLASS}>
        {allLevels.map((lvl, idx) => {
          const isUnlocked = idx === 0 || completedLessons.size > 0;
          const rawName = lvl.name[i18nLang] ?? lvl.name.English ?? lvl.id;
          const displayName = cleanDisplayName(rawName);

          return (
            <Button
              key={lvl.id}
              disabled={!isUnlocked}
              onClick={() => isUnlocked && navigate(`/Chess/Lesson/${lvl.id}`)}
              className={CARD_CLASS}
            >
              <span className="font-semibold">{displayName}</span>
              {!isUnlocked && <Lock className="h-4 w-4 ml-1.5 shrink-0 opacity-70" />}
            </Button>
          );
        })}
      </div>
    );
  }

  // ── VIEW 2: Pick Subcategory ──
  if (!subcategory) {
    if (!currentLvl) return <div className="px-4 text-sm py-6 text-center opacity-60">{t("notFound")}</div>;
    if (!currentLvl.groups || currentLvl.groups.length === 0) return <EmptyState uiLang={i18nLang} kind="groups" />;

    return (
      <div className={GRID_CLASS}>
        {currentLvl.groups.map((g: any, idx: number) => {
          const isUnlocked = idx === 0 || completedLessons.size > 0;
          const rawName = g.name[i18nLang] ?? g.name.English ?? g.id;
          const displayName = cleanDisplayName(rawName);

          return (
            <Button
              key={g.id}
              disabled={!isUnlocked}
              onClick={() => isUnlocked && navigate(`/Chess/Lesson/${category}/${g.id}`)}
              className={CARD_CLASS}
            >
              <span className="font-semibold">{displayName}</span>
              {!isUnlocked && <Lock className="h-4 w-4 ml-1.5 shrink-0 opacity-70" />}
            </Button>
          );
        })}
      </div>
    );
  }

  // ── VIEW 3: Pick Lesson ──
  if (!lessonId) {
    if (!currentGrp) return <div className="px-4 text-sm py-6 text-center opacity-60">{t("notFound")}</div>;
    if (!currentGrp.lessons || currentGrp.lessons.length === 0) return <EmptyState uiLang={i18nLang} kind="lessons" />;

    return (
      <div className={GRID_CLASS}>
        {currentGrp.lessons.map((ls: any, idx: number) => {
          const prevLesson = currentGrp.lessons[idx - 1];
          // Unlock rule: First lesson is unlocked; otherwise previous lesson must be completed
          const isUnlocked = idx === 0 || (prevLesson && completedLessons.has(prevLesson.id));
          const rawName = ls.name[i18nLang] ?? ls.name.English ?? ls.id;
          const displayName = cleanDisplayName(rawName);

          return (
            <Button
              key={ls.id}
              disabled={!isUnlocked}
              onClick={() => isUnlocked && navigate(`/Chess/Lesson/${category}/${subcategory}/${ls.id}`)}
              className={CARD_CLASS}
            >
              <span className="font-semibold">{displayName}</span>
              {!isUnlocked && <Lock className="h-4 w-4 ml-1.5 shrink-0 opacity-70" />}
            </Button>
          );
        })}
      </div>
    );
  }

  // ── VIEW 4: Interactive Lesson Engine ──
  if (!lesson || !piece) {
    return (
      <div className="px-4 text-center p-8 space-y-3">
        <p className="text-sm text-destructive">Could not load lesson.</p>
      </div>
    );
  }

  const continueLabel = uiLang === "nl" ? "Doorgaan" : uiLang === "ar" ? "متابعة" : "Continue";
  const totalStars = stars.length;
  const doneCount = captured.size;
  const allPieces = [piece, ...extras];

  return (
    <div className="px-4 w-full">
      <div className="grid gap-3 md:grid-cols-[1fr_320px] md:items-stretch max-w-5xl mx-auto">
        <div className="w-full mx-auto md:mx-0 flex justify-center">
          <Container className="p-2 rounded-[20px] w-full max-w-[min(100%,calc(100svh-22rem))] md:max-w-none">
            <div className="relative">
              <Chessboard
                pieces={allPieces}
                stars={activeStars}
                orientation={lesson.orientation ?? "white"}
                selected={selected}
                legalSquares={legalSquares}
                lastMove={lastMove}
                arrows={introArrows}
                arrowLengthScale={phase === "intro" ? pulse : 1}
                onSquareClick={handleSquare}
                onPieceDrop={(from, to) => tryMove(from, to)}
                onDragBegin={(sq) => {
                  if (piece && sq === piece.square) setSelected(sq);
                }}
                onClearSelection={() => setSelected(null)}
                interactiveColor={piece.color as PieceColor}
                inputMode={settings.inputMode}
                animate={settings.animatePieces}
                animationMs={settings.animationSpeed}
              />
            </div>
          </Container>
        </div>

        <div className="flex flex-col gap-3 md:justify-between">
          <Container className="p-3 text-sm leading-relaxed min-h-[88px]">
            {resolveLessonText(lesson.intro, uiLang)}
          </Container>

          <div className="flex items-center gap-2 justify-center flex-wrap">
            {phase === "play" && (
              <span className="text-xs px-3 py-2 rounded-full border border-border bg-background font-mono flex items-center gap-1.5 whitespace-nowrap">
                <Star className="h-3.5 w-3.5 fill-current" />
                {doneCount}/{totalStars}
              </span>
            )}
            {phase === "intro" && (
              <Button
                onClick={handleContinue}
                disabled={!canAdvance}
                aria-label={continueLabel}
                title={continueLabel}
                className="flex-1 max-w-[200px] gap-2"
              >
                <span className="font-semibold">{continueLabel}</span>
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}