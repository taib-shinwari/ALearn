// Shared client-side type for the short language code used by speech,
// word media, and the alphabet activities.
//
// "nl" → Dutch, "en" → English, "ar" → Arabic.
//
// We deliberately keep this separate from Server/API/Language.ts'
// SupportedLang (which uses full names) because these short codes drive
// browser-facing APIs (BCP-47 voice locales, wiki subdomains, etc.).
export type WordLang = "nl" | "en" | "ar";

// Legacy alias used by Alphabet activities.
export type Lang = WordLang;
