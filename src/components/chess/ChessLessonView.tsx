import { useEffect, useMemo, useRef, useState } from "react";
import { Chessboard } from "@/components/chess/Chessboard";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ChevronRight, Star, Trophy } from "lucide-react";
import type { ChessLesson, PlacedPiece, Arrow } from "@/data/chessData";
import { cName, isLegalMove, reachableSquares, type PieceColor } from "@/data/chessData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useChessSettings } from "@/lib/chessSettings";

interface Props { lesson: ChessLesson; onNext?: () => void }
type Phase = "intro" | "play" | "done";

export function ChessLessonView({ lesson, onNext }: Props) {
  const { uiLang } = useCourseLanguage();
  const [settings] = useChessSettings();

  const [phase, setPhase] = useState<Phase>("intro");
  const [piece, setPiece] = useState<PlacedPiece>(() => ({ ...lesson.piece }));
  const [extras, setExtras] = useState<PlacedPiece[]>(() => (lesson.extras ?? []).map(p => ({ ...p })));
  const [stars, setStars] = useState<string[]>([]);
  const [captured, setCaptured] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [canAdvance, setCanAdvance] = useState(false);
  const [pulse, setPulse] = useState(1);


  // Reset on lesson switch
  useEffect(() => {
    setPhase("intro");
    setPiece({ ...lesson.piece });
    setExtras((lesson.extras ?? []).map(p => ({ ...p })));
    setCaptured(new Set());
    setSelected(null);
    setLastMove(null);
    setCanAdvance(false);


    // Compute stars now so they are stable for the lesson session.
    if (lesson.randomStars && lesson.randomStars > 0) {
      const reach = reachableSquares(lesson.piece.type, lesson.piece.square)
        .filter(s => s !== lesson.piece.square);
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
  }, [lesson.id]);

  // Pulse intro arrows
  useEffect(() => {
    if (phase !== "intro") return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const x = ((t - start) % 1200) / 1200;
      setPulse(0.45 + 0.55 * (0.5 - 0.5 * Math.cos(x * Math.PI * 2)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, lesson.id]);

  // Narration
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
      } catch { setCanAdvance(true); }
    } else {
      const tm = window.setTimeout(() => setCanAdvance(true), 600);
      return () => window.clearTimeout(tm);
    }
  }, [phase, lesson.id, uiLang, settings.speakNarration]);

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

  // Active stars on the board
  const activeStars = useMemo(() => {
    if (phase !== "play") return [];
    if (lesson.freeOrder) return stars.filter(s => !captured.has(s));
    const nextIdx = stars.findIndex(s => !captured.has(s));
    return nextIdx === -1 ? [] : [stars[nextIdx]];
  }, [phase, stars, captured, lesson.freeOrder]);

  const introArrows: Arrow[] = useMemo(() => {
    if (phase !== "intro") return [];
    return lesson.introArrows.map(a => ({ ...a, color: "hsl(var(--primary))" }));
  }, [phase, lesson.introArrows]);

  const handleContinue = () => {
    if (phase === "intro") { setPhase("play"); setCanAdvance(false); }
    else if (phase === "done") onNext?.();
  };

  const tryMove = (from: string, to: string) => {
    if (phase !== "play") return;
    if (from !== piece.square) return;
    if (from === to) return;
    const targetExtra = extras.find(e => e.square === to);
    const wouldCapture = !!targetExtra || stars.includes(to);

    // Castling shortcut: King e1 -> g1 or c1 when rook present.
    if (piece.type === "K" && from === "e1" && (to === "g1" || to === "c1")) {
      const rookFrom = to === "g1" ? "h1" : "a1";
      const rookTo = to === "g1" ? "f1" : "d1";
      const rook = extras.find(e => e.square === rookFrom && e.type === "R");
      if (rook) {
        setPiece(p => ({ ...p, square: to }));
        setExtras(es => es.map(e => e === rook ? { ...e, square: rookTo } : e));
        setLastMove({ from, to });
        if (stars.includes(to)) {
          const next = new Set(captured); next.add(to); setCaptured(next);
          if (stars.every(s => next.has(s))) window.setTimeout(() => setPhase("done"), 350);
        }
        return;
      }
    }

    if (!isLegalMove(piece.type, from, to, wouldCapture)) return;
    setPiece(p => ({ ...p, square: to }));
    if (targetExtra) setExtras(es => es.filter(e => e !== targetExtra));
    setLastMove({ from, to });

    if (stars.includes(to)) {
      const next = new Set(captured); next.add(to);
      setCaptured(next);
      if (stars.every(s => next.has(s))) window.setTimeout(() => setPhase("done"), 350);
    }
  };

  const handleSquare = (sq: string) => {
    if (phase !== "play") return;
    if (!selected) { if (piece.square === sq) setSelected(sq); return; }
    if (sq === selected) return; // persists; right-click clears
    tryMove(selected, sq);
    setSelected(null);
  };

  // Legal squares for highlighting (dots).
  const legalSquares = useMemo(() => {
    if (phase !== "play" || !selected || selected !== piece.square) return [];
    return reachableSquares(piece.type, piece.square).filter(to => {
      const targetExtra = extras.find(e => e.square === to);
      const wouldCapture = !!targetExtra || stars.includes(to);
      return isLegalMove(piece.type, piece.square, to, wouldCapture);
    });
  }, [phase, selected, piece, extras, stars]);


  const continueLabel = phase === "intro"
    ? (uiLang === "nl" ? "Doorgaan" : uiLang === "ar" ? "متابعة" : "Continue")
    : phase === "done"
      ? (onNext ? (uiLang === "nl" ? "Volgende les" : uiLang === "ar" ? "الدرس التالي" : "Next lesson")
                : (uiLang === "nl" ? "Klaar" : uiLang === "ar" ? "تم" : "Done"))
      : "";

  const totalStars = stars.length;
  const doneCount = captured.size;

  const allPieces = useMemo(() => [piece, ...extras], [piece, extras]);

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
                onDragBegin={(sq) => { if (sq === piece.square) setSelected(sq); }}
                onClearSelection={() => setSelected(null)}
                interactiveColor={piece.color as PieceColor}
                inputMode={settings.inputMode}
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
                {doneCount}/{totalStars}
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
