// Arabic letter contextual forms (isolated / initial / medial / final).
// Source: standard Unicode Arabic Presentation Forms-B mappings.

export interface ArabicLetterForms {
  letter: string;
  name: string;
  isolated: string;
  initial: string;
  medial: string;
  final: string;
}

export const ARABIC_FORMS: ArabicLetterForms[] = [
  { letter: "ا", name: "alif",  isolated: "ﺍ", initial: "ﺍ", medial: "ﺎ", final: "ﺎ" },
  { letter: "ب", name: "ba",    isolated: "ﺏ", initial: "ﺑ", medial: "ﺒ", final: "ﺐ" },
  { letter: "ت", name: "ta",    isolated: "ﺕ", initial: "ﺗ", medial: "ﺘ", final: "ﺖ" },
  { letter: "ث", name: "tha",   isolated: "ﺙ", initial: "ﺛ", medial: "ﺜ", final: "ﺚ" },
  { letter: "ج", name: "jim",   isolated: "ﺝ", initial: "ﺟ", medial: "ﺠ", final: "ﺞ" },
  { letter: "ح", name: "ha",    isolated: "ﺡ", initial: "ﺣ", medial: "ﺤ", final: "ﺢ" },
  { letter: "خ", name: "kha",   isolated: "ﺥ", initial: "ﺧ", medial: "ﺨ", final: "ﺦ" },
  { letter: "د", name: "dal",   isolated: "ﺩ", initial: "ﺩ", medial: "ﺪ", final: "ﺪ" },
  { letter: "ذ", name: "dhal",  isolated: "ﺫ", initial: "ﺫ", medial: "ﺬ", final: "ﺬ" },
  { letter: "ر", name: "ra",    isolated: "ﺭ", initial: "ﺭ", medial: "ﺮ", final: "ﺮ" },
  { letter: "ز", name: "zay",   isolated: "ﺯ", initial: "ﺯ", medial: "ﺰ", final: "ﺰ" },
  { letter: "س", name: "sin",   isolated: "ﺱ", initial: "ﺳ", medial: "ﺴ", final: "ﺲ" },
  { letter: "ش", name: "shin",  isolated: "ﺵ", initial: "ﺷ", medial: "ﺸ", final: "ﺶ" },
  { letter: "ص", name: "sad",   isolated: "ﺹ", initial: "ﺻ", medial: "ﺼ", final: "ﺺ" },
  { letter: "ض", name: "dad",   isolated: "ﺽ", initial: "ﺿ", medial: "ﻀ", final: "ﺾ" },
  { letter: "ط", name: "ta",    isolated: "ﻁ", initial: "ﻃ", medial: "ﻄ", final: "ﻂ" },
  { letter: "ظ", name: "za",    isolated: "ﻅ", initial: "ﻇ", medial: "ﻈ", final: "ﻆ" },
  { letter: "ع", name: "ayn",   isolated: "ﻉ", initial: "ﻋ", medial: "ﻌ", final: "ﻊ" },
  { letter: "غ", name: "ghayn", isolated: "ﻍ", initial: "ﻏ", medial: "ﻐ", final: "ﻎ" },
  { letter: "ف", name: "fa",    isolated: "ﻑ", initial: "ﻓ", medial: "ﻔ", final: "ﻒ" },
  { letter: "ق", name: "qaf",   isolated: "ﻕ", initial: "ﻗ", medial: "ﻘ", final: "ﻖ" },
  { letter: "ك", name: "kaf",   isolated: "ﻙ", initial: "ﻛ", medial: "ﻜ", final: "ﻚ" },
  { letter: "ل", name: "lam",   isolated: "ﻝ", initial: "ﻟ", medial: "ﻠ", final: "ﻞ" },
  { letter: "م", name: "mim",   isolated: "ﻡ", initial: "ﻣ", medial: "ﻤ", final: "ﻢ" },
  { letter: "ن", name: "nun",   isolated: "ﻥ", initial: "ﻧ", medial: "ﻨ", final: "ﻦ" },
  { letter: "ه", name: "ha",    isolated: "ﻩ", initial: "ﻫ", medial: "ﻬ", final: "ﻪ" },
  { letter: "و", name: "waw",   isolated: "ﻭ", initial: "ﻭ", medial: "ﻮ", final: "ﻮ" },
  { letter: "ي", name: "ya",    isolated: "ﻱ", initial: "ﻳ", medial: "ﻴ", final: "ﻲ" },
  { letter: "ء", name: "hamza", isolated: "ﺀ", initial: "ﺀ", medial: "ﺀ", final: "ﺀ" },
];

export function findArabicForms(letter: string): ArabicLetterForms | undefined {
  return ARABIC_FORMS.find(f => f.letter === letter);
}
