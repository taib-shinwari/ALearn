import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { CardButton } from "@/components/ui/card-button";
import { categories, getWordsForCategory, localizedName } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useEffect } from "react";

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
    <div className="px-6 grid grid-cols-2 gap-3">
      {categories.map(cat => {
        const total = getWordsForCategory(cat.id).length;
        return (
          <CardButton
            key={cat.id}
            onClick={() => navigate(`${conceptPrefix}/${cat.id}`)}
            className="min-h-[80px] flex flex-col justify-between"
          >
            <span className="font-semibold text-sm">{localizedName(cat.name, uiLang)}</span>
            <span className="text-xs mt-2 opacity-70">
              {total} {t("words")}
            </span>
          </CardButton>
        );
      })}
    </div>
  );
}
