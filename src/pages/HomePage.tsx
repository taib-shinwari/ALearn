import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { CardButton } from "@/components/ui/card-button";
import { Button } from "@/components/ui/button";
import { TitleBar } from "@/components/ui/title-bar";
import { Play, Map, ChevronDown, ChevronUp } from "lucide-react";
import { categories, getWordsForCategory, localizedName, getLearningPathByDifficulty, type Difficulty } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useEffect, useMemo, useState } from "react";

export default function HomePage() {
  const { introductionCompleted, selectedConcept, reviews, setPracticeScope } = useApp();
  const { uiLang, t } = useCourseLanguage();
  const navigate = useNavigate();
  const [pathOpen, setPathOpen] = useState(false);

  useEffect(() => {
    if (!introductionCompleted) navigate("/introduction");
  }, [introductionCompleted, navigate]);

  if (!introductionCompleted) return null;

  const conceptPrefix = selectedConcept ? `/${selectedConcept}` : "";

  const learnedIds = useMemo(
    () => new Set(reviews.filter(r => (r.reps ?? 0) > 0 || r.learned).map(r => r.wordId)),
    [reviews],
  );

  const currentUnit = useMemo(() => {
    for (const cat of categories) {
      for (const sub of cat.subcategories) {
        const next = sub.words.find(w => !learnedIds.has(w.id));
        if (next) return { cat, sub };
      }
    }
    return { cat: categories[0], sub: categories[0].subcategories[0] };
  }, [learnedIds]);

  const goPracticeAll = () => {
    setPracticeScope({ type: "global" });
    navigate("/practice");
  };

  return (
    <div className="px-6 space-y-4">
      {/* Top action row: Learning Path (left)  ·  Practice (right) */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setPathOpen(o => !o)}
          className="gap-2"
        >
          <Map className="h-4 w-4" />
          {t("learningPath")}
          {pathOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <Button onClick={goPracticeAll} className="gap-2 ml-auto">
          <Play className="h-4 w-4" /> {t("practice")}
        </Button>
      </div>

      {pathOpen && (
        <div className="space-y-4">
          {(["beginner", "intermediate", "advanced"] as Difficulty[]).map(level => {
            const items = getLearningPathByDifficulty()[level];
            if (items.length === 0) return null;
            return (
              <div key={level} className="space-y-1.5">
                <TitleBar className="font-semibold">{t(level)}</TitleBar>
                <ol className="relative ml-3 border-l-2 border-black pl-4 space-y-2">
                  {items.map(({ category, subcategory }, i) => {
                    const isCurrent = subcategory.id === currentUnit.sub.id;
                    const total = subcategory.words.length;
                    const done = subcategory.words.filter(w => learnedIds.has(w.id)).length;
                    return (
                      <li key={subcategory.id} className="relative">
                        <span className="absolute -left-[22px] top-2 w-3 h-3 rounded-full bg-white border-2 border-black" />
                        <CardButton
                          onClick={() => navigate(`${conceptPrefix}/${category.id}/${subcategory.id}`)}
                          className={isCurrent ? "ring-2 ring-black" : ""}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {localizedName(subcategory.name, uiLang)}
                              <span className="opacity-60 text-xs ml-2">{localizedName(category.name, uiLang)}</span>
                            </span>
                            <span className="text-xs opacity-70">{done}/{total}</span>
                          </div>
                        </CardButton>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>
      )}

      {/* Categories grid */}
      <div className="grid grid-cols-2 gap-3">
        {categories.map(cat => {
          const total = getWordsForCategory(cat.id).length;
          return (
            <CardButton
              key={cat.id}
              onClick={() => navigate(`${conceptPrefix}/${cat.id}`)}
              className="min-h-[80px] flex flex-col justify-between"
            >
              <span className="font-semibold text-sm">{localizedName(cat.name, uiLang)}</span>
              <span className="text-xs mt-2 opacity-70">{total} {t("words")}</span>
            </CardButton>
          );
        })}
      </div>
    </div>
  );
}
