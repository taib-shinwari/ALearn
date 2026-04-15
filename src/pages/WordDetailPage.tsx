import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";
import { getWordById, categories } from "@/data/courseData";
import { useApp } from "@/context/AppContext";

export default function WordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPracticeScope } = useApp();

  const word = getWordById(id || "");

  // Find parent subcategory for back navigation
  let parentSubId = "";
  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      if (sub.words.some(w => w.id === id)) {
        parentSubId = sub.id;
        break;
      }
    }
    if (parentSubId) break;
  }

  if (!word) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Word not found.</p>
        <Button onClick={() => navigate("/home")} className="ml-2">Home</Button>
      </div>
    );
  }

  const handlePractice = () => {
    setPracticeScope({ type: "word", id: word.id });
    navigate("/practice");
  };

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto">
      <Button variant="ghost" onClick={() => navigate(`/subcategory/${parentSubId}`)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <h1 className="text-2xl font-semibold mb-1">{word.word}</h1>
      <p className="text-muted-foreground mb-6">{word.translation}</p>

      <Button onClick={handlePractice} className="w-full mb-6 gap-2">
        <Play className="h-4 w-4" /> Practice this word
      </Button>

      <div className="space-y-4">
        {word.definitie && (
          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Definitie</h3>
            <p>{word.definitie}</p>
          </div>
        )}

        {word.meervoud && (
          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Meervoud</h3>
            <p>{word.meervoud}</p>
          </div>
        )}

        {word.verkleinwoord && (
          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Verkleinwoord</h3>
            <p>{word.verkleinwoord}</p>
          </div>
        )}

        {word.vervoeging && (
          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Vervoeging</h3>
            <div className="space-y-1">
              {Object.entries(word.vervoeging).map(([pronoun, form]) => (
                <div key={pronoun} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{pronoun}</span>
                  <span className="font-medium">{form}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
