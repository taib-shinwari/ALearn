import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";
import { getWordById, categories } from "@/data/courseData";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

export default function WordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPracticeScope } = useApp();
  const { uiLang, courseLang, t } = useCourseLanguage();
  const [flipped, setFlipped] = useState(false);

  const word = getWordById(id || "");

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

  // Show courseLang data by default, flip to uiLang (the user's native language)
  const showLang = flipped ? uiLang : courseLang;
  const data = word[showLang];

  // Get language-appropriate field labels and values
  const definition = showLang === "nl" ? word.nl.definitie : word.en.definition;
  const plural = showLang === "nl" ? word.nl.meervoud : word.en.plural;
  const diminutive = showLang === "nl" ? word.nl.verkleinwoord : word.en.diminutive;
  const conjugation = showLang === "nl" ? word.nl.vervoeging : word.en.conjugation;

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto">
      <Button variant="ghost" onClick={() => navigate(`/subcategory/${parentSubId}`)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}
      </Button>

      {/* Flippable card */}
      <div
        className="border rounded-lg p-6 mb-6 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setFlipped(!flipped)}
      >
        <h1 className="text-2xl font-semibold mb-1">{data.word}</h1>
        <p className="text-xs text-muted-foreground">{t("tapToFlip")}</p>

        {definition && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("definition")}</h3>
            <p className="text-sm">{definition}</p>
          </div>
        )}

        {plural && (
          <div className="mt-3">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("plural")}</h3>
            <p className="text-sm">{plural}</p>
          </div>
        )}

        {diminutive && (
          <div className="mt-3">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("diminutive")}</h3>
            <p className="text-sm">{diminutive}</p>
          </div>
        )}

        {conjugation && (
          <div className="mt-3">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("conjugation")}</h3>
            <div className="space-y-1">
              {Object.entries(conjugation).map(([pronoun, form]) => (
                <div key={pronoun} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{pronoun}</span>
                  <span className="font-medium">{form}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button onClick={handlePractice} className="w-full gap-2">
        <Play className="h-4 w-4" /> {t("practiceThis")}
      </Button>
    </div>
  );
}
