import { useApp } from "@/context/AppContext";
import { uiLabels, Lang, WordLang } from "@/data/courseData";

/**
 * Returns the interface language and learning language for the active course.
 * - uiLang: language for UI labels and category/subcategory names (can be nl/en/ar)
 * - courseLang: language being learned (only nl/en — words exist in those)
 */
export function useCourseLanguage() {
  const { interfaceLanguage, learningLanguage } = useApp();

  const uiLang = (interfaceLanguage || "en") as Lang;
  const courseLang = (learningLanguage || "nl") as WordLang;

  const t = (key: string): string => {
    return uiLabels[uiLang]?.[key] || uiLabels["en"]?.[key] || key;
  };

  return { uiLang, courseLang, t };
}
