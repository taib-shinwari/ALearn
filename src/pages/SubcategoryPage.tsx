import { useParams, useNavigate } from "react-router-dom";
import { Container } from "@/components/ui/container";
import { categories, getWordText } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

export default function SubcategoryPage() {
  const { category: categoryId, subcategory: subId } = useParams<{ category: string; subcategory: string }>();
  const navigate = useNavigate();
  const { courseLang, t } = useCourseLanguage();

  const category = categories.find(c => c.id === categoryId);
  const subcategory = category?.subcategories.find(s => s.id === subId);

  if (!category || !subcategory) {
    return (
      <div className="px-6 text-sm text-muted-foreground">{t("notFound")}</div>
    );
  }

  return (
    <div className="px-6 grid grid-cols-2 gap-3">
      {subcategory.words.map(word => (
        <Container
          key={word.id}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div
            onClick={() => navigate(`/${category.id}/${subcategory.id}/${word.id}`)}
            className="flex flex-col h-full min-h-[80px] justify-between"
          >
            <span className="font-semibold text-sm">{getWordText(word, courseLang)}</span>
          </div>
        </Container>
      ))}
    </div>
  );
}
