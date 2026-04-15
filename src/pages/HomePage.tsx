import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScrollNavbar from "@/components/ScrollNavbar";
import { Settings, Play } from "lucide-react";
import { categories } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useEffect } from "react";

export default function HomePage() {
  const { introductionCompleted, setPracticeScope } = useApp();
  const { uiLang, t } = useCourseLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!introductionCompleted) {
      navigate("/introduction");
    }
  }, [introductionCompleted, navigate]);

  const handleGlobalPractice = () => {
    setPracticeScope({ type: "global" });
    navigate("/practice");
  };

  if (!introductionCompleted) return null;

  return (
    <div className="min-h-screen pt-16">
      <ScrollNavbar>
        <Button variant="ghost" onClick={() => navigate("/courses")}>
          {t("yourCourses")}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <Settings className="h-5 w-5" />
        </Button>
      </ScrollNavbar>

      <div className="p-6 max-w-lg mx-auto w-full">
        <Button onClick={handleGlobalPractice} className="w-full mb-6 gap-2">
          <Play className="h-4 w-4" /> {t("practice")}
        </Button>

        <div className="grid grid-cols-2 gap-3">
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant="outline"
              className="h-24 flex items-center justify-center text-center"
              onClick={() => navigate(`/category/${cat.id}`)}
            >
              {cat.name[uiLang]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
