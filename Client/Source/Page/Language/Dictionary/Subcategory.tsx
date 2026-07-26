// Source/Component/Dictionary/DictionarySubcategory.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/Component/UI/Button";
import { useCustomCollections } from "@/Hook/useCustomCollections";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { BACKEND_BASE_URL, DEFAULT_SECTION, SupportedLang } from "@/Library/Language";

export default function DictionarySubcategory() {
  const { langName, categoryId } = useParams<{ langName: string; categoryId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useCourseLanguage();

  // Read search term directly from URL search params synced with HeaderSearch
  const searchQuery = searchParams.get("search") || "";
  
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

  const queryLower = searchQuery.toLowerCase().trim();

  // Filter subcategories where the subcategory name OR any contained item matches the search input
  const filteredSubcategories = subcategoryKeys.filter((subId) => {
    if (!queryLower) return true;
    
    // Check if subcategory name matches
    const nameMatches = subId.toLowerCase().includes(queryLower);
    
    // Check if any word slug inside matches
    const wordSlugs = Object.keys(subcategoriesData[subId] || {});
    const wordMatches = wordSlugs.some((slug) => slug.toLowerCase().includes(queryLower));

    return nameMatches || wordMatches;
  });

  const handleSubcategoryClick = (subId: string) => {
    navigate(`/Language/${langName}/Dictionary/Vocabulary/${categoryId}/${subId}`);
  };

  return (
    <div className="px-4 w-full">
      {filteredSubcategories.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No items match your search "{searchQuery}"
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredSubcategories.map((subId) => {
            const wordSlugs = Object.keys(subcategoriesData[subId] || {});
            
            // Count matching items if searching, or return total count
            const matchingCount = queryLower 
              ? wordSlugs.filter(slug => slug.toLowerCase().includes(queryLower)).length
              : wordSlugs.length;

            return (
              <Button
                key={subId}
                onClick={() => handleSubcategoryClick(subId)}
                className="min-h-[64px] py-3 text-base"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <span>{subId}</span>
                  <span className="text-xs font-normal border border-border bg-background text-foreground group-hover:border-foreground px-2 py-0.5 rounded-full transition-colors">
                    {matchingCount > 0 ? matchingCount : wordSlugs.length}
                  </span>
                </div>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}