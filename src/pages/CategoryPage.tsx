import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";
import { categories } from "@/data/courseData";
import { useApp } from "@/context/AppContext";

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPracticeScope } = useApp();

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
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <h1 className="text-2xl font-semibold mb-4">{category.name}</h1>

      <Button onClick={handlePractice} className="w-full mb-6 gap-2">
        <Play className="h-4 w-4" /> Practice {category.name}
      </Button>

      <div className="space-y-2">
        {category.subcategories.map(sub => (
          <Button
            key={sub.id}
            variant="outline"
            className="w-full justify-between"
            onClick={() => navigate(`/subcategory/${sub.id}`)}
          >
            <span>{sub.name}</span>
            <span className="text-muted-foreground text-sm">{sub.words.length} words</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
