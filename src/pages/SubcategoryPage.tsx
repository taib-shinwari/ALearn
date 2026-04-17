import { useParams, useNavigate } from "react-router-dom";
import { Container } from "@/components/ui/container";
import { categories, getWordText } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useApp } from "@/context/AppContext";

export default function SubcategoryPage() {
  const { concept, category: categoryId, subcategory: subId } =
    useParams<{ concept: string; category: string; subcategory: string }>();
  const navigate = useNavigate();
  const { courseLang, t } = useCourseLanguage();
  const { selectedConcept } = useApp();

  const category = categories.find(c => c.id === categoryId);
  const subcategory = category?.subcategories.find(s => s.id === subId);
  const conceptPrefix = `/${concept || selectedConcept}`;

  if (!category || !subcategory) {
    return <div className="px-6 text-sm">{t("notFound")}</div>;
  }

  return (
    <div className="px-6 grid grid-cols-2 gap-3">
      {subcategory.words.map(word => (
        <div
          key={word.id}
          onClick={() => navigate(`${conceptPrefix}/${category.id}/${subcategory.id}/${word.id}`)}
          className="cursor-pointer"
        >
          <Container className="hover:bg-black hover:text-white transition-colors min-h-[80px] flex flex-col justify-between">
            <span className="font-semibold text-sm">{getWordText(word, courseLang)}</span>
          </Container>
        </div>
      ))}
    </div>
  );
}
