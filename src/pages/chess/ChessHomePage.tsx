import { useNavigate } from "react-router-dom";
import { CardButton } from "@/components/ui/card-button";
import { Container } from "@/components/ui/container";
import { TitleBar } from "@/components/ui/title-bar";
import { Check, BookOpen, Puzzle } from "lucide-react";
import { CHESS_LESSONS, CHESS_PUZZLES } from "@/data/chessData";
import { useChessProgress } from "@/hooks/useChessProgress";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

function loc<T extends { en: string; nl: string; ar?: string }>(o: T, lang: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (o as any)[lang] || o.en;
}

export default function ChessHomePage() {
  const navigate = useNavigate();
  const { progress } = useChessProgress();
  const { uiLang, t } = useCourseLanguage();

  return (
    <div className="px-6 space-y-6 max-w-2xl mx-auto w-full">
      <section className="space-y-2">
        <TitleBar className="font-semibold">
          <span className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> {t("chessPractice")}</span>
        </TitleBar>
        <Container className="p-2">
          <ol className="space-y-2">
            {CHESS_LESSONS.map((l, i) => {
              const done = progress.lessons.includes(l.id);
              return (
                <li key={l.id}>
                  <CardButton onClick={() => navigate(`/chess/practice/${l.id}`)} className="w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        <span className="opacity-60 mr-2">{i + 1}.</span>{loc(l.title, uiLang)}
                      </span>
                      {done && (
                        <span className="text-xs flex items-center gap-1 opacity-70">
                          <Check className="h-3.5 w-3.5" /> {t("completed")}
                        </span>
                      )}
                    </div>
                  </CardButton>
                </li>
              );
            })}
          </ol>
        </Container>
      </section>

      <section className="space-y-2">
        <TitleBar className="font-semibold">
          <span className="flex items-center gap-2"><Puzzle className="h-4 w-4" /> {t("chessPuzzles")}</span>
        </TitleBar>
        <Container className="p-2">
          <ol className="space-y-2">
            {CHESS_PUZZLES.map((p, i) => {
              const done = progress.puzzles.includes(p.id);
              return (
                <li key={p.id}>
                  <CardButton onClick={() => navigate(`/chess/puzzles/${p.id}`)} className="w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        <span className="opacity-60 mr-2">{i + 1}.</span>{loc(p.title, uiLang)}
                      </span>
                      {done && (
                        <span className="text-xs flex items-center gap-1 opacity-70">
                          <Check className="h-3.5 w-3.5" /> {t("completed")}
                        </span>
                      )}
                    </div>
                  </CardButton>
                </li>
              );
            })}
          </ol>
        </Container>
      </section>
    </div>
  );
}
