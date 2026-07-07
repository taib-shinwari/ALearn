import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/Context/App";

// FIX: Localized type boundaries to prevent backend cross-contamination
export type SupportedLang = "Dutch" | "English" | "Arabic" | "Pashto";
export type I18nLang = "Dutch" | "English" | "Arabic";
export type ShortLang = "en" | "nl" | "ar" | "ps";

// FIX: Pull directly from the build-time injected environment variables
const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://solid-xylophone-x5j776p4xrx636vrp-4000.app.github.dev";

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

async function fetchLanguageCorpusFromBackend(lang: SupportedLang) {
  const response = await fetch(`${BACKEND_BASE_URL}/api/language-corpus?lang=${lang}`);
  if (!response.ok) throw new Error(`Failed to load language corpus for ${lang}`);
  return response.json();
}

export function useCourseLanguage() {
  const { interfaceLanguage, learningLanguage } = useApp();

  const uiLang: string = interfaceLanguage || "en";
  const targetLang: string = learningLanguage || "nl";
  const courseLang: string = targetLang;

  const i18nLang: I18nLang = SHORT_TO_I18N[uiLang] ?? "English";
  const apiLang: SupportedLang = SHORT_TO_SUPPORTED[targetLang] ?? "Dutch";

  const { data: corpus } = useQuery({
    queryKey: ["languageCorpusBackend", i18nLang],
    queryFn: () => fetchLanguageCorpusFromBackend(i18nLang),
    staleTime: 1000 * 60 * 30,
  });

  const { data: fallbackCorpus } = useQuery({
    queryKey: ["languageCorpusBackend", "English"],
    queryFn: () => fetchLanguageCorpusFromBackend("English"),
    staleTime: 1000 * 60 * 30,
    enabled: i18nLang !== "English",
  });

  const t = (key: string): string => {
    const labels = corpus?.labels ?? {};
    const fallbackLabels = (i18nLang === "English" ? corpus?.labels : fallbackCorpus?.labels) ?? {};
    return labels[key] ?? fallbackLabels[key] ?? key;
  };

  return { uiLang, i18nLang, targetLang, courseLang, apiLang, t };
}