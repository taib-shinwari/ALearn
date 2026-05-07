import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { CardButton } from "@/components/ui/card-button";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { TitleBar } from "@/components/ui/title-bar";
import { Play, Compass, ChevronDown, ChevronUp } from "lucide-react";
import { categories, getWordsForCategory, localizedName } from "@/data/courseData";
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

  // Determine the "current unit": the first subcategory containing a word the
  // user hasn't yet answered correctly (reps === 0). Falls back to the first.
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

  const goCurrentUnit = () => {
    if (currentUnit.sub) {
      navigate(`${conceptPrefix}/${currentUnit.cat.id}/${currentUnit.sub.id}`);
    }
  };

  return (
    <div className="px-6 space-y-4">
      {/* Practice + current unit container (root only) */}
      <Container className="space-y-2">
        <Button fullWidth onClick={goPracticeAll} className="gap-2">
          <Play className="h-4 w-4" /> {t("practice")}
        </Button>
        <Button fullWidth onClick={goCurrentUnit} className="gap-2">
          <Compass className="h-4 w-4" />
          {t("currentUnit")}: {localizedName(currentUnit.sub.name, uiLang)}
        </Button>
        <Button
          fullWidth
          onClick={() => setPathOpen(o => !o)}
          className="gap-2"
        >
          {pathOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {t("learningPath")}
        </Button>

        {pathOpen && (
          <div className="pt-2 space-y-3">
            {categories.map(cat => (
              <div key={cat.id} className="space-y-1.5">
                <TitleBar className="font-semibold">{localizedName(cat.name, uiLang)}</TitleBar>
                <ol className="relative ml-3 border-l-2 border-black pl-4 space-y-2">
                  {cat.subcategories.map((sub, i) => {
                    const isCurrent = sub.id === currentUnit.sub.id;
                    const total = sub.words.length;
                    const done = sub.words.filter(w => learnedIds.has(w.id)).length;
                    return (
                      <li key={sub.id} className="relative">
                        <span className="absolute -left-[22px] top-2 w-3 h-3 rounded-full bg-white border-2 border-black" />
                        <CardButton
                          onClick={() => navigate(`${conceptPrefix}/${cat.id}/${sub.id}`)}
                          className={isCurrent ? "ring-2 ring-black" : ""}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {t("unit")} {i + 1} · {localizedName(sub.name, uiLang)}
                            </span>
                            <span className="text-xs opacity-70">{done}/{total}</span>
                          </div>
                        </CardButton>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        )}
      </Container>

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
