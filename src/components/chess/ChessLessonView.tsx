import { useEffect, useMemo, useRef, useState } from "react";
import { Chessboard } from "@/components/chess/Chessboard";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ChevronRight, Lightbulb, Volume2 } from "lucide-react";
import type { ChessLesson, PlacedPiece, Arrow } from "@/data/chessData";
import { cName } from "@/data/chessData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useChessSettings } from "@/lib/chessSettings";
import { speak } from "@/components/practice/speech";

interface Props { lesson: ChessLesson; }

export function ChessLessonView({ lesson }: Props) {
  const { uiLang, courseLang } = useCourseLanguage();
  const [settings] = useChessSettings();

  const [pieces, setPieces] = useState<PlacedPiece[]>(() => lesson.pieces.map(p => ({ ...p })));
  const [stars, setStars] = useState<string[]>(lesson.stars ?? []);
  const [stepIdx, setStepIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [userArrows, setUserArrows] = useState<Arrow[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [canContinue, setCanContinue] = useState(false);

  // Reset on lesson switch
  useEffect(() => {
    setPieces(lesson.pieces.map(p => ({ ...p })));
    setStars(lesson.stars ?? []);
    setStepIdx(0);
    setSelected(null);
    setUserArrows([]);
    setShowHint(false);
    setCanContinue(false);
  }, [lesson.id]);

  const step = lesson.steps[stepIdx];
  const done = !step;

  // Narration on each step entry. Reveal continue button after speech ends.
  const narrationRef = useRef<string | null>(null);
  useEffect(() => {
    if (!step) return;
    const txt = cName(step.narration, uiLang);
    narrationRef.current = txt;
    setCanContinue(false);
    if (settings.speakNarration && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(txt);
        utter.lang = uiLang === "nl" ? "nl-NL" : uiLang === "ar" ? "ar-SA" : "en-US";
        utter.rate = 0.95;
        utter.onend = () => setCanContinue(true);
        utter.onerror = () => setCanContinue(true);
        window.speechSynthesis.speak(utter);
        // Fallback in case onend never fires
        const tm = window.setTimeout(() => setCanContinue(true), Math.max(1500, txt.length * 70));
        return () => window.clearTimeout(tm);
      } catch {
        setCanContinue(true);
      }
    } else {
      // No TTS — reveal continue after a short reading delay
      const tm = window.setTimeout(() => setCanContinue(true), 600);
      return () => window.clearTimeout(tm);
    }
  }, [stepIdx, lesson.id, uiLang, settings.speakNarration]);

  const replay = () => {
    if (!narrationRef.current) return;
    speak(narrationRef.current, uiLang === "ar" ? "ar" : (uiLang as "nl" | "en"));
  };

  const lessonArrows: Arrow[] = useMemo(() => {
    if (done) return [];
    if (step.kind === "show") return step.arrows ?? [];
    return showHint ? (step.arrows ?? []) : [];
  }, [step, showHint, done]);

  const advance = () => {
    setStepIdx(i => i + 1);
    setSelected(null);
    setShowHint(false);
    setUserArrows([]);
  };

  const handleSquare = (sq: string) => {
    if (done) return;
    if (step.kind !== "capture") return;
    if (!selected) {
      if (pieces.some(p => p.square === sq)) setSelected(sq);
      return;
    }
    if (sq === selected) { setSelected(null); return; }
    if (sq !== step.target || selected !== step.piece) {
      setSelected(null);
      return;
    }
    // Apply capture
    setPieces(prev => prev.map(p => p.square === selected ? { ...p, square: sq } : p));
    setStars(prev => prev.filter(s => s !== sq));
    setSelected(null);
    setShowHint(false);
    setStepIdx(i => i + 1);
  };

  const addUserArrow = (a: Arrow) => {
    setUserArrows(prev => {
      // Toggle off if same arrow exists
      const same = prev.find(x => x.from === a.from && x.to === a.to);
      if (same) return prev.filter(x => x !== same);
      return [...prev, { ...a, color: "hsl(var(--primary))" }];
    });
  };

  const isCaptureStep = step?.kind === "capture";
  const needsBoardAction = isCaptureStep && stars.includes(step.target);
  const continueDisabled = done || needsBoardAction || !canContinue;

  const stepCounter = `${Math.min(stepIdx + (done ? 0 : 1), lesson.steps.length)} / ${lesson.steps.length}`;
  const narrationText = step ? cName(step.narration, uiLang) : "";

  // ── Layout: board + side panel fit within viewport on mobile ──
  // Board is constrained so the whole lesson UI fits without scrolling.
  return (
    <div className="px-4 w-full">
      <div className="grid gap-3 md:grid-cols-[1fr_320px] md:items-stretch max-w-5xl mx-auto">
        {/* Board — sized to fit viewport: width-capped by side panel + height-capped */}
        <div className="w-full mx-auto md:mx-0 flex justify-center">
          <Container className="p-2 rounded-[20px] w-full max-w-[min(100%,calc(100svh-22rem))] md:max-w-none">
            <Chessboard
              pieces={pieces}
              stars={stars}
              orientation={lesson.orientation ?? "white"}
              selected={selected}
              arrows={[...lessonArrows, ...userArrows]}
              onSquareClick={handleSquare}
              onArrowDrawn={addUserArrow}
              animate={settings.animatePieces}
              animationMs={settings.animationSpeed}
            />
          </Container>
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-3 md:justify-between">
          <Container className="p-3 text-sm leading-relaxed">
            {narrationText || (uiLang === "nl" ? "Klaar!" : "Finished!")}
          </Container>

          <div className="flex items-center gap-2 justify-center flex-wrap">
            <span className="text-xs px-3 py-2 rounded-full border-2 border-border bg-background font-mono whitespace-nowrap">
              {stepCounter}
            </span>
            {settings.speakNarration && (
              <Button onClick={replay} aria-label="Replay narration" size="icon">
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
            {settings.showHints && isCaptureStep && (
              <Button onClick={() => setShowHint(s => !s)} active={showHint} aria-label="Hint">
                <Lightbulb className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={advance}
              disabled={continueDisabled}
              className="flex-1"
              aria-label="Continue"
            >
              <ChevronRight className="h-4 w-4 mr-1" />
              {uiLang === "nl" ? "Doorgaan" : uiLang === "ar" ? "متابعة" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
