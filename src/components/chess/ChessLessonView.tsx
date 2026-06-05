import { useMemo, useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chess/Chessboard";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { TitleBar } from "@/components/ui/title-bar";
import { ChevronRight, RotateCcw, Lightbulb } from "lucide-react";
import type { ChessLesson } from "@/data/chessData";
import { cName } from "@/data/chessData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

interface Props { lesson: ChessLesson; }

/** Look up the expected from/to for the next SAN move without mutating game. */
function parseExpected(fen: string, san: string): { from: string; to: string } | null {
  try {
    const g = new Chess(fen);
    const mv = g.move(san);
    if (!mv) return null;
    return { from: mv.from, to: mv.to };
  } catch {
    return null;
  }
}

export function ChessLessonView({ lesson }: Props) {
  const { uiLang, t } = useCourseLanguage();

  const initialFen = useMemo(
    () => (lesson.startFen ? new Chess(lesson.startFen).fen() : new Chess().fen()),
    [lesson.id, lesson.startFen],
  );

  const [fen, setFen] = useState(initialFen);
  const [stepIdx, setStepIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [legal, setLegal] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setFen(initialFen);
    setStepIdx(0);
    setSelected(null);
    setLegal([]);
    setFeedback(null);
    setShowHint(false);
  }, [initialFen]);

  const done = stepIdx >= lesson.steps.length;
  const next = !done ? lesson.steps[stepIdx] : null;
  const expected = next ? parseExpected(fen, next.san) : null;
  const lastExplain = stepIdx > 0 ? lesson.steps[stepIdx - 1].explain : lesson.intro;

  const applyExpected = () => {
    if (!next) return;
    const g = new Chess(fen);
    try {
      g.move(next.san);
      setFen(g.fen());
      setStepIdx(i => i + 1);
      setSelected(null);
      setLegal([]);
      setFeedback(null);
      setShowHint(false);
    } catch {
      setStepIdx(i => i + 1);
    }
  };

  const handleSquare = (sq: string) => {
    if (done || !expected) return;
    setFeedback(null);

    // Second click: try to complete the move
    if (selected) {
      if (selected === expected.from && sq === expected.to) {
        applyExpected();
        return;
      }
      // Reselect a new piece if clicked own piece, else clear.
      const g = new Chess(fen);
      const p = g.get(sq as any);
      if (p && p.color === g.turn()) {
        setSelected(sq);
        setLegal(g.moves({ square: sq as any, verbose: true }).map((m: any) => m.to));
      } else {
        setSelected(null);
        setLegal([]);
        setFeedback(t("tryAgain") || "Try again");
      }
      return;
    }

    // First click: must be a piece of the side to move
    const g = new Chess(fen);
    const p = g.get(sq as any);
    if (!p || p.color !== g.turn()) return;
    setSelected(sq);
    setLegal(g.moves({ square: sq as any, verbose: true }).map((m: any) => m.to));
  };

  const restart = () => {
    setFen(initialFen);
    setStepIdx(0);
    setSelected(null);
    setLegal([]);
    setFeedback(null);
    setShowHint(false);
  };

  const highlight = showHint && expected ? [expected.from, expected.to] : [];

  return (
    <div className="px-4 max-w-md mx-auto space-y-3">
      <TitleBar className="font-semibold">{cName(lesson.name, uiLang)}</TitleBar>

      <Container className="p-2 rounded-[20px]">
        <Chessboard
          fen={fen}
          orientation={lesson.orientation ?? "white"}
          highlight={highlight}
          selected={selected}
          legal={legal}
          onSquareClick={handleSquare}
        />
      </Container>

      {lastExplain && (
        <Container className="p-3 text-sm">
          {cName(lastExplain, uiLang)}
        </Container>
      )}

      {feedback && (
        <Container className="p-3 text-sm border-destructive">
          {feedback}
        </Container>
      )}

      <Container className="p-3 text-xs flex items-center justify-between">
        <span className="opacity-70">
          {Math.min(stepIdx, lesson.steps.length)} / {lesson.steps.length}
        </span>
        {done && <span className="font-semibold">{t("finished") || "Finished"}</span>}
      </Container>

      <div className="flex gap-2">
        <Button onClick={restart} className="flex-1">
          <RotateCcw className="h-4 w-4 mr-2" />
          {t("restart") || "Restart"}
        </Button>
        <Button onClick={() => setShowHint(s => !s)} className="flex-1" disabled={done} active={showHint}>
          <Lightbulb className="h-4 w-4 mr-2" />
          {t("hint") || "Hint"}
        </Button>
        <Button onClick={applyExpected} className="flex-1" disabled={done}>
          <ChevronRight className="h-4 w-4 mr-2" />
          {t("skip") || "Skip"}
        </Button>
      </div>
    </div>
  );
}
