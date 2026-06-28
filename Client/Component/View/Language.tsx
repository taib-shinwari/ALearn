import { useState } from "react";
import { CardButton } from "Client/Component/UI/card-button";
import { useApp } from "Client/Context/App";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { DictionaryBrowseView } from "Client/Component/View/Dictionary";
import { getLabel, type I18nLang, type SupportedLang } from "Server/API/Language";

/* ─────────────────────────── LanguageRootView ─────────────────────────── */

export function LanguageRootView({ targetLang }: { targetLang: SupportedLang }) {
  const { uiLang, i18nLang } = useCourseLanguage(); // uiLang: short code, i18nLang: full name
  const { pushBrowse } = useApp();
  const [view, setView] = useState<"menu" | "dictionary">("menu");

  // Dynamically fetch labels straight from your new Language.ts i18n store
  // with safe string fallbacks if the key isn't loaded yet
  const lessonsText    = getLabel(i18nLang, "lessons") || getLabel(i18nLang, "lesson") || "Lessons";
  const dictionaryText = getLabel(i18nLang, "dictionary") || "Dictionary";

  if (view === "menu") {
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        {/* ── Lessons Button ── */}
        <CardButton
          onClick={() => pushBrowse("lessons")}
          className="min-h-[64px] py-3 flex items-center justify-center text-center"
        >
          <span className="font-semibold">{lessonsText}</span>
        </CardButton>

        {/* ── Dictionary Button ── */}
        <CardButton
          onClick={() => {
            // Option A: If your app routing manages sub-views globally via paths:
            // pushBrowse("dictionary");
            
            // Option B: Keep local view switching if DictionaryBrowseView handles state internally:
            setView("dictionary");
          }}
          className="min-h-[64px] py-3 flex items-center justify-center text-center"
        >
          <span className="font-semibold">{dictionaryText}</span>
        </CardButton>
      </div>
    );
  }

  return <DictionaryBrowseView targetLang={targetLang} />;
}