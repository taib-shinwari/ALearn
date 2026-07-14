import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Volume2, RotateCcw } from "lucide-react";
import { Layout } from "@/Component/Layout/Index";
import { CardButton } from "@/Component/UI/card-button";
import { Button } from "@/Component/UI/Button";
import { Container } from "@/Component/UI/container";
import { TitleBar } from "@/Component/UI/title-bar";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useApp } from "@/Context/App";
import { speak, isSpeechAvailable } from "@/Component/Practice/speech";
import { scheduleNext, recallId, type RecallItem } from "@/Library/recall";
import { cn } from "@/Library/utils";

export type SupportedLang = "Dutch" | "English" | "Arabic" | "Pashto";

const MAP_LANG_CODE: Record<string, SupportedLang> = {
  nl: "Dutch",
  en: "English",
  ar: "Arabic",
  ps: "Pashto"
};

export default function FlashcardsPage() {
  const navigate = useNavigate();
  const {
    activeRecall, addRecallItem, recallQueue,
    recallReturnPath, setRecallReturnPath, setBrowsePath,
  } = useApp();
  const { courseLang, t } = useCourseLanguage();

  const apiLangName = activeRecall ? (MAP_LANG_CODE[courseLang] || "English") : "English";

  const hasValidContext = useMemo(() => !!activeRecall, [activeRecall]);

  // Client-side state managers
  const [deckSlugs, setDeckSlugs] = useState<string[]>([]);
  const [subcategoryWords, setSubcategoryWords] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<(1 | 2 | 3 | 4 | 5)[]>([]);

  // 1. Fetch entire active list layout from the EXISTING corpus endpoint
  useEffect(() => {
    if (!hasValidContext || !activeRecall) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    
    // REUSED WORKING ENDPOINT
    fetch(`${baseUrl}/api/language-corpus?lang=${encodeURIComponent(apiLangName)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((corpus) => {
        if (!corpus) return;

        // Drill down to the specific subcategory (matching your dictionary routing)
        const category = activeRecall.categoryId;
        const subcategory = activeRecall.subcategoryId;
        const subcategoryData = corpus?.vocabularyGrammar?.["Vocabulary"]?.[category]?.[subcategory] || {};
        
        const allSlugs = Object.keys(subcategoryData);

        if (activeRecall.wordId) {
          setDeckSlugs(allSlugs.includes(activeRecall.wordId) ? [activeRecall.wordId] : []);
        } else if (activeRecall.wordIds && activeRecall.wordIds.length) {
          const ids = new Set(activeRecall.wordIds);
          setDeckSlugs(allSlugs.filter((slug) => ids.has(slug)));
        } else {
          setDeckSlugs(allSlugs);
        }

        // Cache the entire words map locally in state
        setSubcategoryWords(subcategoryData);
      })
      .catch((err) => console.error("Error loading corpus client-side:", err))
      .finally(() => setLoading(false));
  }, [hasValidContext, activeRecall, apiLangName]);

  // 2. Client-side state derivation (No more network request needed here!)
  const currentSlug = deckSlugs[idx];
  const activeWordData = useMemo(() => {
    if (!currentSlug || !subcategoryWords) return null;
    const rawData = subcategoryWords[currentSlug] || {};
    return {
      word: currentSlug,
      meaning: rawData.translation || rawData.meaning || currentSlug,
      ...rawData
    };
  }, [currentSlug, subcategoryWords]);

  const exitToReturn = () => {
    if (recallReturnPath) {
      setBrowsePath(recallReturnPath);
      setRecallReturnPath(null);
    }
    navigate("/");
  };

  const renderBody = () => {
    if (loading) {
      return <div className="text-sm py-12 text-center opacity-60">Synchronizing your flashcard collection...</div>;
    }

    if (!hasValidContext || !activeRecall || deckSlugs.length === 0) {
      return (
        <div className="px-4 max-w-md mx-auto space-y-4 text-center">
          <p className="text-sm opacity-70">{t("noActive") || "No deck selected."}</p>
          <Button onClick={exitToReturn} fullWidth>{t("back") || "Back"}</Button>
        </div>
      );
    }

    const target = currentSlug || "";
    const meaning = activeWordData?.meaning || currentSlug || "";

    const definition = activeWordData?.definition;
    const plural = activeWordData?.plural;
    const diminutive = activeWordData?.diminutive;
    const conjugation = activeWordData?.conjugation;
    const example = activeWordData?.example;
    const pronunciation = activeWordData?.pronunciation;
    const genderLabel = activeWordData?.gender || null;

    const isLast = idx + 1 >= deckSlugs.length;

    const rateAndAdvance = (r: 1 | 2 | 3 | 4 | 5) => {
      const now = Date.now();
      const wId = recallId("word", activeRecall.categoryId, activeRecall.subcategoryId, currentSlug);
      const prevWord = recallQueue.find(i => i.id === wId);
      const wSched = scheduleNext(prevWord, r);
      const perWord: RecallItem = {
        id: wId,
        scope: "word",
        categoryId: activeRecall.categoryId,
        subcategoryId: activeRecall.subcategoryId,
        wordId: currentSlug,
        title: `${target} · ${activeRecall.subcategoryId}`,
        completedAt: now,
        readyAt: now + wSched.intervalMs,
        lastRating: r,
        ease: wSched.ease,
        reps: wSched.reps,
        intervalDays: wSched.intervalDays,
      };
      addRecallItem(perWord);

      const nextRatings = [...ratings, r];
      if (isLast) {
        const fullDeck = !activeRecall.wordId && (!activeRecall.wordIds || activeRecall.wordIds.length === deckSlugs.length);
        if (fullDeck) {
          const avg = Math.max(1, Math.min(5, Math.round(
            nextRatings.reduce((a, b) => a + b, 0) / nextRatings.length
          ))) as 1 | 2 | 3 | 4 | 5;
          const sId = recallId("subcategory", activeRecall.categoryId, activeRecall.subcategoryId);
          const prevSub = recallQueue.find(i => i.id === sId);
          const sSched = scheduleNext(prevSub, avg);
          const subItem: RecallItem = {
            id: sId,
            scope: "subcategory",
            categoryId: activeRecall.categoryId,
            subcategoryId: activeRecall.subcategoryId,
            title: activeRecall.subcategoryId,
            completedAt: now,
            readyAt: now + sSched.intervalMs,
            lastRating: avg,
            ease: sSched.ease,
            reps: sSched.reps,
            intervalDays: sSched.intervalDays,
          };
          addRecallItem(subItem);
        }
        exitToReturn();
        return;
      }

      setRatings(nextRatings);
      setIdx(i => i + 1);
      setFlipped(false);
    };

    return (
      <div className="px-4 max-w-md mx-auto space-y-4">
        <Container className="flex items-center justify-between text-xs px-3 py-2">
          <span className="opacity-70">{idx + 1} / {deckSlugs.length}</span>
          <span className="font-medium truncate ml-2">
            {activeRecall.subcategoryId}
          </span>
        </Container>

        <CardButton
          onClick={() => setFlipped(f => !f)}
          className={cn("relative", flipped ? "min-h-[320px]" : "min-h-[240px]")}
        >
          {isSpeechAvailable() && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); speak(target, courseLang as any); }}
              className="absolute top-3 right-3 rounded-full p-2 bg-background border-2 border-border hover:bg-foreground hover:text-background transition-colors z-10"
              aria-label={t("play") || "Play"}
            >
              <Volume2 className="h-4 w-4" />
            </button>
          )}
          {!flipped ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] text-center gap-1">
              <h1 className="text-3xl font-bold">{target}</h1>
              {pronunciation && <p className="text-sm opacity-70 font-mono">{pronunciation}</p>}
              <p className="text-xs opacity-50 mt-6">{t("tapToFlip") || "Tap to flip"}</p>
            </div>
          ) : (
            <div className="flex flex-col w-full text-left pr-10">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-2xl font-bold">{target}</h2>
                {pronunciation && <span className="text-sm opacity-70 font-mono">{pronunciation}</span>}
              </div>
              <p className="text-base font-semibold mb-2">{meaning}</p>
              {genderLabel && (
                <span className="inline-block self-start text-xs px-2 py-0.5 rounded-full border-2 border-border bg-background mb-2">
                  {t("gender")}: {genderLabel}
                </span>
              )}
              {definition && <Section label={t("definition") || "Definition"}>{definition}</Section>}
              {plural && <Section label={t("plural") || "Plural"}>{plural}</Section>}
              {diminutive && <Section label={t("diminutive") || "Diminutive"}>{diminutive}</Section>}
              {conjugation && (
                <div className="mb-2">
                  <h3 className="text-xs font-medium opacity-70 mb-0.5">{t("conjugation") || "Conjugation"}</h3>
                  <div className="space-y-0.5">
                    {Object.entries(conjugation).map(([pronoun, form]) => (
                      <div key={pronoun} className="flex justify-between text-sm">
                        <span className="opacity-70">{pronoun}</span>
                        <span className="font-medium">{form as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {example && <Section label={t("example") || "Example"} italic>{example}</Section>}
            </div>
          )}
        </CardButton>

        {!flipped ? (
          <Button onClick={() => setFlipped(true)} active fullWidth>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t("flip") || "Flip"}
          </Button>
        ) : (
          <div className="space-y-2">
            <TitleBar className="text-center text-xs font-medium">
              {t("rateRecall") || "How well did you recall?"}
            </TitleBar>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(r => (
                <Button
                  key={r}
                  onClick={() => rateAndAdvance(r as 1 | 2 | 3 | 4 | 5)}
                  className="h-14 text-lg font-semibold"
                >
                  {r}
                </Button>
              ))}
            </div>
            <div className="flex justify-between text-[11px] opacity-60 px-1">
              <span>{t("ratingLow") || "Barely"}</span>
              <span>{t("ratingHigh") || "Perfect"}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return <Layout>{renderBody()}</Layout>;
}

function Section({ label, children, italic }: { label: string; children: React.ReactNode; italic?: boolean }) {
  return (
    <div className="mb-2">
      <h3 className="text-xs font-medium opacity-70 mb-0.5">{label}</h3>
      <p className={cn("text-sm", italic && "italic")}>{children}</p>
    </div>
  );
}