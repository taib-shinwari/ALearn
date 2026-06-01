import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const { setBrowsePath } = useApp();
  const { t } = useCourseLanguage();
  const navigate = useNavigate();
  const langs = useMemo(
    () => Object.keys(map).filter(l => (map[l] || []).length > 0),
    [map],
  );
  const [activeLang, setActiveLang] = useState<string | null>(langs[0] || null);

  if (langs.length === 0) {
    return (
      <Container>
        <p className="text-sm">{t("noMarkedWords")}</p>
      </Container>
    );
  }

  const lang = activeLang && map[activeLang] ? activeLang : langs[0];
  const ids = map[lang] || [];

  const openWord = (categoryId: string, subId: string, wordId: string) => {
    setBrowsePath(["language", lang, categoryId, subId, wordId]);
    navigate("/");
  };

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
          let target: { catId: string; subId: string } | null = null;
          for (const cat of categories) {
            const sub = cat.subcategories.find(s => s.words.some(x => x.id === id));
            if (sub) { target = { catId: cat.id, subId: sub.id }; break; }
          }
          return (
            <button
              key={id}
              onClick={() => target && openWord(target.catId, target.subId, id)}
              className="w-full text-left"
            >
              <Container className="hover:bg-foreground hover:text-background transition-colors">
                <span className="text-sm font-medium">{text}</span>
              </Container>
            </button>
          );
        })}
      </div>
    </div>
  );
}
