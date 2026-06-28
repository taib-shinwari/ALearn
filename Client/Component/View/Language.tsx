import { CardButton } from "Client/Component/UI/card-button";
import { useApp } from "Client/Context/App";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { DictionaryBrowseView } from "Client/Component/View/Dictionary";
import { getLabel, type SupportedLang } from "Server/API/Language";

/* ─────────────────────────── LanguageRootView ─────────────────────────── */

export function LanguageRootView({ targetLang, targetLangCode }: { targetLang: SupportedLang; targetLangCode: string }) {
  const { i18nLang } = useCourseLanguage(); // i18nLang: full name
  const { pushBrowse } = useApp();

  // Dynamically fetch labels straight from your new Language.ts i18n store
  // with safe string fallbacks if the key isn't loaded yet
  const lessonsText    = getLabel(i18nLang, "lessons") || getLabel(i18nLang, "lesson") || "Lessons";
  const dictionaryText = getLabel(i18nLang, "dictionary") || "Dictionary";

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