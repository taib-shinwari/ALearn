// Bilingual course data (Dutch ↔ English)

export interface WordDetail {
  id: string;
  nl: {
    word: string;
    definitie?: string;
    meervoud?: string;
    verkleinwoord?: string;
    vervoeging?: Record<string, string>;
  };
  en: {
    word: string;
    definition?: string;
    plural?: string;
    diminutive?: string;
    conjugation?: Record<string, string>;
  };
}

export interface Subcategory {
  id: string;
  name: { nl: string; en: string };
  words: WordDetail[];
}

export interface Category {
  id: string;
  name: { nl: string; en: string };
  subcategories: Subcategory[];
}

// Labels for UI in each language
export const uiLabels: Record<string, Record<string, string>> = {
  nl: {
    practice: "Oefenen",
    back: "Terug",
    definition: "Definitie",
    plural: "Meervoud",
    diminutive: "Verkleinwoord",
    conjugation: "Vervoeging",
    categories: "Categorieën",
    words: "woorden",
    practiceThis: "Oefen dit",
    tapToFlip: "Tik om te draaien",
    whatDoes: "Wat betekent",
    correct: "Correct!",
    incorrect: "Fout",
    correctAnswer: "Juiste antwoord",
    check: "Controleer",
    skip: "Overslaan",
    continue: "Doorgaan",
    finish: "Klaar",
    noWords: "Geen woorden beschikbaar.",
    backToHome: "Terug naar home",
    yourCourses: "Jouw Cursussen",
    noCourses: "Nog geen cursussen. Tik op + om er een toe te voegen.",
    whatLangSpeak: "Welke taal spreek je?",
    selectConcept: "Selecteer concept",
    whatLearn: "Wat wil je leren?",
    alreadyAdded: "(al toegevoegd)",
    settings: "Instellingen",
    signOut: "Uitloggen",
  },
  en: {
    practice: "Practice",
    back: "Back",
    definition: "Definition",
    plural: "Plural",
    diminutive: "Diminutive",
    conjugation: "Conjugation",
    categories: "Categories",
    words: "words",
    practiceThis: "Practice this",
    tapToFlip: "Tap to flip",
    whatDoes: "What does",
    correct: "Correct!",
    incorrect: "Incorrect",
    correctAnswer: "Correct answer",
    check: "Check",
    skip: "Skip",
    continue: "Continue",
    finish: "Finish",
    noWords: "No words available for practice.",
    backToHome: "Back to Home",
    yourCourses: "Your Courses",
    noCourses: "No courses yet. Tap + to add one.",
    whatLangSpeak: "What language do you speak?",
    selectConcept: "Select concept",
    whatLearn: "What do you want to learn?",
    alreadyAdded: "(already added)",
    settings: "Settings",
    signOut: "Sign out",
  },
};

export const globalLearningOrder: string[] = [
  "hallo", "goedemorgen", "goedemiddag", "goedenavond", "tot-ziens", "doei",
  "hond", "kat", "paard", "vogel",
  "man", "vrouw", "kind", "baby",
  "wortel", "aardappel", "ui", "tomaat",
  "appel", "banaan", "aardbei", "druif",
  "groot", "klein", "mooi", "lelijk", "snel", "langzaam",
  "lopen", "eten", "drinken", "slapen", "lezen", "schrijven",
];

