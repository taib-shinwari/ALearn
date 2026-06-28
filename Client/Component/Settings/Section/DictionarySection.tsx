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
  ps: "Pashto",
};

/**
 * Lists marked word slugs grouped by language track. The underlying store
 * holds slug strings only (no cat/sub metadata), so this view shows the
 * slug names and lets the user open the broader dictionary view.
 */
export function DictionarySection() {
  const { map } = useMarkedWords();
  const { setBrowsePath } = useApp();
  const { t } = useCourseLanguage();
  const navigate = useNavigate();

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

  const slugs: string[] = map[currentLang] || [];

  const handleOpenDictionary = () => {
    setBrowsePath(["language", currentLang]);
    navigate("/");
  };

  return (
    <div className="space-y-3">
      {/* Language switch tabs */}
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

      {/* Marked slugs — display only, no per-item navigation since the */}
      {/* current store doesn't keep category/subcategory metadata. */}
      <div className="space-y-2">
        {slugs.map(slug => (
          <Container key={slug} className="py-2">
            <span className="text-sm font-medium">{slug}</span>
          </Container>
        ))}
      </div>

      <Button onClick={handleOpenDictionary} className="w-full" active>
        {t("openDictionary") || "Open dictionary"}
      </Button>
    </div>
  );
}
