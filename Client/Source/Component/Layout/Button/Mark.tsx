// @/Component/Word/Buttons/MarkButton.tsx
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useMarkedWords } from "@/Hook/useMarkedWords";
import { cn } from "@/Library/utils";

interface MarkButtonProps {
  wordId: string;
  className?: string;
}

export function MarkButton({ wordId, className }: MarkButtonProps) {
  const { courseLang, t } = useCourseLanguage();
  const { isMarked, toggle } = useMarkedWords();
  const marked = isMarked(courseLang as any, wordId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle(courseLang as any, wordId);
      }}
      className={cn(
        "w-10 h-10 shrink-0 flex items-center justify-center rounded-full border-2 border-border transition-colors",
        marked ? "bg-foreground text-background" : "bg-background hover:bg-foreground hover:text-background",
        className
      )}
      aria-label={marked ? t("unmark") : t("mark")}
    >
      {marked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
    </button>
  );
}