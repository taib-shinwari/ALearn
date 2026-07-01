import { useEffect, useMemo, useState } from "react";
import { Chessboard } from "Client/Component/Chess/Chessboard";
import { Button } from "Client/Component/UI/button";
import { Container } from "Client/Component/UI/container";
import { ChevronRight, Star, Trophy } from "lucide-react";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { useChessSettings } from "Client/Library/chessSettings";
import {
  isLegalMove,
  reachableSquares,
  cName,
  getChessLevel,
  resolveLessonText,
  type PieceColor,
  type PieceType,
  type PlacedPiece,
  type Arrow,
} from "Server/API/Chess";

interface Props {
  category: string;
  subcategory: string;
  lessonId: string;
  onNext?: () => void;
}

type Phase = "intro" | "play" | "done";

export function ChessLessonView({ category, subcategory, lessonId, onNext }: Props) {
  const { uiLang } = useCourseLanguage();
  const [settings] = useChessSettings();

  // Resolve lesson synchronously from the in-memory registry
  const lesson = useMemo(() => {
    const level = getChessLevel(category);
    const group = level?.groups.find(g => g.id === subcategory);
    const lessonEntry = group?.lessons.find(l => l.id === lessonId);
    const raw = lessonEntry?.steps[0];
    if (!raw) return null;
    if (!Array.isArray(raw) && typeof raw === "object" && (raw as any).piece) return raw;
    if (Array.isArray(raw)) {
      const [pieceSpec, starsArr, introKey] = raw as [string, string[], string];
      const [square, type] = String(pieceSpec).split("-");
      const stars = (starsArr ?? []).flatMap((s: string) => String(s).split(","))
        .map((s: string) => s.trim()).filter(Boolean);
      return {
        piece: { square, type: type as PieceType, color: "w" as PieceColor },
        extras: [] as PlacedPiece[],
        stars,
        intro: introKey,
        orientation: "white" as const,
      };
    }
    return null;
  }, [category, subcategory, lessonId]);

  const [phase, setPhase] = useState<Phase>("intro");
  const [piece, setPiece] = useState<PlacedPiece | null>(null);
  const [extras, setExtras] = useState<PlacedPiece[]>([]);
  const [stars, setStars] = useState<string[]>([]);
  const [captured, setCaptured] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [canAdvance, setCanAdvance] = useState(false);
  const [pulse, setPulse] = useState(1);

  // ── Initialize or reset game state when lesson resolves ──────────────────────
  useEffect(() => {
    if (!lesson) return;

    setPhase("intro");
    setPiece({ ...lesson.piece });
    setExtras((lesson.extras ?? []).map((p: any) => ({ ...p })));
    setCaptured(new Set());
    setSelected(null);
    setLastMove(null);
    setCanAdvance(false);

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
  }, [lesson]);

  // Pulse intro arrows
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

  // Narration voice engine
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
        const tm = window.setTimeout(() => setCanAdvance(true), Math.max(1500, txt.length * 70));
        return () => window.clearTimeout(tm);
      } catch { setCanAdvance(true); }
    } else {
      const tm = window.setTimeout(() => setCanAdvance(true), 600);
      return () => window.clearTimeout(tm);
    }
  }, [phase, lesson, uiLang, settings.speakNarration]);

  useEffect(() => {
    if (phase !== "done" || !lesson) return;
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
  }, [phase, lesson, uiLang, settings.speakNarration]);

  // Active stars (only show the next uncaptured one)
  const activeStars = useMemo(() => {
    if (phase !== "play") return [];
    const nextIdx = stars.findIndex(s => !captured.has(s));
    return nextIdx === -1 ? [] : [stars[nextIdx]];
  }, [phase, stars, captured]);

  const introArrows: Arrow[] = useMemo(() => {
    if (phase !== "intro" || !lesson || !lesson.introArrows) return [];
    return lesson.introArrows.map((a: any) => ({ ...a, color: "hsl(var(--primary))" }));
  }, [phase, lesson]);

  const handleContinue = () => {
    if (phase === "intro") { setPhase("play"); setCanAdvance(false); }
    else if (phase === "done") onNext?.();
  };

  const tryMove = (from: string, to: string) => {
    if (phase !== "play" || !piece) return;
    if (from !== piece.square) return;
    if (from === to) return;
    const targetExtra = extras.find(e => e.square === to);
    const wouldCapture = !!targetExtra || stars.includes(to);

    // Castling mechanics edge case
    if (piece.type === "K" && from === "e1" && (to === "g1" || to === "c1")) {
      const rookFrom = to === "g1" ? "h1" : "a1";
      const rookTo   = to === "g1" ? "f1" : "d1";
      const rook = extras.find(e => e.square === rookFrom && e.type === "R");
      if (rook) {
        setPiece(p => p ? { ...p, square: to } : null);
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
    setPiece(p => p ? { ...p, square: to } : null);
    if (targetExtra) setExtras(es => es.filter(e => e !== targetExtra));
    setLastMove({ from, to });

    if (stars.includes(to)) {
      const next = new Set(captured); next.add(to);
      setCaptured(next);
      if (stars.every(s => next.has(s))) window.setTimeout(() => setPhase("done"), 350);
    }
  };

  const handleSquare = (sq: string) => {
    if (phase !== "play" || !piece) return;
    if (!selected) { if (piece.square === sq) setSelected(sq); return; }
    if (sq === selected) return;
    tryMove(selected, sq);
    setSelected(null);
  };

  const legalSquares = useMemo(() => {
    if (phase !== "play" || !selected || !piece || selected !== piece.square) return [];
    return reachableSquares(piece.type, piece.square).filter(to => {
      const targetExtra = extras.find(e => e.square === to);
      const wouldCapture = !!targetExtra || stars.includes(to);
      return isLegalMove(piece.type, piece.square, to, wouldCapture);
    });
  }, [phase, selected, piece, extras, stars]);

  if (!lesson || !piece) {
    return (
      <div className="px-4 text-center p-8 space-y-3">
        <p className="text-sm text-destructive">Could not load lesson.</p>
      </div>
    );
  }

  const continueLabel = phase === "intro"
    ? (uiLang === "nl" ? "Doorgaan" : uiLang === "ar" ? "متابعة" : "Continue")
    : phase === "done"
      ? (onNext
          ? (uiLang === "nl" ? "Volgende les" : uiLang === "ar" ? "الدرس التالي" : "Next lesson")
          : (uiLang === "nl" ? "Klaar" : uiLang === "ar" ? "تم" : "Done"))
      : "";

  const totalStars = stars.length;
  const doneCount  = captured.size;
  const allPieces  = [piece, ...extras];

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
                onDragBegin={(sq) => { if (piece && sq === piece.square) setSelected(sq); }}
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