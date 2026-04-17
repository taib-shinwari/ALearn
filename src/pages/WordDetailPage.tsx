import { useParams } from "react-router-dom";
import { useState } from "react";
import { Container } from "@/components/ui/container";
import { categories } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

type FlipState = 0 | 1 | 2; // 0: front (target word only), 1: target details, 2: interface details

export default function WordDetailPage() {
  const { category: categoryId, subcategory: subId, word: wordId } =
    useParams<{ category: string; subcategory: string; word: string }>();
  const { uiLang, courseLang, t } = useCourseLanguage();
  const [flip, setFlip] = useState<FlipState>(0);

  const category = categories.find(c => c.id === categoryId);
  const subcategory = category?.subcategories.find(s => s.id === subId);
  const word = subcategory?.words.find(w => w.id === wordId);

  if (!word) {
    return <div className="px-6 text-sm text-muted-foreground">{t("notFound")}</div>;
  }

  const handleFlip = () => setFlip(f => ((f + 1) % 3) as FlipState);

  // Determine which language's details to show
  const showLang: "nl" | "en" = flip === 2 ? uiLang : courseLang;
  const data = word[showLang];
  const definition = showLang === "nl" ? word.nl.definitie : word.en.definition;
  const plural = showLang === "nl" ? word.nl.meervoud : word.en.plural;
  const diminutive = showLang === "nl" ? word.nl.verkleinwoord : word.en.diminutive;
  const conjugation = showLang === "nl" ? word.nl.vervoeging : word.en.conjugation;
  const example = showLang === "nl" ? word.nl.voorbeeld : word.en.example;

  return (
    <div className="px-6 max-w-md mx-auto">
      <Container
        className="cursor-pointer hover:scale-[1.01] transition-transform min-h-[200px]"
      >
        <div onClick={handleFlip} className="flex flex-col h-full">
          {flip === 0 ? (
            <div className="flex-1 flex items-center justify-center min-h-[180px]">
              <h1 className="text-3xl font-bold text-center">{word[courseLang].word}</h1>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-2xl font-bold">{data.word}</h1>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {showLang}
                </span>
              </div>

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
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-0.5">{t("example")}</h3>
                  <p className="text-sm italic">{example}</p>
                </div>
              )}
            </>
          )}
          <p className="text-xs text-muted-foreground mt-4 text-center">{t("tapToFlip")}</p>
        </div>
      </Container>
    </div>
  );
}
