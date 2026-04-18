import { useParams, useNavigate } from "react-router-dom";
import { CardButton } from "@/components/ui/card-button";
import { categories, localizedName } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useApp } from "@/context/AppContext";

export default function CategoryPage() {
  const { concept, category: categoryId } = useParams<{ concept: string; category: string }>();
  const navigate = useNavigate();
  const { uiLang, t } = useCourseLanguage();
  const { selectedConcept } = useApp();

  const category = categories.find(c => c.id === categoryId);
  const conceptPrefix = `/${concept || selectedConcept}`;

  if (!category) {
    return <div className="px-6 text-sm">{t("notFound")}</div>;
  }

  return (
    <div className="px-6 grid grid-cols-2 gap-3">
      {category.subcategories.map(sub => (
        <CardButton
          key={sub.id}
          onClick={() => navigate(`${conceptPrefix}/${category.id}/${sub.id}`)}
          className="min-h-[80px] flex flex-col justify-between"
        >
          <span className="font-semibold text-sm">{localizedName(sub.name, uiLang)}</span>
          <span className="text-xs mt-2 opacity-70">
            {sub.words.length} {t("words")}
          </span>
        </CardButton>
      ))}
    </div>
  );
}
