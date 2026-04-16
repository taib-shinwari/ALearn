import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ArrowLeft, Play } from "lucide-react";
import { categories, getWordText } from "@/data/courseData";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

export default function SubcategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPracticeScope, reviews } = useApp();
  const { uiLang, courseLang, t } = useCourseLanguage();

  let subcategory = null;
  let parentCategory = null;
  for (const cat of categories) {
    const sub = cat.subcategories.find(s => s.id === id);
    if (sub) {
      subcategory = sub;
      parentCategory = cat;
      break;
    }
  }

  if (!subcategory || !parentCategory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Subcategory not found.</p>
        <Button onClick={() => navigate("/home")} className="ml-2">Home</Button>
      </div>
    );
  }

  const handlePractice = () => {
    setPracticeScope({ type: "subcategory", id: subcategory!.id });
    navigate("/practice");
  };

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto">
      <Button variant="ghost" onClick={() => navigate(`/category/${parentCategory!.id}`)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> {parentCategory.name[uiLang]}
      </Button>

      <h1 className="text-2xl font-semibold mb-4">{subcategory.name[uiLang]}</h1>

      <Button onClick={handlePractice} fullWidth className="mb-6 gap-2">
        <Play className="h-4 w-4" /> {t("practice")} {subcategory.name[uiLang]}
      </Button>

      <div className="space-y-2">
        {subcategory.words.map(word => {
          const isLearned = reviews.some(r => r.wordId === word.id && r.learned);
          return (
            <Container
              key={word.id}
              className="cursor-pointer hover:scale-[1.01] transition-transform flex items-center justify-between"
            >
              <div onClick={() => navigate(`/word/${word.id}`)} className="flex items-center justify-between w-full">
                <span className="font-medium text-sm">{getWordText(word, courseLang)}</span>
                {isLearned && <div className="w-2 h-2 rounded-full bg-green-500" />}
              </div>
            </Container>
          );
        })}
      </div>
    </div>
  );
}
