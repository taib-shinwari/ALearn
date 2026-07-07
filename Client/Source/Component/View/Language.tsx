import { useQuery } from "@tanstack/react-query";
import { CardButton } from "@/Component/UI/card-button";
import { useApp } from "@/Context/App";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { DictionaryBrowseView } from "@/Component/View/Dictionary";

// FIX: Localized type boundaries to prevent backend cross-contamination
export type SupportedLang = "Dutch" | "English" | "Arabic" | "Pashto";

// FIX: Pull directly from the build-time injected environment variables
const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://solid-xylophone-x5j776p4xrx636vrp-4000.app.github.dev";

async function fetchLanguageCorpusFromBackend(lang: SupportedLang) {
  const response = await fetch(`${BACKEND_BASE_URL}/api/language-corpus?lang=${lang}`);
  if (!response.ok) throw new Error(`Failed to load language corpus for ${lang}`);
  return response.json();
}

/* ─────────────────────────── LanguageRootView ─────────────────────────── */

export function LanguageRootView({ targetLang, targetLangCode }: { targetLang: SupportedLang; targetLangCode: string }) {
  const { i18nLang } = useCourseLanguage(); // i18nLang: full name
  const { pushBrowse } = useApp();

  const { data: corpus } = useQuery({
    queryKey: ["languageCorpusBackend", i18nLang],
    queryFn: () => fetchLanguageCorpusFromBackend(i18nLang),
    staleTime: 1000 * 60 * 30,
  });

  const labels = corpus?.labels ?? {};
  const lessonsText    = labels["lessons"] || labels["lesson"] || "Lessons";
  const dictionaryText = labels["dictionary"] || "Dictionary";

  return (
    <div className="grid grid-cols-2 gap-3 w-full px-4">
      <CardButton
        onClick={() => pushBrowse("lessons")}
        className="min-h-[64px] py-3 flex items-center justify-center text-center"
      >
        <span className="font-semibold">{lessonsText}</span>
      </CardButton>

      <CardButton
        onClick={() => pushBrowse("dictionary")}
        className="min-h-[64px] py-3 flex items-center justify-center text-center"
      >
        <span className="font-semibold">{dictionaryText}</span>
      </CardButton>
    </div>
  );
}

export function LanguageDictionaryView({ targetLang, targetLangCode }: { targetLang: SupportedLang; targetLangCode: string }) {
  return <DictionaryBrowseView targetLang={targetLang} targetLangCode={targetLangCode} />;
}