import { useNavigate, useLocation } from "react-router-dom";
import { Brain } from "lucide-react";
import { NavigatorLayout } from "@/Component/Layout/Utility";
import { useApp } from "@/Context/App";

export function RecallButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setRecallReturnPath, setActiveRecall } = useApp();

  // Extract path segments: e.g., ["Language", "English", "Dictionary", "Vocabulary", "Adjective", "Description", "Beautiful"]
  const segments = location.pathname.split("/").filter(Boolean);

  // Guard: Only render if we are inside the vocabulary category, subcategory, or word detail tracks
  // Path pattern: /Language/:langName/Dictionary/Vocabulary/...
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

    // Preserve the current path so the user can easily return here
    setRecallReturnPath([...segments]);

    // Construct study payload based on the deepness of our current segment path
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

    // Programmatically route over to your study layout screen
    navigate("/Recall");
  };

  // We reuse your NavigatorLayout trigger wrapper properties (h-5 w-5 icon size) without extra text
  return (
    <button
      type="button"
      onClick={handleRecallClick}
      className="flex items-center justify-center rounded-full p-2 bg-background border border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      aria-label="Recall"
    >
      <Brain className="h-5 w-5" />
    </button>
  );
}