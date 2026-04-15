import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";
import { categories } from "@/data/courseData";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPracticeScope } = useApp();
  const { uiLang, t } = useCourseLanguage();

  const category = categories.find(c => c.id === id);

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Category not found.</p>
        <Button onClick={() => navigate("/home")} className="ml-2">Home</Button>
      </div>
    );
  }

  const handlePractice = () => {
    setPracticeScope({ type: "category", id: category.id });
    navigate("/practice");
  };

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto">
      <Button variant="ghost" onClick={() => navigate("/home")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}
      </Button>

      <h1 className="text-2xl font-semibold mb-4">{category.name[uiLang]}</h1>

      <Button onClick={handlePractice} className="w-full mb-6 gap-2">
        <Play className="h-4 w-4" /> {t("practice")} {category.name[uiLang]}
      </Button>

      <div className="grid grid-cols-2 gap-3">
        {category.subcategories.map(sub => (
          <Button
            key={sub.id}
            variant="outline"
            className="h-20 flex flex-col items-center justify-center"
            onClick={() => navigate(`/subcategory/${sub.id}`)}
          >
            <span>{sub.name[uiLang]}</span>
            <span className="text-muted-foreground text-xs">{sub.words.length} {t("words")}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
