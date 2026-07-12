import { useState, useEffect } from "react";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useCustomWords } from "@/Hook/useCustomWords";
import { WordDetailView } from "@/Component/View/Word";
import { BACKEND_BASE_URL, DEFAULT_SECTION, wordDetailFromApi, SupportedLang } from "@/Library/Language";
import type { WordDetail } from "@/Hook/useCustomWords";

interface WordDetailResolverProps {
  categoryId: string;
  subcategoryId: string;
  wordId: string;
  apiLangName: SupportedLang;
  builtInSlugs: string[];
}

export function WordDetailResolver({ categoryId, subcategoryId, wordId, apiLangName, builtInSlugs }: WordDetailResolverProps) {
  const { t } = useCourseLanguage();
  const { customWords, applyOverride } = useCustomWords(categoryId, subcategoryId);
  const [apiWord, setApiWord] = useState<WordDetail | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!builtInSlugs.includes(wordId)) return;
    setFetching(true);
    fetch(`${BACKEND_BASE_URL}/api/word-detail?lang=${encodeURIComponent(apiLangName)}&section=${DEFAULT_SECTION}&category=${encodeURIComponent(categoryId)}&subcategory=${encodeURIComponent(subcategoryId)}&wordId=${encodeURIComponent(wordId)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setApiWord(wordDetailFromApi(wordId, data, apiLangName)); })
      .catch(err => console.error(err))
      .finally(() => setFetching(false));
  }, [wordId, builtInSlugs, apiLangName, categoryId, subcategoryId]);

  if (fetching) return <div className="px-4 text-sm opacity-50">Syncing word details...</div>;

  const raw = builtInSlugs.includes(wordId) ? apiWord : customWords.find(w => w.id === wordId);
  if (!raw) return <div className="px-4 text-sm">{t("notFound")}</div>;

  const word = applyOverride(raw);
  const isCustom = customWords.some(w => w.id === wordId);
  return <WordDetailView categoryId={categoryId} subcategoryId={subcategoryId} word={word} isCustom={isCustom} />;
}