import { useEffect, useMemo, useRef, useState } from "react";
import { Chessboard } from "@/components/chess/Chessboard";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ChevronRight, Star, Trophy } from "lucide-react";
import type { ChessLesson, PlacedPiece, Arrow } from "@/data/chessData";
import { cName, isLegalMove } from "@/data/chessData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useChessSettings } from "@/lib/chessSettings";

interface Props {
  lesson: ChessLesson;
  onNext?: () => void;
}

type Phase = "intro" | "play" | "done";

export function ChessLessonView({ lesson, onNext }: Props) {
  const { uiLang } = useCourseLanguage();
  const [settings] = useChessSettings();

  const [phase, setPhase] = useState<Phase>("intro");
  const [piece, setPiece] = useState<PlacedPiece>(() => ({ ...lesson.piece }));
  const [starIdx, setStarIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [canAdvance, setCanAdvance] = useState(false);
  // Arrow-length pulse multiplier (0.45..1.0)
  const [pulse, setPulse] = useState(1);

  // Reset on lesson switch
  useEffect(() => {
    setPhase("intro");
    setPiece({ ...lesson.piece });
    setStarIdx(0);
    setSelected(null);
    setCanAdvance(false);
  }, [lesson.id]);

  // Pulse animation for intro arrows (length only)
  useEffect(() => {
    if (phase !== "intro") return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      // 1.2s full cycle, smooth in/out between 0.45 and 1.0
      const x = ((t - start) % 1200) / 1200;
      const s = 0.45 + 0.55 * (0.5 - 0.5 * Math.cos(x * Math.PI * 2));
      setPulse(s);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, lesson.id]);

  // Intro narration — auto play once. Continue unlocks when narration ends.
  useEffect(() => {
    if (phase !== "intro") return;
    setCanAdvance(false);
    const txt = cName(lesson.intro, uiLang);
    if (settings.speakNarration && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(txt);
        u.lang = uiLang === "nl" ? "nl-NL" : uiLang === "ar" ? "ar-SA" : "en-US";
        u.rate = 0.95;
        u.onend = () => setCanAdvance(true);
        u.onerror = () => setCanAdvance(true);
        window.speechSynthesis.speak(u);
        const tm = window.setTimeout(() => setCanAdvance(true), Math.max(1500, txt.length * 70));
        return () => window.clearTimeout(tm);
      } catch {
        setCanAdvance(true);
      }
    } else {
      const tm = window.setTimeout(() => setCanAdvance(true), 600);
      return () => window.clearTimeout(tm);
    }
  }, [phase, lesson.id, uiLang, settings.speakNarration]);

  // Done narration
  useEffect(() => {
    if (phase !== "done") return;
    setCanAdvance(true);
    const txt = lesson.done ? cName(lesson.done, uiLang) : "";
    if (txt && settings.speakNarration && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(txt);
        u.lang = uiLang === "nl" ? "nl-NL" : uiLang === "ar" ? "ar-SA" : "en-US";
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
      } catch { /* noop */ }
    }
  }, [phase, lesson.id, uiLang, settings.speakNarration, lesson.done]);

  // Stars currently on the board: only the active one during play.
  const activeStars = useMemo(() => {
    if (phase !== "play") return [];
    return starIdx < lesson.stars.length ? [lesson.stars[starIdx]] : [];
  }, [phase, starIdx, lesson.stars]);

  // Pulsing intro arrows: shorten the line toward the source by `pulse`.
  const introArrows: Arrow[] = useMemo(() => {
    if (phase !== "intro") return [];
    return lesson.introArrows.map(a => ({ ...a, color: "hsl(var(--primary))" }));
  }, [phase, lesson.introArrows]);

  const handleContinue = () => {
    if (phase === "intro") {
      setPhase("play");
      setCanAdvance(false);
    } else if (phase === "done") {
      onNext?.();
    }
  };

  const handleSquare = (sq: string) => {
    if (phase !== "play") return;
    if (!selected) {
      if (piece.square === sq) setSelected(sq);
      return;
    }
    if (sq === selected) { setSelected(null); return; }
    // Only the active piece is on the board, so we just check piece-type legality.
    if (!isLegalMove(piece.type, selected, sq)) {
      setSelected(null);
      return;
    }
    const captured = sq === lesson.stars[starIdx];
    setPiece(p => ({ ...p, square: sq }));
    setSelected(null);
    if (captured) {
      const next = starIdx + 1;
      if (next >= lesson.stars.length) {
        // Slight delay so the move animation completes before the overlay.
        window.setTimeout(() => setPhase("done"), 350);
      } else {
        setStarIdx(next);
      }
    }
  };

  const continueLabel = phase === "intro"
    ? (uiLang === "nl" ? "Doorgaan" : uiLang === "ar" ? "متابعة" : "Continue")
    : phase === "done"
      ? (onNext
          ? (uiLang === "nl" ? "Volgende les" : uiLang === "ar" ? "الدرس التالي" : "Next lesson")
          : (uiLang === "nl" ? "Klaar" : uiLang === "ar" ? "تم" : "Done"))
      : "";

  return (
    <div className="px-4 w-full">
      <div className="grid gap-3 md:grid-cols-[1fr_320px] md:items-stretch max-w-5xl mx-auto">
        {/* Board */}
        <div className="w-full mx-auto md:mx-0 flex justify-center">
          <Container className="p-2 rounded-[20px] w-full max-w-[min(100%,calc(100svh-22rem))] md:max-w-none">
            <div className="relative">
              <Chessboard
                pieces={[piece]}
                stars={activeStars}
                orientation={lesson.orientation ?? "white"}
                selected={selected}
                arrows={introArrows}
                arrowLengthScale={phase === "intro" ? pulse : 1}
                onSquareClick={handleSquare}
                animate={settings.animatePieces}
                animationMs={settings.animationSpeed}
              />
              {phase === "done" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-background/95 border-2 border-border rounded-[20px] px-6 py-4 flex flex-col items-center gap-2 animate-scale-in shadow-2xl">
                    <Trophy className="h-10 w-10" />
                    <span className="font-semibold text-lg">
                      {uiLang === "nl" ? "Voltooid!" : uiLang === "ar" ? "اكتمل!" : "Completed!"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Container>
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-3 md:justify-between">
          <Container className="p-3 text-sm leading-relaxed min-h-[88px]">
            {phase === "done"
              ? (lesson.done ? cName(lesson.done, uiLang) : "")
              : cName(lesson.intro, uiLang)}
          </Container>

          <div className="flex items-center gap-2 justify-center flex-wrap">
            {phase === "play" && (
              <span className="text-xs px-3 py-2 rounded-full border-2 border-border bg-background font-mono flex items-center gap-1.5 whitespace-nowrap">
                <Star className="h-3.5 w-3.5 fill-current" />
                {starIdx}/{lesson.stars.length}
              </span>
            )}
            {phase !== "play" && (
              <Button
                onClick={handleContinue}
                disabled={!canAdvance || (phase === "done" && !onNext)}
                size="icon"
                aria-label={continueLabel}
                title={continueLabel}
                className="flex-1 max-w-[160px]"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
