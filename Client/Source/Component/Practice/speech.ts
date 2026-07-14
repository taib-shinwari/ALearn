import type { WordLang } from "@/Library/wordTypes";

const VOICE_LOCALE: Record<WordLang, string> = {
  nl: "nl-NL",
  en: "en-US",
  ar: "ar-SA",
};

// Acceptable BCP-47 prefixes per language (so we can fall back to e.g. nl-BE).
const LANG_PREFIX: Record<WordLang, string> = {
  nl: "nl",
  en: "en",
  ar: "ar",
};

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]); return;
    }
    const tryGet = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length) { cachedVoices = v; resolve(v); return true; }
      return false;
    };
    if (tryGet()) return;
    // Some browsers populate voices asynchronously.
    let attempts = 0;
    const id = window.setInterval(() => {
      attempts++;
      if (tryGet() || attempts > 20) {
        window.clearInterval(id);
        resolve(cachedVoices);
      }
    }, 100);
    window.speechSynthesis.onvoiceschanged = () => { tryGet(); };
  });
}

function pickVoice(lang: WordLang): SpeechSynthesisVoice | null {
  const target = VOICE_LOCALE[lang];
  const prefix = LANG_PREFIX[lang];
  // Exact match first, then prefix match.
  return (
    cachedVoices.find(v => v.lang === target) ||
    cachedVoices.find(v => v.lang?.toLowerCase().startsWith(prefix)) ||
    null
  );
}

/** Speak the given text using the browser's SpeechSynthesis API. */
export function speak(text: string, lang: WordLang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (!text || !text.trim()) return;
  // Strip leading definite articles & punctuation that confuse TTS engines
  // (e.g. "De Hond" → "Hond" reads cleaner on some Dutch voices).
  const cleaned = text.replace(/^\s*(de|het|een|the|a|an)\s+/i, "").trim();
  const utterText = cleaned || text;

  const doSpeak = () => {
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(utterText);
      utter.lang = VOICE_LOCALE[lang] || "en-US";
      const voice = pickVoice(lang);
      if (voice) utter.voice = voice;
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    } catch { /* no-op */ }
  };

  if (cachedVoices.length === 0) {
    loadVoices().then(doSpeak);
  } else {
    doSpeak();
  }
}

export function isSpeechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Warm voice cache on module load (no-op on SSR).
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadVoices();
}
