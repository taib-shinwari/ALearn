import type { WordDetail } from "@/Hook/useCustomWords";

export type SupportedLang = "Dutch" | "English" | "Arabic" | "Pashto";
export type SectionType = "Vocabulary" | "Grammar";
export type WordEntry = string[] | Record<string, any>[];

// Maps URL parameter names directly back to internal language codes
export const MAP_NAME_TO_CODE: Record<string, string> = {
  Dutch: "nl",
  English: "en",
  Arabic: "ar",
  Pashto: "ps"
};

// Maps internal language codes to the human-readable full name used for routing
export const MAP_CODE_TO_NAME: Record<string, SupportedLang> = {
  nl: "Dutch",
  en: "English",
  ar: "Arabic",
  ps: "Pashto"
};

export const TARGET_LANGS = [
  { code: "nl", label: "Nederlands", name: "Dutch" },
  { code: "en", label: "English", name: "English" },
  { code: "ar", label: "العربية", name: "Arabic" },
];

export const EXTRA_LANGS = [
  { code: "ps", label: "پښتو (Pashto)", name: "Pashto", preview: true },
];

export const LANGUAGE_LABEL: Record<string, string> = { nl: "Taal", en: "Language", ar: "اللغة" };
export const CHESS_LABEL: Record<string, string> = { nl: "Schaken", en: "Chess", ar: "الشطرنج" };
export const DEFAULT_SECTION: SectionType = "Vocabulary";

// Reads directly from your .env configuration
export const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function entryText(entry: WordEntry | null | undefined, index: number): string | undefined {
  const value = Array.isArray(entry) ? entry[index] : undefined;
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return value.English ?? Object.values(value)[0];
  return undefined;
}

export function wordDetailFromApi(id: string, entry: WordEntry, lang: SupportedLang): WordDetail {
  const word = entryText(entry, 0) ?? id;
  const definition = entryText(entry, 1);
  const example = entryText(entry, 2);
  const base: WordDetail = { id, nl: { word: id }, en: { word: id } };

  if (lang === "Dutch") {
    base.nl = { word, definitie: definition, voorbeeld: example };
    base.en = { word: id, definition, example };
  } else if (lang === "Arabic") {
    base.en = { word: id, definition, example };
    base.ar = { word, definition, example };
  } else {
    base.en = { word, definition, example };
  }
  return base;
}