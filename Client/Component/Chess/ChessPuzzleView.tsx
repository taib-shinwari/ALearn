// Puzzle feature is currently disabled — the legacy `Server/Data/chessPuzzles`
// module no longer exists and the new Server/API/Chess puzzle data hasn't been
// reshaped into the rich `Puzzle` schema this view needs.
//
// We keep the export so callers (Chess.tsx) compile, but render a "coming
// soon" placeholder instead.
import { Container } from "Client/Component/UI/container";
import { Button } from "Client/Component/UI/button";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";

interface Props { puzzle?: unknown; onSolved?: () => void }

export function ChessPuzzleView(_props: Props) {
  const { uiLang } = useCourseLanguage();
  return (
    <div className="px-4 max-w-md mx-auto py-8">
      <Container className="p-6 text-center space-y-3">
        <h2 className="text-lg font-bold">
          {uiLang === "nl" ? "Puzzels"
            : uiLang === "ar" ? "ألغاز"
            : "Puzzles"}
        </h2>
        <p className="text-sm opacity-70">
          {uiLang === "nl" ? "Puzzels komen binnenkort terug."
            : uiLang === "ar" ? "ستعود الألغاز قريبًا."
            : "Puzzles are coming back soon."}
        </p>
      </Container>
    </div>
  );
}
