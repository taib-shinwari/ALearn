import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chess/Chessboard";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { TitleBar } from "@/components/ui/title-bar";
import { ChevronRight, RotateCcw } from "lucide-react";
import type { ChessLesson } from "@/data/chessData";
import { cName } from "@/data/chessData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

interface Props { lesson: ChessLesson; }

export function ChessLessonView({ lesson }: Props) {
  const { uiLang, t } = useCourseLanguage();

  const game = useMemo(() => {
    const c = lesson.startFen ? new Chess(lesson.startFen) : new Chess();
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const [fen, setFen] = useState(game.fen());
  const [stepIdx, setStepIdx] = useState(0);
  const done = stepIdx >= lesson.steps.length;
  const next = !done ? lesson.steps[stepIdx] : null;
  const lastExplain = stepIdx > 0 ? lesson.steps[stepIdx - 1].explain : lesson.intro;

  const advance = () => {
    if (done || !next) return;
    try {
      game.move(next.san);
      setFen(game.fen());
      setStepIdx(i => i + 1);
    } catch {
      // ignore — bad SAN in data
      setStepIdx(i => i + 1);
    }
  };

  const restart = () => {
    const c = lesson.startFen ? new Chess(lesson.startFen) : new Chess();
    // copy back into shared game ref by mutating moves
    game.load(c.fen());
    setFen(game.fen());
    setStepIdx(0);
  };

  return (
    <div className="px-4 max-w-md mx-auto space-y-3">
      <TitleBar className="font-semibold">{cName(lesson.name, uiLang)}</TitleBar>

      <Container className="p-2 rounded-[20px] overflow-hidden">
        <Chessboard fen={fen} orientation={lesson.orientation ?? "white"} />
      </Container>

      {lastExplain && (
        <Container className="p-3 text-sm">
          {cName(lastExplain, uiLang)}
        </Container>
      )}

      <Container className="p-3 text-xs flex items-center justify-between">
        <span className="opacity-70">
          {Math.min(stepIdx, lesson.steps.length)} / {lesson.steps.length}
        </span>
        {next && (
          <span className="font-mono font-semibold">
            {t("next") || "Next"}: {next.san}
          </span>
        )}
      </Container>

      <div className="flex gap-2">
        <Button onClick={restart} className="flex-1">
          <RotateCcw className="h-4 w-4 mr-2" />
          {t("restart") || "Restart"}
        </Button>
        <Button onClick={advance} active fullWidth disabled={done} className="flex-1">
          <ChevronRight className="h-4 w-4 mr-2" />
          {done ? (t("finished") || "Finished") : (t("nextMove") || "Next move")}
        </Button>
      </div>
    </div>
  );
}
