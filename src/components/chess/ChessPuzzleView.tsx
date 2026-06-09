import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chess/Chessboard";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Check, RotateCcw, X } from "lucide-react";
import { fenToPieces } from "./chessHelpers";
import type { Puzzle } from "@/data/chessPuzzles";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useChessSettings } from "@/lib/chessSettings";

interface Props { puzzle: Puzzle; onSolved?: () => void }

export function ChessPuzzleView({ puzzle, onSolved }: Props) {
  const { uiLang } = useCourseLanguage();
  const [settings] = useChessSettings();
  const [game, setGame] = useState(() => new Chess(puzzle.fen));
  const [step, setStep] = useState(0); // index into solution
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"ok" | "bad" | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    setGame(new Chess(puzzle.fen));
    setStep(0); setSelected(null); setFeedback(null);
  }, [puzzle.id]);

  const pieces = useMemo(() => fenToPieces(game), [game, game.fen()]);
  const solved = step >= puzzle.solution.length;

  const expectIdx = step % 2 === 0 ? step : step; // we tick step on both sides

  const handleSquare = (sq: string) => {
    if (solved) return;
    if (game.turn() !== puzzle.userColor) return;
    if (!selected) {
      const p = game.get(sq as any);
      if (p && p.color === puzzle.userColor) setSelected(sq);
      return;
    }
    if (sq === selected) { setSelected(null); return; }
    const attempt = `${selected}${sq}`;
    const expected = puzzle.solution[step];
    if (expected && attempt === expected.slice(0, 4)) {
      try { game.move({ from: selected, to: sq, promotion: "q" }); } catch {}
      setSelected(null);
      setFeedback("ok");
      const nextStep = step + 1;
      force(n => n + 1);
      // play opponent reply if scripted
      setTimeout(() => {
        const reply = puzzle.solution[nextStep];
        if (reply) {
          try { game.move({ from: reply.slice(0, 2), to: reply.slice(2, 4), promotion: reply[4] }); } catch {}
          setStep(nextStep + 1);
          force(n => n + 1);
        } else {
          setStep(nextStep);
          if (nextStep >= puzzle.solution.length) onSolved?.();
        }
        setTimeout(() => setFeedback(null), 600);
      }, 350);
    } else {
      setFeedback("bad");
      setSelected(null);
      setTimeout(() => setFeedback(null), 800);
    }
  };

  const reset = () => {
    setGame(new Chess(puzzle.fen));
    setStep(0); setSelected(null); setFeedback(null);
  };

  return (
    <div className="px-4 w-full">
      <div className="grid gap-3 md:grid-cols-[1fr_320px] max-w-5xl mx-auto">
        <div className="w-full mx-auto md:mx-0 flex justify-center">
          <Container className="p-2 rounded-[20px] w-full max-w-[min(100%,calc(100svh-22rem))] md:max-w-none">
            <div className="relative">
              <Chessboard
                pieces={pieces}
                orientation={puzzle.userColor === "w" ? "white" : "black"}
                selected={selected}
                onSquareClick={handleSquare}
                animate={settings.animatePieces}
                animationMs={settings.animationSpeed}
              />
              {feedback && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`rounded-full p-4 ${feedback === "ok" ? "bg-green-500/80" : "bg-red-500/80"} animate-scale-in`}>
                    {feedback === "ok" ? <Check className="h-10 w-10 text-white" /> : <X className="h-10 w-10 text-white" />}
                  </div>
                </div>
              )}
            </div>
          </Container>
        </div>
        <div className="flex flex-col gap-3">
          <Container className="p-3 text-sm">
            <div className="font-semibold mb-1">{puzzle.theme[uiLang] ?? puzzle.theme.en}</div>
            <div className="opacity-70">
              {solved
                ? (uiLang === "nl" ? "Opgelost!" : uiLang === "ar" ? "تم الحل!" : "Solved!")
                : (uiLang === "nl"
                    ? `${puzzle.userColor === "w" ? "Wit" : "Zwart"} aan zet`
                    : uiLang === "ar"
                      ? (puzzle.userColor === "w" ? "الأبيض يلعب" : "الأسود يلعب")
                      : `${puzzle.userColor === "w" ? "White" : "Black"} to move`)}
            </div>
          </Container>
          <Button onClick={reset} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {uiLang === "nl" ? "Opnieuw" : uiLang === "ar" ? "إعادة" : "Reset"}
          </Button>
        </div>
      </div>
    </div>
  );
}
