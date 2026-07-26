import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/Component/UI/Button";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { DEFAULT_SECTION, BACKEND_BASE_URL, SupportedLang } from "@/Library/Language";

export default function DictionaryCategory() {
  const { langName } = useParams<{ langName: string }>();
  const navigate = useNavigate();
  const { t } = useCourseLanguage();
  
  const activeLangName = (langName || "English") as SupportedLang;
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND_BASE_URL}/api/language-corpus?lang=${encodeURIComponent(activeLangName)}`)
      .then(res => res.ok ? res.json() : null)
      .then(corpus => {
        if (corpus?.vocabularyGrammar?.[DEFAULT_SECTION]) {
          // Extracts top level category keys like ["Adjective", "Verbs", etc.]
          setCategories(Object.keys(corpus.vocabularyGrammar[DEFAULT_SECTION]));
        } else {
          setCategories([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch dictionary categories safely:", err);
        setCategories([]);
        setLoading(false);
      });
  }, [activeLangName]);

  if (loading) {
    return <div className="p-4 text-sm">Loading...</div>;
  }

  return (
    <div className="px-4 w-full">
      <div className="grid grid-cols-2 gap-3">
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => navigate(`/Language/${activeLangName}/Dictionary/Vocabulary/${category}`)}
            className="min-h-[64px] py-3 text-base"
          >
            <span className="font-semibold">{t(category) || category}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}