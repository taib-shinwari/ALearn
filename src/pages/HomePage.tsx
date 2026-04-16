import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Settings, Flame, Star, BookOpen } from "lucide-react";
import { categories, getWordsForCategory } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useEffect } from "react";

export default function HomePage() {
  const { introductionCompleted, streak, xp, user, reviews } = useApp();
  const { uiLang, t } = useCourseLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!introductionCompleted) {
      navigate("/introduction");
    }
  }, [introductionCompleted, navigate]);

  if (!introductionCompleted) return null;

  const getProgress = (categoryId: string) => {
    const words = getWordsForCategory(categoryId);
    const learned = words.filter(w => reviews.some(r => r.wordId === w.id && r.learned)).length;
    return { learned, total: words.length };
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="font-bold text-sm">{streak}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="font-bold text-sm">{xp}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/courses")}>
            <BookOpen className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-6 mb-6">
        <h1 className="text-2xl font-bold">{t("hi")}, {user?.firstName || ""}! 👋</h1>
      </div>

      {/* Category grid */}
      <div className="px-6 grid grid-cols-2 gap-3">
        {categories.map(cat => {
          const { learned, total } = getProgress(cat.id);
          const pct = total > 0 ? Math.round((learned / total) * 100) : 0;
          return (
            <Container
              key={cat.id}
              className="cursor-pointer hover:scale-[1.02] transition-transform p-4"
            >
              <div onClick={() => navigate(`/category/${cat.id}`)} className="flex flex-col h-full min-h-[80px] justify-between">
                <span className="font-semibold text-sm">{cat.name[uiLang]}</span>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{learned}/{total}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            </Container>
          );
        })}
      </div>
    </div>
  );
}
