import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScrollNavbar from "@/components/ScrollNavbar";
import { Settings, Play } from "lucide-react";
import { categories } from "@/data/courseData";
import { useEffect } from "react";

export default function HomePage() {
  const { learningLanguage, introductionCompleted, setPracticeScope } = useApp();
  const navigate = useNavigate();

  const langLabels: Record<string, string> = { nl: "Nederlands", en: "English" };
  const langLabel = langLabels[learningLanguage || ""] || learningLanguage || "Course";

  // Auto-start introduction if not completed
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
        <Button variant="ghost" onClick={() => navigate("/courses")}>{langLabel}</Button>
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <Settings className="h-5 w-5" />
        </Button>
      </ScrollNavbar>

      <div className="p-6 max-w-md mx-auto w-full">
        <h1 className="text-2xl font-semibold mb-4">Learn {langLabel}</h1>

        <Button onClick={handleGlobalPractice} className="w-full mb-6 gap-2">
          <Play className="h-4 w-4" /> Practice
        </Button>

        <h2 className="text-lg font-medium mb-3">Categories</h2>
        <div className="space-y-2">
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate(`/category/${cat.id}`)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
