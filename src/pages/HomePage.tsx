import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { CardButton } from "@/components/ui/card-button";
import { Button } from "@/components/ui/button";
import { Play, Map, X } from "lucide-react";
import { categories, getWordsForCategory, localizedName } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useEffect, useState } from "react";
import { LearningPath } from "@/components/LearningPath";
import { AICallButton } from "@/components/AICallButton";

export default function HomePage() {
  const { introductionCompleted, selectedConcept, setPracticeScope } = useApp();
  const { uiLang, t } = useCourseLanguage();
  const navigate = useNavigate();
  const [pathOpen, setPathOpen] = useState(false);

  useEffect(() => {
    if (!introductionCompleted) navigate("/introduction");
  }, [introductionCompleted, navigate]);

  if (!introductionCompleted) return null;

  const conceptPrefix = selectedConcept ? `/${selectedConcept}` : "";

  const goPracticeAll = () => {
    setPracticeScope({ type: "global" });
    navigate("/practice");
  };

  return (
    <div className="px-6 space-y-6 max-w-2xl mx-auto w-full">
      {/* Top action row */}
      <div className="flex items-center gap-2">
        <Button onClick={() => setPathOpen(o => !o)} className="gap-2">
          {pathOpen ? <X className="h-4 w-4" /> : <Map className="h-4 w-4" />}
          {t("learningPath")}
        </Button>
        <Button onClick={goPracticeAll} active className="gap-2 ml-auto">
          <Play className="h-4 w-4" /> {t("practice")}
        </Button>
      </div>

      {pathOpen ? (
        <LearningPath />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {categories.map(cat => {
            const total = getWordsForCategory(cat.id).length;
            return (
              <CardButton
                key={cat.id}
                onClick={() => navigate(`${conceptPrefix}/${cat.id}`)}
                className="min-h-[88px] flex flex-col justify-between"
              >
                <span className="font-semibold text-sm">{localizedName(cat.name, uiLang)}</span>
                <span className="text-xs mt-2 text-muted-foreground">
                  {total} {t("words")}
                </span>
              </CardButton>
            );
          })}
        </div>
      )}
    </div>
  );
}