export const categories: Category[] = [
  {
    id: "zelfstandig-naamwoord",
    name: { nl: "Zelfstandig Naamwoord", en: "Noun" },
    subcategories: [
      {
        id: "begroeting",
        name: { nl: "Begroeting", en: "Greeting" },
        words: [
          { id: "hallo", nl: { word: "Hallo", definitie: "Een informele begroeting." }, en: { word: "Hello", definition: "An informal greeting." } },
          { id: "goedemorgen", nl: { word: "Goedemorgen", definitie: "Begroeting gebruikt in de ochtend." }, en: { word: "Good morning", definition: "Greeting used in the morning." } },
          { id: "goedemiddag", nl: { word: "Goedemiddag", definitie: "Begroeting gebruikt in de middag." }, en: { word: "Good afternoon", definition: "Greeting used in the afternoon." } },
          { id: "goedenavond", nl: { word: "Goedenavond", definitie: "Begroeting gebruikt in de avond." }, en: { word: "Good evening", definition: "Greeting used in the evening." } },
          { id: "tot-ziens", nl: { word: "Tot ziens", definitie: "Formeel afscheid." }, en: { word: "Goodbye", definition: "Formal farewell." } },
          { id: "doei", nl: { word: "Doei", definitie: "Informeel afscheid." }, en: { word: "Bye", definition: "Informal farewell." } },
        ],
      },
      {
        id: "dier",
        name: { nl: "Dier", en: "Animal" },
        words: [
          { id: "hond", nl: { word: "De Hond", definitie: "Een huisdier.", meervoud: "Honden", verkleinwoord: "Hondje" }, en: { word: "The Dog", definition: "A pet.", plural: "Dogs", diminutive: "Doggy" } },
          { id: "kat", nl: { word: "De Kat", definitie: "Een huisdier.", meervoud: "Katten", verkleinwoord: "Katje" }, en: { word: "The Cat", definition: "A pet.", plural: "Cats", diminutive: "Kitty" } },
          { id: "paard", nl: { word: "Het Paard", definitie: "Een groot dier.", meervoud: "Paarden", verkleinwoord: "Paardje" }, en: { word: "The Horse", definition: "A large animal.", plural: "Horses", diminutive: "Pony" } },
          { id: "vogel", nl: { word: "De Vogel", definitie: "Een dier dat kan vliegen.", meervoud: "Vogels", verkleinwoord: "Vogeltje" }, en: { word: "The Bird", definition: "An animal that can fly.", plural: "Birds", diminutive: "Birdie" } },
        ],
      },
      {
        id: "mens",
        name: { nl: "Mens", en: "Person" },
        words: [
          { id: "man", nl: { word: "De Man", definitie: "Een volwassen mannelijk persoon.", meervoud: "Mannen", verkleinwoord: "Mannetje" }, en: { word: "The Man", definition: "An adult male person.", plural: "Men" } },
          { id: "vrouw", nl: { word: "De Vrouw", definitie: "Een volwassen vrouwelijk persoon.", meervoud: "Vrouwen", verkleinwoord: "Vrouwtje" }, en: { word: "The Woman", definition: "An adult female person.", plural: "Women" } },
          { id: "kind", nl: { word: "Het Kind", definitie: "Een jong persoon.", meervoud: "Kinderen", verkleinwoord: "Kindje" }, en: { word: "The Child", definition: "A young person.", plural: "Children" } },
          { id: "baby", nl: { word: "De Baby", definitie: "Een heel jong kind.", meervoud: "Baby's", verkleinwoord: "Babytje" }, en: { word: "The Baby", definition: "A very young child.", plural: "Babies" } },
        ],
      },
      {
        id: "groente",
        name: { nl: "Groente", en: "Vegetable" },
        words: [
          { id: "wortel", nl: { word: "De Wortel", definitie: "Een oranje groente.", meervoud: "Wortels", verkleinwoord: "Worteltje" }, en: { word: "The Carrot", definition: "An orange vegetable.", plural: "Carrots" } },
          { id: "aardappel", nl: { word: "De Aardappel", definitie: "Een veelgebruikte groente.", meervoud: "Aardappelen", verkleinwoord: "Aardappeltje" }, en: { word: "The Potato", definition: "A commonly used vegetable.", plural: "Potatoes" } },
          { id: "ui", nl: { word: "De Ui", definitie: "Een groente met lagen.", meervoud: "Uien", verkleinwoord: "Uitje" }, en: { word: "The Onion", definition: "A vegetable with layers.", plural: "Onions" } },
          { id: "tomaat", nl: { word: "De Tomaat", definitie: "Een rode groente/vrucht.", meervoud: "Tomaten", verkleinwoord: "Tomaatje" }, en: { word: "The Tomato", definition: "A red vegetable/fruit.", plural: "Tomatoes" } },
        ],
      },
      {
        id: "fruit",
        name: { nl: "Fruit", en: "Fruit" },
        words: [
          { id: "appel", nl: { word: "De Appel", definitie: "Een populaire vrucht.", meervoud: "Appels", verkleinwoord: "Appeltje" }, en: { word: "The Apple", definition: "A popular fruit.", plural: "Apples" } },
          { id: "banaan", nl: { word: "De Banaan", definitie: "Een gele vrucht.", meervoud: "Bananen", verkleinwoord: "Banaantje" }, en: { word: "The Banana", definition: "A yellow fruit.", plural: "Bananas" } },
          { id: "aardbei", nl: { word: "De Aardbei", definitie: "Een rode, zoete vrucht.", meervoud: "Aardbeien", verkleinwoord: "Aardbeitje" }, en: { word: "The Strawberry", definition: "A red, sweet fruit.", plural: "Strawberries" } },
          { id: "druif", nl: { word: "De Druif", definitie: "Een kleine vrucht in trossen.", meervoud: "Druiven", verkleinwoord: "Druifje" }, en: { word: "The Grape", definition: "A small fruit in clusters.", plural: "Grapes" } },
        ],
      },
    ],
  },
  {
    id: "bijvoeglijk-naamwoord",
    name: { nl: "Bijvoeglijk Naamwoord", en: "Adjective" },
    subcategories: [
      {
        id: "beschrijving",
        name: { nl: "Beschrijving", en: "Description" },
        words: [
          { id: "groot", nl: { word: "Groot", definitie: "Van grote omvang." }, en: { word: "Big/Large", definition: "Of great size." } },
          { id: "klein", nl: { word: "Klein", definitie: "Van kleine omvang.", verkleinwoord: "Kleintje" }, en: { word: "Small", definition: "Of small size." } },
          { id: "mooi", nl: { word: "Mooi", definitie: "Aantrekkelijk om te zien." }, en: { word: "Beautiful", definition: "Attractive to look at." } },
          { id: "lelijk", nl: { word: "Lelijk", definitie: "Niet aantrekkelijk om te zien." }, en: { word: "Ugly", definition: "Not attractive to look at." } },
          { id: "snel", nl: { word: "Snel", definitie: "Met grote snelheid." }, en: { word: "Fast", definition: "With great speed." } },
          { id: "langzaam", nl: { word: "Langzaam", definitie: "Met lage snelheid." }, en: { word: "Slow", definition: "With low speed." } },
        ],
      },
    ],
  },
  {
    id: "werkwoord",
    name: { nl: "Werkwoord", en: "Verb" },
    subcategories: [
      {
        id: "dagelijkse-acties",
        name: { nl: "Dagelijkse Acties", en: "Daily Actions" },
        words: [
          {
            id: "lopen",
            nl: { word: "Lopen", definitie: "Zich voortbewegen te voet.", vervoeging: { "ik": "loop", "jij": "loopt", "hij/zij": "loopt", "wij": "lopen", "jullie": "lopen", "zij (mv)": "lopen" } },
            en: { word: "To Walk/Run", definition: "To move on foot.", conjugation: { "I": "walk", "you": "walk", "he/she": "walks", "we": "walk", "they": "walk" } },
          },
          {
            id: "eten",
            nl: { word: "Eten", definitie: "Voedsel consumeren.", vervoeging: { "ik": "eet", "jij": "eet", "hij/zij": "eet", "wij": "eten", "jullie": "eten", "zij (mv)": "eten" } },
            en: { word: "To Eat", definition: "To consume food.", conjugation: { "I": "eat", "you": "eat", "he/she": "eats", "we": "eat", "they": "eat" } },
          },
          {
            id: "drinken",
            nl: { word: "Drinken", definitie: "Vloeistof consumeren.", vervoeging: { "ik": "drink", "jij": "drinkt", "hij/zij": "drinkt", "wij": "drinken", "jullie": "drinken", "zij (mv)": "drinken" } },
            en: { word: "To Drink", definition: "To consume liquid.", conjugation: { "I": "drink", "you": "drink", "he/she": "drinks", "we": "drink", "they": "drink" } },
          },
          {
            id: "slapen",
            nl: { word: "Slapen", definitie: "Rusten met gesloten ogen.", vervoeging: { "ik": "slaap", "jij": "slaapt", "hij/zij": "slaapt", "wij": "slapen", "jullie": "slapen", "zij (mv)": "slapen" } },
            en: { word: "To Sleep", definition: "To rest with eyes closed.", conjugation: { "I": "sleep", "you": "sleep", "he/she": "sleeps", "we": "sleep", "they": "sleep" } },
          },
          {
            id: "lezen",
            nl: { word: "Lezen", definitie: "Tekst interpreteren.", vervoeging: { "ik": "lees", "jij": "leest", "hij/zij": "leest", "wij": "lezen", "jullie": "lezen", "zij (mv)": "lezen" } },
            en: { word: "To Read", definition: "To interpret text.", conjugation: { "I": "read", "you": "read", "he/she": "reads", "we": "read", "they": "read" } },
          },
          {
            id: "schrijven",
            nl: { word: "Schrijven", definitie: "Tekst produceren.", vervoeging: { "ik": "schrijf", "jij": "schrijft", "hij/zij": "schrijft", "wij": "schrijven", "jullie": "schrijven", "zij (mv)": "schrijven" } },
            en: { word: "To Write", definition: "To produce text.", conjugation: { "I": "write", "you": "write", "he/she": "writes", "we": "write", "they": "write" } },
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

// Get the word text in a given language
export function getWordText(word: WordDetail, lang: "nl" | "en"): string {
  return word[lang].word;
}

// Get the translation (the OTHER language)
export function getTranslation(word: WordDetail, learningLang: "nl" | "en"): string {
  const other = learningLang === "nl" ? "en" : "nl";
  return word[other].word;
}
