import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { TitleBar } from "@/components/ui/title-bar";
import { Check, RotateCcw, ArrowRight } from "lucide-react";
import { CHESS_LESSONS } from "@/data/chessData";
import { getChessLesson } from "@/data/chessData";
import { useChessProgress } from "@/hooks/useChessProgress";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { parseFen, makeMove, legalMovesFrom, Position } from "@/lib/chess/engine";

function loc<T extends { en: string; nl: string; ar?: string }>(o: T, lang: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (o as any)[lang] || o.en;
}

export default function ChessLessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { uiLang, t } = useCourseLanguage();
  const { progress, completeLesson } = useChessProgress();
  const lesson = lessonId ? getChessLesson(lessonId) : undefined;

  const initial = useMemo<Position>(
    () => parseFen(lesson?.fen ?? "8/8/8/8/8/8/8/8 w - - 0 1"),
    [lesson],
  );
  const [pos, setPos] = useState<Position>(initial);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!lesson) return;
    setPos(parseFen(lesson.fen));
    setDone(progress.lessons.includes(lesson.id));
  }, [lesson, progress.lessons]);

  if (!lesson) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="mb-4">{t("notFound")}</p>
        <Button onClick={() => navigate("/chess")}>{t("back")}</Button>
      </div>
    );
  }

  const highlight = [lesson.highlight, ...legalMovesFrom(pos, lesson.highlight).map(m => m.to)];

  const handleMove = (from: string, to: string) => {
    if (from !== lesson.highlight) return false;
    const moves = legalMovesFrom(pos, from);
    const m = moves.find(mv => mv.to === to);
    if (!m) return false;
    setPos(makeMove(pos, m));
    if (!done) { completeLesson(lesson.id); setDone(true); }
    return true;
  };

  const reset = () => setPos(parseFen(lesson.fen));

  return (
    <div className="px-6 space-y-4 max-w-md mx-auto w-full">
      <TitleBar className="font-semibold">{loc(lesson.title, uiLang)}</TitleBar>
      <Container>
        <p className="text-sm leading-relaxed">{loc(lesson.description, uiLang)}</p>
      </Container>

      <ChessBoard
        position={pos}
        highlightSquares={highlight}
        restrictTo={lesson.highlight}
        onMove={handleMove}
      />

      <div className="flex items-center gap-2">
        <Button onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" /> {t("resetBoard")}
        </Button>
        {done && (
          <span className="ml-auto inline-flex items-center gap-1 text-sm">
            <Check className="h-4 w-4" /> {t("completed")}
          </span>
        )}
      </div>
    </div>
  );
}
