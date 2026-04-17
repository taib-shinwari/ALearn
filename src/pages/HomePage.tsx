import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Container } from "@/components/ui/container";
import { categories, getWordsForCategory } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useEffect } from "react";

export default function HomePage() {
  const { introductionCompleted } = useApp();
  const { uiLang, t } = useCourseLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!introductionCompleted) navigate("/introduction");
  }, [introductionCompleted, navigate]);

  if (!introductionCompleted) return null;

  return (
    <div className="px-6 grid grid-cols-2 gap-3">
      {categories.map(cat => {
        const total = getWordsForCategory(cat.id).length;
        return (
          <Container
            key={cat.id}
            className="cursor-pointer hover:scale-[1.02] transition-transform"
          >
            <div
              onClick={() => navigate(`/${cat.id}`)}
              className="flex flex-col h-full min-h-[80px] justify-between"
            >
              <span className="font-semibold text-sm">{cat.name[uiLang]}</span>
              <span className="text-xs text-muted-foreground mt-2">
                {total} {t("words")}
              </span>
            </div>
          </Container>
        );
      })}
    </div>
  );
}
