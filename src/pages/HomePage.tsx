import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { CardButton } from "@/components/ui/card-button";
import { Button } from "@/components/ui/button";
import { Type } from "lucide-react";
import { categories, getWordsForCategory, localizedName } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useEffect } from "react";
import { AICallButton } from "@/components/AICallButton";

export default function HomePage() {
  const { introductionCompleted, selectedConcept } = useApp();
  const { uiLang, t } = useCourseLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!introductionCompleted) navigate("/introduction");
  }, [introductionCompleted, navigate]);

  if (!introductionCompleted) return null;

  const conceptPrefix = selectedConcept ? `/${selectedConcept}` : "";

  return (
    <div className="px-6 space-y-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={() => navigate("/alphabet")} className="gap-2">
          <Type className="h-4 w-4" />
          {uiLang === "nl" ? "Alfabet" : uiLang === "ar" ? "الحروف" : "Alphabet"}
        </Button>
        <div className="ml-auto">
          <AICallButton />
        </div>
      </div>

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
    </div>
  );
}
