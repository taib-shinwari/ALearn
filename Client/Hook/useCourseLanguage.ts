import { useApp } from "Client/Context/App";
import { getLabels } from "Server/API/Language";
import type { I18nLang, SupportedLang } from "Server/API/Language";

/**
 * - uiLang:    I18nLang — language for UI labels ("Dutch" | "English" | "Arabic")
 * - targetLang: SupportedLang — the language being learned
 * - courseLang: SupportedLang — used for word lookups (same as targetLang)
 */
export function useCourseLanguage() {
  const { interfaceLanguage, learningLanguage } = useApp();

  const uiLang     = (interfaceLanguage || "English") as I18nLang;
  const targetLang = (learningLanguage  || "Dutch")   as SupportedLang;
  const courseLang = targetLang;

  const t = (key: string): string => {
    const labels         = getLabels(uiLang);
    const fallbackLabels = getLabels("English");
    return labels?.[key] ?? fallbackLabels?.[key] ?? key;
  };

  return { uiLang, targetLang, courseLang, t };
}