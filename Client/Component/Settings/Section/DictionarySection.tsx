import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "Client/Context/App";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { useMarkedWords } from "Client/Hook/useMarkedWords";
import { Button } from "Client/Component/UI/button";
import { Container } from "Client/Component/UI/container";
import { TitleBar } from "Client/Component/UI/title-bar";

// Fully localized layout map mapping supported target track values
const LANG_LABELS: Record<string, string> = {
  nl: "Nederlands",
  en: "English",
  ar: "العربية",
  ps: "Pashto"
};

/** Lists marked words grouped by language track using new unified dictionary routing blocks. */
export function DictionarySection() {
  const { map } = useMarkedWords();
  const { setBrowsePath } = useApp();
  const { t } = useCourseLanguage();
  const navigate = useNavigate();

  // Extract all language codes containing marked items dynamically
  const langs = useMemo(
    () => Object.keys(map).filter(l => (map[l] || []).length > 0),
    [map],
  );

  const [activeLang, setActiveLang] = useState<string | null>(null);
  const currentLang = activeLang && map[activeLang] ? activeLang : (langs[0] || null);

  if (langs.length === 0 || !currentLang) {
    return (
      <Container>
        <p className="text-sm opacity-70">{t("noMarkedWords") || "No marked words found."}</p>
      </Container>
    );
  }

  // Expecting item schemas following the dynamic API structure: { id, text, catId, subId }
  const items = map[currentLang] || [];

  const handleWordClick = (catId: string, subId: string, wordSlug: string) => {
    // Aligns with Layout breadcrumb parsing logic for dynamic text slugs
    setBrowsePath(["language", currentLang, "_marked", catId, subId, wordSlug]);
    navigate("/");
  };

  return (
    <div className="space-y-3">
      {/* Language Switch Tabs */}
      <div className="flex flex-wrap gap-2">
        {langs.map(l => (
          <Button 
            key={l} 
            active={l === currentLang} 
            onClick={() => setActiveLang(l)}
          >
            {LANG_LABELS[l] || l.toUpperCase()}
          </Button>
        ))}
      </div>

      <TitleBar>{t("marked") || "Marked Items"}</TitleBar>

      {/* Target Items List */}
      <div className="space-y-2">
        {items.map(item => {
          if (!item || !item.id) return null;
          
          // Use inline text descriptors provided by hook context, fallback to standard parsing keys
          const displayName = item.text || item.id;
          const targetCat = item.catId || "vocabulary";
          const targetSub = item.subId || "general";

          return (
            <button
              key={item.id}
              onClick={() => handleWordClick(targetCat, targetSub, item.id)}
              className="w-full text-left focus:outline-none block group"
            >
              <Container className="group-hover:bg-foreground group-hover:text-background transition-colors duration-150 ease-in-out">
                <span className="text-sm font-medium">{displayName}</span>
              </Container>
            </button>
          );
        })}
      </div>
    </div>
  );
}