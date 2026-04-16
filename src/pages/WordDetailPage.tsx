import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ArrowLeft, Play, Volume2 } from "lucide-react";
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

  const showLang = flipped ? uiLang : courseLang;
  const definition = showLang === "nl" ? word.nl.definitie : word.en.definition;
  const plural = showLang === "nl" ? word.nl.meervoud : word.en.plural;
  const diminutive = showLang === "nl" ? word.nl.verkleinwoord : word.en.diminutive;
  const conjugation = showLang === "nl" ? word.nl.vervoeging : word.en.conjugation;
  const example = showLang === "nl" ? word.nl.voorbeeld : word.en.example;

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto">
      <Button variant="ghost" onClick={() => navigate(`/subcategory/${parentSubId}`)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}
      </Button>

      {/* Flippable card */}
      <Container
        className="mb-6 cursor-pointer hover:scale-[1.01] transition-transform"
      >
        <div onClick={() => setFlipped(!flipped)}>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold">{word[showLang].word}</h1>
            <Volume2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mb-4">{t("tapToFlip")}</p>

          {definition && (
            <div className="mb-3">
              <h3 className="text-xs font-medium text-muted-foreground mb-0.5">{t("definition")}</h3>
              <p className="text-sm">{definition}</p>
            </div>
          )}

          {plural && (
            <div className="mb-3">
              <h3 className="text-xs font-medium text-muted-foreground mb-0.5">{t("plural")}</h3>
              <p className="text-sm">{plural}</p>
            </div>
          )}

          {diminutive && (
            <div className="mb-3">
              <h3 className="text-xs font-medium text-muted-foreground mb-0.5">{t("diminutive")}</h3>
              <p className="text-sm">{diminutive}</p>
            </div>
          )}

          {conjugation && (
            <div className="mb-3">
              <h3 className="text-xs font-medium text-muted-foreground mb-0.5">{t("conjugation")}</h3>
              <div className="space-y-0.5">
                {Object.entries(conjugation).map(([pronoun, form]) => (
                  <div key={pronoun} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{pronoun}</span>
                    <span className="font-medium">{form}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {example && (
            <div className="mb-1">
              <h3 className="text-xs font-medium text-muted-foreground mb-0.5">{t("example")}</h3>
              <p className="text-sm italic">{example}</p>
            </div>
          )}
        </div>
      </Container>

      <Button onClick={handlePractice} fullWidth className="gap-2">
        <Play className="h-4 w-4" /> {t("practiceThis")}
      </Button>
    </div>
  );
}
