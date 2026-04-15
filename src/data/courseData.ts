// Dutch language course data

export interface WordDetail {
  id: string;
  word: string;
  translation: string;
  definitie?: string;
  meervoud?: string;
  verkleinwoord?: string;
  vervoeging?: Record<string, string>; // e.g. { "ik": "loop", "jij": "loopt", ... }
}

export interface Subcategory {
  id: string;
  name: string;
  words: WordDetail[];
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

// The order of words here defines the linear learning order for global practice
export const globalLearningOrder: string[] = [
  // Greetings first
  "hallo", "goedemorgen", "goedemiddag", "goedenavond", "tot-ziens", "doei",
  // Then animals
  "hond", "kat", "paard", "vogel",
  // Then people
  "man", "vrouw", "kind", "baby",
  // Then vegetables
  "wortel", "aardappel", "ui", "tomaat",
  // Then fruit
  "appel", "banaan", "aardbei", "druif",
  // Then adjectives
  "groot", "klein", "mooi", "lelijk", "snel", "langzaam",
  // Then verbs
  "lopen", "eten", "drinken", "slapen", "lezen", "schrijven",
];

export const categories: Category[] = [
  {
    id: "zelfstandig-naamwoord",
    name: "Zelfstandige Naamwoord",
    subcategories: [
      {
        id: "begroeting",
        name: "Begroeting",
        words: [
          { id: "hallo", word: "Hallo", translation: "Hello", definitie: "Een informele begroeting." },
          { id: "goedemorgen", word: "Goedemorgen", translation: "Good morning", definitie: "Begroeting gebruikt in de ochtend." },
          { id: "goedemiddag", word: "Goedemiddag", translation: "Good afternoon", definitie: "Begroeting gebruikt in de middag." },
          { id: "goedenavond", word: "Goedenavond", translation: "Good evening", definitie: "Begroeting gebruikt in de avond." },
          { id: "tot-ziens", word: "Tot ziens", translation: "Goodbye", definitie: "Formeel afscheid." },
          { id: "doei", word: "Doei", translation: "Bye", definitie: "Informeel afscheid." },
        ],
      },
      {
        id: "dier",
        name: "Dier",
        words: [
          { id: "hond", word: "De Hond", translation: "The Dog", definitie: "Een huisdier.", meervoud: "Honden", verkleinwoord: "Hondje" },
          { id: "kat", word: "De Kat", translation: "The Cat", definitie: "Een huisdier.", meervoud: "Katten", verkleinwoord: "Katje" },
          { id: "paard", word: "Het Paard", translation: "The Horse", definitie: "Een groot dier.", meervoud: "Paarden", verkleinwoord: "Paardje" },
          { id: "vogel", word: "De Vogel", translation: "The Bird", definitie: "Een dier dat kan vliegen.", meervoud: "Vogels", verkleinwoord: "Vogeltje" },
        ],
      },
      {
        id: "mens",
        name: "Mens",
        words: [
          { id: "man", word: "De Man", translation: "The Man", definitie: "Een volwassen mannelijk persoon.", meervoud: "Mannen", verkleinwoord: "Mannetje" },
          { id: "vrouw", word: "De Vrouw", translation: "The Woman", definitie: "Een volwassen vrouwelijk persoon.", meervoud: "Vrouwen", verkleinwoord: "Vrouwtje" },
          { id: "kind", word: "Het Kind", translation: "The Child", definitie: "Een jong persoon.", meervoud: "Kinderen", verkleinwoord: "Kindje" },
          { id: "baby", word: "De Baby", translation: "The Baby", definitie: "Een heel jong kind.", meervoud: "Baby's", verkleinwoord: "Babytje" },
        ],
      },
      {
        id: "groente",
        name: "Groente",
        words: [
          { id: "wortel", word: "De Wortel", translation: "The Carrot", definitie: "Een oranje groente.", meervoud: "Wortels", verkleinwoord: "Worteltje" },
          { id: "aardappel", word: "De Aardappel", translation: "The Potato", definitie: "Een veelgebruikte groente.", meervoud: "Aardappelen", verkleinwoord: "Aardappeltje" },
          { id: "ui", word: "De Ui", translation: "The Onion", definitie: "Een groente met lagen.", meervoud: "Uien", verkleinwoord: "Uitje" },
          { id: "tomaat", word: "De Tomaat", translation: "The Tomato", definitie: "Een rode groente/vrucht.", meervoud: "Tomaten", verkleinwoord: "Tomaatje" },
        ],
      },
      {
        id: "fruit",
        name: "Fruit",
        words: [
          { id: "appel", word: "De Appel", translation: "The Apple", definitie: "Een populaire vrucht.", meervoud: "Appels", verkleinwoord: "Appeltje" },
          { id: "banaan", word: "De Banaan", translation: "The Banana", definitie: "Een gele vrucht.", meervoud: "Bananen", verkleinwoord: "Banaantje" },
          { id: "aardbei", word: "De Aardbei", translation: "The Strawberry", definitie: "Een rode, zoete vrucht.", meervoud: "Aardbeien", verkleinwoord: "Aardbeitje" },
          { id: "druif", word: "De Druif", translation: "The Grape", definitie: "Een kleine vrucht in trossen.", meervoud: "Druiven", verkleinwoord: "Druifje" },
        ],
      },
    ],
  },
  {
    id: "bijvoeglijk-naamwoord",
    name: "Bijvoeglijke Naamwoord",
    subcategories: [
      {
        id: "beschrijving",
        name: "Beschrijving",
        words: [
          { id: "groot", word: "Groot", translation: "Big/Large", definitie: "Van grote omvang." },
          { id: "klein", word: "Klein", translation: "Small", definitie: "Van kleine omvang.", verkleinwoord: "Kleintje" },
          { id: "mooi", word: "Mooi", translation: "Beautiful", definitie: "Aantrekkelijk om te zien." },
          { id: "lelijk", word: "Lelijk", translation: "Ugly", definitie: "Niet aantrekkelijk om te zien." },
          { id: "snel", word: "Snel", translation: "Fast", definitie: "Met grote snelheid." },
          { id: "langzaam", word: "Langzaam", translation: "Slow", definitie: "Met lage snelheid." },
        ],
      },
    ],
  },
  {
    id: "werkwoord",
    name: "Werkwoord",
    subcategories: [
      {
        id: "dagelijkse-acties",
        name: "Dagelijkse Acties",
        words: [
          {
            id: "lopen", word: "Lopen", translation: "To Walk/Run", definitie: "Zich voortbewegen te voet.",
            vervoeging: { "ik": "loop", "jij": "loopt", "hij/zij": "loopt", "wij": "lopen", "jullie": "lopen", "zij (mv)": "lopen" },
          },
          {
            id: "eten", word: "Eten", translation: "To Eat", definitie: "Voedsel consumeren.",
            vervoeging: { "ik": "eet", "jij": "eet", "hij/zij": "eet", "wij": "eten", "jullie": "eten", "zij (mv)": "eten" },
          },
          {
            id: "drinken", word: "Drinken", translation: "To Drink", definitie: "Vloeistof consumeren.",
            vervoeging: { "ik": "drink", "jij": "drinkt", "hij/zij": "drinkt", "wij": "drinken", "jullie": "drinken", "zij (mv)": "drinken" },
          },
          {
            id: "slapen", word: "Slapen", translation: "To Sleep", definitie: "Rusten met gesloten ogen.",
            vervoeging: { "ik": "slaap", "jij": "slaapt", "hij/zij": "slaapt", "wij": "slapen", "jullie": "slapen", "zij (mv)": "slapen" },
          },
          {
            id: "lezen", word: "Lezen", translation: "To Read", definitie: "Tekst interpreteren.",
            vervoeging: { "ik": "lees", "jij": "leest", "hij/zij": "leest", "wij": "lezen", "jullie": "lezen", "zij (mv)": "lezen" },
          },
          {
            id: "schrijven", word: "Schrijven", translation: "To Write", definitie: "Tekst produceren.",
            vervoeging: { "ik": "schrijf", "jij": "schrijft", "hij/zij": "schrijft", "wij": "schrijven", "jullie": "schrijven", "zij (mv)": "schrijven" },
          },
        ],
      },
    ],
  },
];

// Helper functions
export function getAllWords(): WordDetail[] {
  const words: WordDetail[] = [];
  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      words.push(...sub.words);
    }
  }
  return words;
}

export function getWordsForCategory(categoryId: string): WordDetail[] {
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) return [];
  const words: WordDetail[] = [];
  for (const sub of cat.subcategories) {
    words.push(...sub.words);
  }
  return words;
}

export function getWordsForSubcategory(subcategoryId: string): WordDetail[] {
  for (const cat of categories) {
    const sub = cat.subcategories.find(s => s.id === subcategoryId);
    if (sub) return sub.words;
  }
  return [];
}

export function getWordById(wordId: string): WordDetail | undefined {
  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      const word = sub.words.find(w => w.id === wordId);
      if (word) return word;
    }
  }
  return undefined;
}

export function getCategoryForSubcategory(subcategoryId: string): Category | undefined {
  return categories.find(c => c.subcategories.some(s => s.id === subcategoryId));
}
