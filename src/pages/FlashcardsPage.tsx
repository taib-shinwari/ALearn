import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Volume2, ArrowRight, RotateCcw } from "lucide-react";
import { CardButton } from "@/components/ui/card-button";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { categories, getWordText, type WordDetail, type WordLang } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useApp } from "@/context/AppContext";
import { speak, isSpeechAvailable } from "@/components/practice/speech";
import {
  intervalFor, recallId, type RecallItem,
} from "@/lib/recall";
import { cn } from "@/lib/utils";

/**
 * Flashcard runner.
 *   /recall/:category/:subcategory          → full deck for the subcategory
 *   /recall/:category/:subcategory/:word    → a single-word deck
 *
 * Flow: flip cards one by one → after the last card, the user picks a
 * 1–5 rating → an item lands in the recall queue and the user returns home.
 */
export default function FlashcardsPage() {
  const { category: categoryId, subcategory: subId, word: wordId } =
    useParams<{ category: string; subcategory: string; word?: string }>();
  const { courseLang, uiLang, t } = useCourseLanguage();
  const { addRecallItem } = useApp();
  const navigate = useNavigate();

  const category = categories.find(c => c.id === categoryId);
  const subcategory = category?.subcategories.find(s => s.id === subId);

  const deck: WordDetail[] = useMemo(() => {
    if (!subcategory) return [];
    if (wordId) {
      const w = subcategory.words.find(w => w.id === wordId);
      return w ? [w] : [];
    }
    return subcategory.words;
  }, [subcategory, wordId]);

  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  if (!category || !subcategory || deck.length === 0) {
    return <div className="px-6 text-sm">{t("notFound")}</div>;
  }

  const word = deck[idx];
  const target = getWordText(word, courseLang);
  const interfaceLang: WordLang = uiLang === "ar" ? "en" : (uiLang as WordLang);
  const meaning = getWordText(word, interfaceLang);

  const next = () => {
    if (idx + 1 >= deck.length) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
      setFlipped(false);
    }
  };

  const finish = (rating: 1 | 2 | 3 | 4 | 5) => {
    const now = Date.now();
    const id = recallId(wordId ? "word" : "subcategory", categoryId!, subId!, wordId);
    const title = wordId
      ? `${target} · ${subcategory.name.en}`
      : (subcategory.name[uiLang as WordLang] || subcategory.name.en);
    const item: RecallItem = {
      id,
      scope: wordId ? "word" : "subcategory",
      categoryId: categoryId!,
      subcategoryId: subId!,
      wordId,
      title,
      completedAt: now,
      readyAt: now + intervalFor(rating),
      lastRating: rating,
    };
    addRecallItem(item);
    navigate("/language");
  };

  if (done) {
    return (
      <div className="px-6 max-w-md mx-auto space-y-4">
        <h1 className="text-xl font-semibold text-center">
          {t("rateRecall") || "How well did you recall?"}
        </h1>
        <p className="text-sm opacity-60 text-center">
          {t("rateHint") || "Higher = wait longer before next recall."}
        </p>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map(r => (
            <Button key={r} onClick={() => finish(r as 1 | 2 | 3 | 4 | 5)} className="h-14 text-lg">
              {r}
            </Button>
          ))}
        </div>
        <div className="flex justify-between text-xs opacity-60 px-1">
          <span>{t("ratingLow") || "Barely"}</span>
          <span>{t("ratingHigh") || "Perfect"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 max-w-md mx-auto space-y-4">
      <Container className="flex items-center justify-between text-xs px-3 py-2">
        <span className="opacity-70">{idx + 1} / {deck.length}</span>
        <span className="font-medium truncate ml-2">
          {subcategory.name[uiLang as WordLang] || subcategory.name.en}
        </span>
      </Container>

      <CardButton
        onClick={() => setFlipped(f => !f)}
        className={cn("min-h-[220px] relative")}
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
        <div className="flex-1 flex flex-col items-center justify-center min-h-[180px] text-center">
          {!flipped ? (
            <h1 className="text-3xl font-bold">{target}</h1>
          ) : (
            <>
              <p className="text-xs uppercase tracking-wider opacity-60 mb-2">
                {t("definition")}
              </p>
              <h2 className="text-2xl font-semibold">{meaning}</h2>
            </>
          )}
          <p className="text-xs opacity-50 mt-6">{t("tapToFlip")}</p>
        </div>
      </CardButton>

      <div className="flex gap-2">
        <Button onClick={() => setFlipped(f => !f)} fullWidth>
          <RotateCcw className="h-4 w-4 mr-2" />
          {t("flip") || "Flip"}
        </Button>
        <Button onClick={next} active fullWidth>
          {idx + 1 >= deck.length ? (t("finish") || "Finish") : (t("next") || "Next")}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
