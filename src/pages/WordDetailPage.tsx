import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Volume2, Bookmark, BookmarkCheck } from "lucide-react";
import { CardButton } from "@/components/ui/card-button";
import { Button } from "@/components/ui/button";
import { categories, WordLang } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { speak, isSpeechAvailable } from "@/components/practice/speech";
import { useMarkedWords } from "@/hooks/useMarkedWords";
import { fetchWordImage } from "@/lib/wordImage";
import { cn } from "@/lib/utils";

type FlipState = 0 | 1 | 2;

export default function WordDetailPage() {
  const { category: categoryId, subcategory: subId, word: wordId } =
    useParams<{ category: string; subcategory: string; word: string }>();
  const { uiLang, courseLang, t } = useCourseLanguage();
  const [flip, setFlip] = useState<FlipState>(0);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const { isMarked, toggle } = useMarkedWords();

  const category = categories.find(c => c.id === categoryId);
  const subcategory = category?.subcategories.find(s => s.id === subId);
  const word = subcategory?.words.find(w => w.id === wordId);

  const targetTextEarly = word ? word[courseLang].word : "";
  useEffect(() => {
    setImgUrl(null);
    if (!targetTextEarly) return;
    let cancelled = false;
    fetchWordImage(targetTextEarly, courseLang).then(url => {
      if (!cancelled) setImgUrl(url);
    });
    return () => { cancelled = true; };
  }, [wordId, targetTextEarly, courseLang]);

  if (!word) {
    return <div className="px-6 text-sm">{t("notFound")}</div>;
  }

  const handleFlip = () => setFlip(f => ((f + 1) % 3) as FlipState);
  const interfaceWordLang: WordLang = uiLang === "ar" ? "en" : (uiLang as WordLang);
  const showLang: WordLang = flip === 2 ? interfaceWordLang : courseLang;
  const data = word[showLang];
  const definition = showLang === "nl" ? word.nl.definitie : word.en.definition;
  const plural = showLang === "nl" ? word.nl.meervoud : word.en.plural;
  const diminutive = showLang === "nl" ? word.nl.verkleinwoord : word.en.diminutive;
  const conjugation = showLang === "nl" ? word.nl.vervoeging : word.en.conjugation;
  const example = showLang === "nl" ? word.nl.voorbeeld : word.en.example;
  const pronunciation = data.pronunciation;
  const gender = data.gender;
  const genderLabel = gender === "m" ? t("masculine")
    : gender === "f" ? t("feminine")
    : gender === "n" ? t("neuter")
    : gender === "c" ? t("common") : null;

  const targetText = word[courseLang].word;
  const frontPron = word[courseLang].pronunciation;
  const marked = isMarked(courseLang, word.id);

  // Container length differs based on whether full word details are shown
  const isFront = flip === 0;

  return (
    <div className="px-6 max-w-md mx-auto space-y-3">
      <CardButton
        onClick={handleFlip}
        className={cn(
          "w-full relative",
          isFront ? "min-h-[140px]" : "min-h-[260px]"
        )}
      >
        {/* Top-right action cluster: TTS + Mark */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          {isSpeechAvailable() && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); speak(targetText, courseLang); }}
              className="rounded-full p-2 bg-white border-2 border-black hover:bg-black hover:text-white transition-colors"
              aria-label={t("play")}
            >
              <Volume2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggle(courseLang, word.id); }}
            className={cn(
              "rounded-full p-2 border-2 border-black transition-colors",
              marked ? "bg-black text-white" : "bg-white hover:bg-black hover:text-white"
            )}
            aria-label={marked ? t("unmark") : t("mark")}
          >
            {marked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex flex-col h-full">
          {isFront ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[100px] gap-1">
              <h1 className="text-3xl font-bold text-center">{targetText}</h1>
              {frontPron && (
                <p className="text-sm opacity-70 font-mono">{frontPron}</p>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1 pr-24">
                <h1 className="text-2xl font-bold">{data.word}</h1>
                <span className="text-xs uppercase tracking-wider opacity-70">{showLang}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {pronunciation && (
                  <span className="text-sm opacity-70 font-mono">{pronunciation}</span>
                )}
                {genderLabel && (
                  <span className="text-xs px-2 py-0.5 rounded-full border-2 border-black bg-white">
                    {t("gender")}: {genderLabel}
                  </span>
                )}
              </div>
              {definition && (
                <Section label={t("definition")}>{definition}</Section>
              )}
              {plural && <Section label={t("plural")}>{plural}</Section>}
              {diminutive && <Section label={t("diminutive")}>{diminutive}</Section>}
              {conjugation && (
                <div className="mb-3">
                  <h3 className="text-xs font-medium opacity-70 mb-0.5">{t("conjugation")}</h3>
                  <div className="space-y-0.5">
                    {Object.entries(conjugation).map(([pronoun, form]) => (
                      <div key={pronoun} className="flex justify-between text-sm">
                        <span className="opacity-70">{pronoun}</span>
                        <span className="font-medium">{form}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {example && <Section label={t("example")} italic>{example}</Section>}
            </>
          )}

          {/* Image lives inside the same container; only render when not errored */}
          {imgUrl && (
            <div className="mt-4 rounded-[14px] overflow-hidden border-2 border-black bg-white aspect-[4/3]">
              <img
                src={imgUrl}
                alt={targetText}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={() => setImgUrl(null)}
              />
            </div>
          )}

          <p className="text-xs opacity-60 mt-4 text-center">{t("tapToFlip")}</p>
        </div>
      </CardButton>
    </div>
  );
}

function Section({ label, children, italic }: { label: string; children: React.ReactNode; italic?: boolean }) {
  return (
    <div className="mb-3">
      <h3 className="text-xs font-medium opacity-70 mb-0.5">{label}</h3>
      <p className={cn("text-sm", italic && "italic")}>{children}</p>
    </div>
  );
}
