import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { TitleBar } from "@/components/ui/title-bar";
import { Check, RotateCcw } from "lucide-react";
import { getChessPuzzle } from "@/data/chessData";
import { useChessProgress } from "@/hooks/useChessProgress";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { parseFen, makeMove, legalMovesFrom, Position } from "@/lib/chess/engine";

function loc<T extends { en: string; nl: string; ar?: string }>(o: T, lang: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (o as any)[lang] || o.en;
}

type Feedback = null | "correct" | "wrong";

export default function ChessPuzzlePage() {
  const { puzzleId } = useParams();
  const navigate = useNavigate();
  const { uiLang, t } = useCourseLanguage();
  const { progress, completePuzzle } = useChessProgress();
  const puzzle = puzzleId ? getChessPuzzle(puzzleId) : undefined;

  const initial = useMemo<Position>(
    () => parseFen(puzzle?.fen ?? "8/8/8/8/8/8/8/8 w - - 0 1"),
    [puzzle],
  );
  const [pos, setPos] = useState<Position>(initial);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    if (!puzzle) return;
    setPos(parseFen(puzzle.fen));
    setFeedback(null);
    setSolved(progress.puzzles.includes(puzzle.id));
  }, [puzzle, progress.puzzles]);

  if (!puzzle) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="mb-4">{t("notFound")}</p>
        <Button onClick={() => navigate("/chess")}>{t("back")}</Button>
      </div>
    );
  }

  const reset = () => { setPos(parseFen(puzzle.fen)); setFeedback(null); };

  const handleMove = (from: string, to: string) => {
    if (solved) return false;
    const legal = legalMovesFrom(pos, from).find(m => m.to === to);
    if (!legal) return false;

    const isSolution = puzzle.solution.some(s => s.from === from && s.to === to);
    if (isSolution) {
      setPos(makeMove(pos, legal));
      setFeedback("correct");
      setSolved(true);
      completePuzzle(puzzle.id);
      return true;
    }
    setFeedback("wrong");
    return false;
  };

  return (
    <div className="px-6 space-y-4 max-w-md mx-auto w-full">
      <TitleBar className="font-semibold">{loc(puzzle.title, uiLang)}</TitleBar>
      <Container>
        <p className="text-sm font-medium">
          {puzzle.sideToMove === "w" ? t("whiteToMove") : t("blackToMove")}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{loc(puzzle.hint, uiLang)}</p>
      </Container>

      <ChessBoard
        position={pos}
        orientation={puzzle.sideToMove === "w" ? "white" : "black"}
        onMove={handleMove}
        disabled={solved}
      />

      {feedback === "correct" && (
        <Container>
          <p className="text-sm font-semibold flex items-center gap-2">
            <Check className="h-4 w-4" /> {t("correctMove")}
          </p>
        </Container>
      )}
      {feedback === "wrong" && (
        <Container className="border-destructive">
          <p className="text-sm text-destructive font-medium">{t("wrongMove")}</p>
        </Container>
      )}

      <div className="flex items-center gap-2">
        <Button onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" /> {t("resetBoard")}
        </Button>
        <Button onClick={() => navigate("/chess")} className="ml-auto">
          {t("back")}
        </Button>
      </div>
    </div>
  );
}
