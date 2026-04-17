import { useParams, useNavigate } from "react-router-dom";
import { Container } from "@/components/ui/container";
import { categories } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

export default function CategoryPage() {
  const { category: categoryId } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { uiLang, t } = useCourseLanguage();

  const category = categories.find(c => c.id === categoryId);

  if (!category) {
    return (
      <div className="px-6 text-sm text-muted-foreground">
        {t("notFound")}
      </div>
    );
  }

  return (
    <div className="px-6 grid grid-cols-2 gap-3">
      {category.subcategories.map(sub => (
        <Container
          key={sub.id}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div
            onClick={() => navigate(`/${category.id}/${sub.id}`)}
            className="flex flex-col h-full min-h-[80px] justify-between"
          >
            <span className="font-semibold text-sm">{sub.name[uiLang]}</span>
            <span className="text-xs text-muted-foreground mt-2">
              {sub.words.length} {t("words")}
            </span>
          </div>
        </Container>
      ))}
    </div>
  );
}
