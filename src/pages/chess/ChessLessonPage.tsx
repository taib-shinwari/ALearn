import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { TitleBar } from "@/components/ui/title-bar";
import { Check, RotateCcw } from "lucide-react";
import { getChessLesson } from "@/data/chessData";
import { useChessProgress } from "@/hooks/useChessProgress";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

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

  const [game, setGame] = useState(() => new Chess(lesson?.fen ?? "8/8/8/8/8/8/8/8 w - - 0 1"));
  const [done, setDone] = useState(false);

  // Squares the highlighted piece can legally move to.
  const legalSquares = useMemo(() => {
    if (!lesson) return [] as string[];
    try {
      const moves = game.moves({ square: lesson.highlight as any, verbose: true }) as Array<{ to: string }>;
      return moves.map(m => m.to);
    } catch { return []; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, game.fen()]);

  useEffect(() => {
    if (!lesson) return;
    setGame(new Chess(lesson.fen));
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

  const reset = () => { setGame(new Chess(lesson.fen)); setDone(progress.lessons.includes(lesson.id)); };

  const squareStyles: Record<string, React.CSSProperties> = {
    [lesson.highlight]: { boxShadow: "inset 0 0 0 3px hsl(var(--ring))" },
    ...Object.fromEntries(legalSquares.map(sq => [sq, {
      background: "radial-gradient(circle, hsl(var(--foreground) / 0.35) 22%, transparent 25%)",
    }])),
  };

  const onPieceDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
    if (!targetSquare) return false;
    if (sourceSquare !== lesson.highlight) return false;
    try {
      const move = game.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
      if (!move) return false;
      // Force re-render with new game instance
      setGame(new Chess(game.fen()));
      if (!done) { completeLesson(lesson.id); setDone(true); }
      return true;
    } catch { return false; }
  };

  return (
    <div className="px-6 space-y-4 max-w-md mx-auto w-full">
      <TitleBar className="font-semibold">{loc(lesson.title, uiLang)}</TitleBar>
      <Container>
        <p className="text-sm leading-relaxed">{loc(lesson.description, uiLang)}</p>
      </Container>

      <div className="rounded-[20px] overflow-hidden border-2 border-foreground bg-background">
        <Chessboard
          options={{
            position: game.fen(),
            onPieceDrop,
            squareStyles,
            allowDragging: true,
            showNotation: true,
            animationDurationInMs: 150,
          }}
        />
      </div>

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
