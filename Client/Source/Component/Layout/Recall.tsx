// @/Component/Header/Recall.tsx
import { useNavigate, useLocation } from "react-router-dom";
import { Brain } from "lucide-react";
import { useApp } from "@/Context/App";

export function RecallButton() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract global selection states from context
  const { 
    setActiveRecall,
    selectMode = false,
    setSelectMode = () => {},
    selected = new Set<string>(),
    setSelected = () => {}
  } = useApp();

  // Extract path segments: e.g., ["Language", "English", "Dictionary", "Vocabulary", "Adjective", "Description", "Beautiful"]
  const segments = location.pathname.split("/").filter(Boolean);

  // Guard: Only render if we are inside the vocabulary category, subcategory, or word detail tracks
  const isDictionaryPath = 
    segments[0]?.toLowerCase() === "language" &&
    segments[2]?.toLowerCase() === "dictionary" &&
    segments[3]?.toLowerCase() === "vocabulary";

  if (!isDictionaryPath) {
    return null;
  }

  const handleRecallClick = () => {
    const categoryId = segments[4];
    const subcategoryId = segments[5];
    const wordId = segments[6] ? decodeURIComponent(segments[6]) : undefined;

    // 1. If in selectMode and words are checked, study ONLY the selected words
    if (selectMode && selected.size > 0) {
      setActiveRecall({
        scope: "word",
        categoryId: categoryId || "",
        subcategoryId: subcategoryId || "",
        wordIds: Array.from(selected),
      });

      // Clear the selection mode and current queue
      setSelectMode(false);
      setSelected(new Set());
      
    } else {
      // 2. Fall back to original scope-based active recall logic
      if (wordId && categoryId && subcategoryId) {
        setActiveRecall({
          scope: "word",
          categoryId,
          subcategoryId,
          wordIds: [wordId],
        });
      } else if (subcategoryId && categoryId) {
        setActiveRecall({
          scope: "subcategory",
          categoryId,
          subcategoryId,
        });
      } else if (categoryId) {
        setActiveRecall({
          scope: "category",
          categoryId,
        });
      }
    }

    // 3. Instead of navigating to "/Recall", append "?Recall" to the current path slug
    navigate(`${location.pathname}?Recall`);
  };

  const hasSelections = selectMode && selected.size > 0;

  return (
    <button
      type="button"
      onClick={handleRecallClick}
      className="relative flex items-center justify-center rounded-full p-2 bg-background border border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      aria-label="Recall"
    >
      <Brain className="h-5 w-5" />
      
      {/* Dynamic selection badge */}
      {hasSelections && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold ring-2 ring-background">
          {selected.size}
        </span>
      )}
    </button>
  );
}