import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useMarkedWords } from "@/hooks/useMarkedWords";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { TitleBar } from "@/components/ui/title-bar";
import { categories, getWordById, WordLang } from "@/data/courseData";

const LANG_LABELS: Record<string, string> = {
  nl: "Nederlands",
  en: "English",
};

/** Lists marked words grouped by language. */
export function DictionarySection() {
  const { map } = useMarkedWords();
  const { selectedConcept } = useApp();
  const { t } = useCourseLanguage();
  const langs = useMemo(
    () => Object.keys(map).filter(l => (map[l] || []).length > 0),
    [map],
  );
  const [activeLang, setActiveLang] = useState<string | null>(langs[0] || null);

  const conceptPrefix = selectedConcept ? `/${selectedConcept}` : "/home";

  if (langs.length === 0) {
    return (
      <Container>
        <p className="text-sm">{t("noMarkedWords")}</p>
      </Container>
    );
  }

  const lang = activeLang && map[activeLang] ? activeLang : langs[0];
  const ids = map[lang] || [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {langs.map(l => (
          <Button key={l} active={l === lang} onClick={() => setActiveLang(l)}>
            {LANG_LABELS[l] || l}
          </Button>
        ))}
      </div>
      <TitleBar>{t("marked")}</TitleBar>
      <div className="space-y-2">
        {ids.map(id => {
          const w = getWordById(id);
          if (!w) return null;
          const text = w[lang as WordLang]?.word || w.en.word;
          let to = "#";
          for (const cat of categories) {
            const sub = cat.subcategories.find(s => s.words.some(x => x.id === id));
            if (sub) { to = `${conceptPrefix}/${cat.id}/${sub.id}/${id}`; break; }
          }
          return (
            <Link key={id} to={to}>
              <Container className="hover:bg-foreground hover:text-background transition-colors">
                <span className="text-sm font-medium">{text}</span>
              </Container>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
