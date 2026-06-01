import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Volume2, RotateCcw } from "lucide-react";
import { CardButton } from "@/components/ui/card-button";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { TitleBar } from "@/components/ui/title-bar";
import { categories, getWordText, type WordDetail, type WordLang } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useApp } from "@/context/AppContext";
import { speak, isSpeechAvailable } from "@/components/practice/speech";
import { intervalFor, recallId, type RecallItem } from "@/lib/recall";
import { cn } from "@/lib/utils";

/**
 * Flashcard runner. The deck (subcategory or single word) is read from
 * `activeRecall` in app state, set before navigation.
 *
 * Each card flow: front → flip to back → self-rate 1-5 → next card.
 * Per-card ratings persist a per-word recall item; finishing also persists
 * a subcategory-level recall item using the average rating.
 */
export default function FlashcardsPage() {
  const navigate = useNavigate();
  const { activeRecall, addRecallItem } = useApp();
  const { courseLang, uiLang, t } = useCourseLanguage();

  const category = activeRecall && categories.find(c => c.id === activeRecall.categoryId);
  const subcategory = category?.subcategories.find(s => s.id === activeRecall?.subcategoryId);

  const deck: WordDetail[] = useMemo(() => {
    if (!subcategory || !activeRecall) return [];
    if (activeRecall.wordId) {
      const w = subcategory.words.find(w => w.id === activeRecall.wordId);
      return w ? [w] : [];
    }
    return subcategory.words;
  }, [subcategory, activeRecall]);

  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<(1 | 2 | 3 | 4 | 5)[]>([]);

  if (!activeRecall || !category || !subcategory || deck.length === 0) {
    return (
      <div className="px-4 max-w-md mx-auto space-y-4 text-center">
        <p className="text-sm opacity-70">{t("noActive") || "No deck selected."}</p>
        <Button onClick={() => navigate("/")} fullWidth>{t("back") || "Back"}</Button>
      </div>
    );
  }

  const word = deck[idx];
  const target = getWordText(word, courseLang);
  const interfaceLang: WordLang = uiLang === "ar" ? "en" : (uiLang as WordLang);
  const meaning = getWordText(word, interfaceLang);
  const isLast = idx + 1 >= deck.length;

  const rateAndAdvance = (r: 1 | 2 | 3 | 4 | 5) => {
    const now = Date.now();
    // Per-card recall item (always per-word, scoped by current word).
    const perWord: RecallItem = {
      id: recallId("word", activeRecall.categoryId, activeRecall.subcategoryId, word.id),
      scope: "word",
      categoryId: activeRecall.categoryId,
      subcategoryId: activeRecall.subcategoryId,
      wordId: word.id,
      title: `${target} · ${subcategory.name[uiLang as WordLang] || subcategory.name.en}`,
      completedAt: now,
      readyAt: now + intervalFor(r),
      lastRating: r,
    };
    addRecallItem(perWord);

    const nextRatings = [...ratings, r];
    if (isLast) {
      // Subcategory-level item if running the full deck.
      if (!activeRecall.wordId) {
        const avg = Math.max(1, Math.min(5, Math.round(
          nextRatings.reduce((a, b) => a + b, 0) / nextRatings.length
        ))) as 1 | 2 | 3 | 4 | 5;
        const subItem: RecallItem = {
          id: recallId("subcategory", activeRecall.categoryId, activeRecall.subcategoryId),
          scope: "subcategory",
          categoryId: activeRecall.categoryId,
          subcategoryId: activeRecall.subcategoryId,
          title: subcategory.name[uiLang as WordLang] || subcategory.name.en,
          completedAt: now,
          readyAt: now + intervalFor(avg),
          lastRating: avg,
        };
        addRecallItem(subItem);
      }
      navigate("/");
      return;
    }

    setRatings(nextRatings);
    setIdx(i => i + 1);
    setFlipped(false);
  };

  return (
    <div className="px-4 max-w-md mx-auto space-y-4">
      <Container className="flex items-center justify-between text-xs px-3 py-2">
        <span className="opacity-70">{idx + 1} / {deck.length}</span>
        <span className="font-medium truncate ml-2">
          {subcategory.name[uiLang as WordLang] || subcategory.name.en}
        </span>
      </Container>

      <CardButton
        onClick={() => setFlipped(f => !f)}
        className={cn("min-h-[240px] relative")}
      >
        {isSpeechAvailable() && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); speak(target, courseLang); }}
            className="absolute top-3 right-3 rounded-full p-2 bg-background border-2 border-border hover:bg-foreground hover:text-background transition-colors"
            aria-label={t("play")}
          >
            <Volume2 className="h-4 w-4" />
          </button>
        )}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] text-center">
          {!flipped ? (
            <h1 className="text-3xl font-bold">{target}</h1>
          ) : (
            <>
              <p className="text-xs uppercase tracking-wider opacity-60 mb-2">{t("definition")}</p>
              <h2 className="text-2xl font-semibold">{meaning}</h2>
            </>
          )}
          <p className="text-xs opacity-50 mt-6">{t("tapToFlip")}</p>
        </div>
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
}
