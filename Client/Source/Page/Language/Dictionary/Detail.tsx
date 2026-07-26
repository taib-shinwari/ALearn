// @/Component/Word/WordDetailView.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/Component/UI/Button";
import { WordEditDialog } from "@/Component/Word/WordEditDialog";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useCustomWords } from "@/Hook/useCustomWords";
import { fetchWordImage } from "@/Library/wordImage";
import { cn } from "@/Library/utils";
import { BACKEND_BASE_URL, DEFAULT_SECTION, wordDetailFromApi, SupportedLang } from "@/Library/Language";
import type { WordDetail } from "@/Hook/useCustomWords";
import type { WordLang } from "@/Library/wordTypes";

type FlipState = 0 | 1 | 2;

function Section({ label, children, italic }: { label: string; children: React.ReactNode; italic?: boolean }) {
  return (
    <div className="mb-3">
      <h3 className="text-xs font-medium opacity-70 mb-0.5">{label}</h3>
      <p className={cn("text-sm", italic && "italic")}>{children}</p>
    </div>
  );
}

export default function WordDetailView() {
  const { langName, categoryId, subcategoryId, wordId } = useParams<{
    langName: string;
    categoryId: string;
    subcategoryId: string;
    wordId: string;
  }>();

  const navigate = useNavigate();
  const activeLangName = (langName || "English") as SupportedLang;
  
  const { uiLang, courseLang, t } = useCourseLanguage();
  const [flip, setFlip] = useState<FlipState>(0);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  
  const { customWords, updateCustomWord, removeCustomWord, setOverride } = useCustomWords(categoryId || "", subcategoryId || "");
  const [editOpen, setEditOpen] = useState(false);

  // Local state to store fetched word details
  const [word, setWord] = useState<WordDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch target word from existing corpus endpoint
  useEffect(() => {
    if (!categoryId || !subcategoryId || !wordId) return;

    setLoading(true);
    fetch(`${BACKEND_BASE_URL}/api/language-corpus?lang=${encodeURIComponent(activeLangName)}`)
      .then(res => res.ok ? res.json() : null)
      .then(corpus => {
        const subcategoryData = corpus?.vocabularyGrammar?.[DEFAULT_SECTION]?.[categoryId]?.[subcategoryId] || {};
        const rawWord = subcategoryData[wordId];

        if (rawWord) {
          const compiled = wordDetailFromApi(wordId, rawWord, activeLangName);
          setWord(compiled);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed loading word details in Detail.tsx page:", err);
        setLoading(false);
      });
  }, [activeLangName, categoryId, subcategoryId, wordId]);

  const targetTextEarly = word ? (word[courseLang]?.word ?? word.en?.word) : "";
  const showImage = categoryId === "zelfstandig-naamwoord";

  useEffect(() => {
    setImgUrl(null);
    if (!targetTextEarly || !showImage || !word) return;
    let cancelled = false;
    fetchWordImage({
      word: targetTextEarly,
      lang: courseLang,
      enWord: word.en?.word,
      enDefinition: word.en?.definition,
    }).then(url => {
      if (!cancelled) setImgUrl(url);
    });
    return () => { cancelled = true; };
  }, [word?.id, targetTextEarly, courseLang, showImage, word?.en?.word, word?.en?.definition]);

  if (loading) {
    return <div className="p-8 text-center text-sm opacity-60">Loading word details...</div>;
  }

  if (!word) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm opacity-60">Word details not found.</p>
        <button onClick={() => navigate(-1)} className="text-xs underline">Back</button>
      </div>
    );
  }

  const handleFlip = () => setFlip(f => ((f + 1) % 3) as FlipState);

  const cLang  = courseLang as WordLang;
  const interfaceWordLang: WordLang = uiLang === "ar" ? "en" : (uiLang as WordLang);
  const showLang: WordLang = flip === 2 ? interfaceWordLang : cLang;
  
  const dataFor = (lang: WordLang) => {
    const rawData = lang === "ar" ? (word.ar ?? word.en) : word[lang];
    return rawData || {};
  };
  const data = dataFor(showLang);

  const en = word.en ?? {};
  const nl = word.nl ?? {};
  const definition  = showLang === "nl" ? nl.definitie  : showLang === "ar" ? (word.ar?.definition ?? en.definition)  : en.definition;
  const plural      = showLang === "nl" ? nl.meervoud   : en.plural;
  const diminutive  = showLang === "nl" ? nl.verkleinwoord : en.diminutive;
  const conjugation = showLang === "nl" ? nl.vervoeging : en.conjugation;
  const example     = showLang === "nl" ? nl.voorbeeld  : showLang === "ar" ? (word.ar?.example ?? en.example) : en.example;
  
  const pronunciation = data?.pronunciation ?? undefined;
  const gender = showLang === "nl" ? nl.gender : showLang === "en" ? en.gender : undefined;
  
  const genderLabel = gender === "m" ? t("masculine")
    : gender === "f" ? t("feminine")
    : gender === "n" ? t("neuter")
    : gender === "c" ? t("common") : null;

  const targetText = (cLang === "ar" ? word.ar?.word : word[cLang]?.word) ?? word.en?.word;
  const frontPron  = (cLang === "ar" ? word.ar?.pronunciation : word[cLang]?.pronunciation) ?? undefined;
  const isFront = flip === 0;

  const isCustom = customWords.some(w => w.id === word.id);

  return (
    <div className="px-4 max-w-md mx-auto space-y-4 pt-4">
      <Button
        onClick={handleFlip}
        className={cn(
          "w-full relative rounded-2xl p-4 flex flex-col justify-start items-stretch text-left",
          isFront ? "min-h-[140px]" : "min-h-[260px]"
        )}
      >
        {/* Floating Indicator for active flipping Language context */}
        {!isFront && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full border border-border bg-background text-foreground group-hover:border-foreground">
              {showLang}
            </span>
          </div>
        )}

        {/* Card body */}
        <div className="flex flex-col h-full text-left w-full">
          {isFront ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[100px] gap-1">
              <h1 className="text-3xl font-bold text-center">{targetText}</h1>
              {frontPron && <p className="text-sm opacity-70 font-mono">{frontPron}</p>}
            </div>
          ) : (
            <>
              <div className="flex items-center mb-2 pr-12">
                <h1 className="text-2xl font-bold">{data?.word || targetText}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {pronunciation && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full border border-border bg-background text-foreground group-hover:border-foreground">
                    {pronunciation}
                  </span>
                )}
                {genderLabel && (
                  <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-background text-foreground group-hover:border-foreground">
                    {t("gender")}: {genderLabel}
                  </span>
                )}
              </div>
              {definition  && <Section label={t("definition")}>{definition}</Section>}
              {plural      && <Section label={t("plural")}>{plural}</Section>}
              {diminutive  && <Section label={t("diminutive")}>{diminutive}</Section>}
              {conjugation && (
                <div className="mb-3">
                  <h3 className="text-xs font-medium opacity-70 mb-0.5">{t("conjugation")}</h3>
                  <div className="space-y-0.5">
                    {Object.entries(conjugation).map(([pronoun, form]) => (
                      <div key={pronoun} className="flex justify-between text-sm">
                        <span className="opacity-70">{pronoun}</span>
                        <span className="font-medium">{String(form ?? "")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {example && <Section label={t("example")} italic>{example}</Section>}
            </>
          )}

          {imgUrl && (
            <div className="mt-4 rounded-xl overflow-hidden border border-border bg-background aspect-[4/3] group-hover:border-foreground transition-colors">
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
      </Button>

      {/* Global State/Trigger-Controlled Edit Dialog */}
      <WordEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        word={word}
        onSave={(w) => {
          if (isCustom) updateCustomWord(word.id, w);
          else setOverride(word.id, w);
        }}
        onDelete={isCustom ? () => removeCustomWord(word.id) : undefined}
      />
    </div>
  );
}