// @/Component/Word/Buttons/FavoriteButton.tsx
import { Star } from "lucide-react";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useFavoriteWords } from "@/Hook/useFavoriteWords";
import { cn } from "@/Library/utils";

interface FavoriteButtonProps {
  wordId: string;
  className?: string;
}

export function FavoriteButton({ wordId, className }: FavoriteButtonProps) {
  const { courseLang, t } = useCourseLanguage();
  const { isFavorite, toggle: toggleFav } = useFavoriteWords();
  const favored = isFavorite(courseLang as any, wordId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleFav(courseLang as any, wordId);
      }}
      className={cn(
        "w-10 h-10 shrink-0 flex items-center justify-center rounded-full border-2 border-border transition-colors",
        favored ? "bg-foreground text-background" : "bg-background hover:bg-foreground hover:text-background",
        className
      )}
      aria-label={favored ? (t("unfavorite") || "Unfavorite") : (t("favorite") || "Favorite")}
    >
      {favored ? <Star className="h-5 w-5 fill-current" /> : <Star className="h-5 w-5" />}
    </button>
  );
}