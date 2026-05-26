import { useApp } from "@/context/AppContext";
import { uiLabels, Lang, WordLang } from "@/data/courseData";

/**
 * - uiLang: language for UI labels (nl/en/ar)
 * - targetLang: the language being learned (may be ar for Quranic Arabic)
 * - courseLang: WordLang used for word lookups (falls back to en when ar)
 */
export function useCourseLanguage() {
  const { interfaceLanguage, learningLanguage } = useApp();

  const uiLang = (interfaceLanguage || "en") as Lang;
  const targetLang = (learningLanguage || "nl") as Lang;
  // Word lookups now support "ar" directly; consumers should use getWordText
  // which falls back to English when Arabic content is missing.
  const courseLang = targetLang as WordLang;

  const t = (key: string): string => {
    return uiLabels[uiLang]?.[key] || uiLabels["en"]?.[key] || key;
  };

  return { uiLang, targetLang, courseLang, t };
}

