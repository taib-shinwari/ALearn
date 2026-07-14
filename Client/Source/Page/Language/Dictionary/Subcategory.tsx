import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CardButton } from "@/Component/UI/card-button";
import { useCustomCollections } from "@/Hook/useCustomCollections";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { BACKEND_BASE_URL, DEFAULT_SECTION, SupportedLang } from "@/Library/Language";

export default function DictionarySubcategory() {
  const { langName, categoryId } = useParams<{ langName: string; categoryId: string }>();
  const navigate = useNavigate();
  const { t } = useCourseLanguage();
  
  const activeLangName = (langName || "English") as SupportedLang;
  const { collections: customCategories } = useCustomCollections(`__lang_${activeLangName}`);
  const customCategory = customCategories.find(c => c.id === categoryId);

  const [subcategoriesData, setSubcategoriesData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND_BASE_URL}/api/language-corpus?lang=${encodeURIComponent(activeLangName)}`)
      .then(res => res.ok ? res.json() : null)
      .then(corpus => {
        if (corpus?.vocabularyGrammar?.[DEFAULT_SECTION]?.[categoryId || ""]) {
          setSubcategoriesData(corpus.vocabularyGrammar[DEFAULT_SECTION][categoryId || ""]);
        } else {
          setSubcategoriesData({});
        }
        setLoading(false);
      })
      .catch(() => {
        setSubcategoriesData({});
        setLoading(false);
      });
  }, [activeLangName, categoryId]);

  if (loading) {
    return <div className="p-4 text-sm">Loading...</div>;
  }

  const subcategoryKeys = Object.keys(subcategoriesData);

  if (subcategoryKeys.length === 0 && !customCategory) {
    return <div className="px-4 text-sm">{t("notFound")}</div>;
  }

  const handleSubcategoryClick = (subId: string) => {
    navigate(`/Language/${langName}/Dictionary/Vocabulary/${categoryId}/${subId}`);
  };

  return (
    <div className="px-4 w-full">
      <div className="grid grid-cols-2 gap-3">
        {subcategoryKeys.map((subId) => {
          const wordSlugs = Object.keys(subcategoriesData[subId] || {});
          
          return (
            <CardButton
              key={subId}
              onClick={() => handleSubcategoryClick(subId)}
              className="rounded-full bg-background border border-border text-foreground p-4 text-center transition-colors duration-200 hover:bg-muted/60 hover:border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none min-h-[64px] py-3 flex items-center justify-center text-base"
            >
              <div className="flex items-center gap-2 font-semibold">
                <span>{subId}</span>
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {wordSlugs.length}
                </span>
              </div>
            </CardButton>
          );
        })}
      </div>
    </div>
  );
}