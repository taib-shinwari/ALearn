import { useApp } from "@/context/AppContext";
import { uiLabels } from "@/data/courseData";

/**
 * Returns the interface language (fromLang) and learning language (toLang) 
 * for the active course, plus a label helper.
 */
export function useCourseLanguage() {
  const { interfaceLanguage, learningLanguage } = useApp();

  // interfaceLanguage = the language the user speaks (fromLang)
  // learningLanguage = the language they're learning (toLang)
  const uiLang = (interfaceLanguage || "en") as "nl" | "en";
  const courseLang = (learningLanguage || "nl") as "nl" | "en";

  const t = (key: string): string => {
    return uiLabels[uiLang]?.[key] || uiLabels["en"]?.[key] || key;
  };

  return { uiLang, courseLang, t };
}
