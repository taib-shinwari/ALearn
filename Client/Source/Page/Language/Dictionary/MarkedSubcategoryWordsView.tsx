import { useMemo } from "react";
import { useApp } from "@/Context/App";
import { useMarkedWords } from "@/Hook/useMarkedWords";
import { CardButton } from "@/Component/UI/card-button";

interface MarkedSubcategoryWordsViewProps {
  categoryId: string;
  subcategoryId: string;
  targetLang: string;
  initialSlugs: string[];
}

export function MarkedSubcategoryWordsView({ categoryId, subcategoryId, targetLang, initialSlugs }: MarkedSubcategoryWordsViewProps) {
  const { setBrowsePath } = useApp();
  const { map } = useMarkedWords();
  
  const markedIds = useMemo(() => new Set(map[targetLang as any] || []), [map, targetLang]);
  const words = initialSlugs.filter(id => markedIds.has(id));

  return (
    <div className="px-4 w-full space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {words.map(slug => (
          <CardButton
            key={slug}
            onClick={() => setBrowsePath(["language", targetLang, "_marked", categoryId, subcategoryId, slug])}
            className="min-h-[56px] py-2 px-3 flex items-center justify-center text-center"
          >
            <span className="font-semibold text-sm">{slug}</span>
          </CardButton>
        ))}
      </div>
    </div>
  );
}