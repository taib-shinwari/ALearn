import { WordLang } from "@/data/courseData";

const VOICE_LOCALE: Record<WordLang, string> = {
  nl: "nl-NL",
  en: "en-US",
};

/** Speak the given text using the browser's SpeechSynthesis API. */
export function speak(text: string, lang: WordLang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = VOICE_LOCALE[lang] || "en-US";
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  } catch {
    /* no-op */
  }
}

export function isSpeechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
