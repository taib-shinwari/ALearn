import { useApp } from "Client/Context/App";
import { getLabels } from "Server/API/Language";
import type { I18nLang, SupportedLang } from "Server/API/Language";

/**
 * Bridges the two language vocabularies used in the app:
 *
 *  - Persisted state (`interfaceLanguage`, `learningLanguage`) uses the
 *    legacy short codes "en" | "nl" | "ar" (and sometimes "ps").
 *  - The Server/API/Language module uses the full names
 *    "English" | "Dutch" | "Arabic" (and "Pashto" for SupportedLang).
 *
 * `uiLang`     — short code, what most UI components compare against.
 * `i18nLang`   — full name, what label/getLabel APIs require.
 * `targetLang` — short code learner-selected.
 * `courseLang` — alias of targetLang.
 * `apiLang`    — full SupportedLang name for Server/API/Language calls.
 */
const SHORT_TO_I18N: Record<string, I18nLang> = {
  en: "English",
  nl: "Dutch",
  ar: "Arabic",
};

const SHORT_TO_SUPPORTED: Record<string, SupportedLang> = {
  en: "English",
  nl: "Dutch",
  ar: "Arabic",
  ps: "Pashto",
};

export type ShortLang = "en" | "nl" | "ar" | "ps";

export function useCourseLanguage() {
  const { interfaceLanguage, learningLanguage } = useApp();

  // Keep the short-code form for UI comparisons (`uiLang === "nl"`).
  const uiLang: string = interfaceLanguage || "en";
  const targetLang: string = learningLanguage || "nl";
  const courseLang: string = targetLang;

  const i18nLang: I18nLang = SHORT_TO_I18N[uiLang] ?? "English";
  const apiLang:  SupportedLang = SHORT_TO_SUPPORTED[targetLang] ?? "Dutch";

  const t = (key: string): string => {
    const labels         = getLabels(i18nLang);
    const fallbackLabels = getLabels("English");
    return labels?.[key] ?? fallbackLabels?.[key] ?? key;
  };

  return { uiLang, i18nLang, targetLang, courseLang, apiLang, t };
}
