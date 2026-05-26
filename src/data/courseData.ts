// Bilingual+ course data (Dutch ↔ English, with Arabic UI labels)

export type Lang = "nl" | "en" | "ar";
// Words can exist in nl / en / ar (ar is optional and falls back to en).
export type WordLang = "nl" | "en" | "ar";

/** "m" = male/masculine, "f" = female/feminine, "n" = neuter, "c" = common (de-woord) */
export type WordGender = "m" | "f" | "n" | "c";

export interface WordDetail {
  id: string;
  nl: {
    word: string;
    definitie?: string;
    meervoud?: string;
    verkleinwoord?: string;
    vervoeging?: Record<string, string>;
    voorbeeld?: string;
    /** Syllable breakdown like "[bal-kuh-nee]" */
    pronunciation?: string;
    gender?: WordGender;
  };
  en: {
    word: string;
    definition?: string;
    plural?: string;
    diminutive?: string;
    conjugation?: Record<string, string>;
    example?: string;
    pronunciation?: string;
    gender?: WordGender;
  };
  /** Optional Quranic Arabic translation. Falls back to English when absent. */
  ar?: {
    word: string;
    definition?: string;
    example?: string;
    pronunciation?: string;
  };
}

interface LocalizedName {
  nl: string;
  en: string;
  ar?: string;
}

export interface Subcategory {
  id: string;
  name: LocalizedName;
  words: WordDetail[];
}

export interface Category {
  id: string;
  name: LocalizedName;
  subcategories: Subcategory[];
}

/** Resolve a localized name with safe fallback to English. */
export function localizedName(name: LocalizedName, lang: Lang): string {
  return name[lang] || name.en;
}

export const uiLabels: Record<string, Record<string, string>> = {
  nl: {
    practice: "Oefenen",
    back: "Terug",
    definition: "Definitie",
    plural: "Meervoud",
    diminutive: "Verkleinwoord",
    conjugation: "Vervoeging",
    example: "Voorbeeld",
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
    sessionComplete: "Sessie voltooid!",
    wordsLearned: "Woorden geoefend",
    accuracy: "Nauwkeurigheid",
    greatJob: "Goed bezig!",
    keepGoing: "Ga zo door!",
    nice: "Netjes!",
    perfect: "Perfect!",
    wellDone: "Goed gedaan!",
    awesome: "Geweldig!",
    profile: "Profiel",
    root: "Start",
    search: "Zoeken",
    courses: "Cursussen",
    notFound: "Niet gevonden.",
    interfaceLanguage: "Interface-taal",
    selectInterfaceLanguage: "Kies interface-taal",
    selectConceptShort: "Kies concept",
    selectCourse: "Kies cursus",
    create: "Aanmaken",
    cancel: "Annuleren",
    language: "Taal",
    typeAnswer: "Typ het antwoord",
    listenAndType: "Luister en typ wat je hoort",
    speakAnswer: "Spreek het antwoord uit",
    tapToSpeak: "Tik om te spreken",
    play: "Afspelen",
    yourAnswer: "Jouw antwoord",
    selectMeaning: "Kies de betekenis",
    submit: "Verstuur",
    account: "Account",
    courseSettings: "Cursus",
    about: "Over",
    activeCourse: "Actieve cursus",
    changeInterfaceLanguage: "Wijzig interface-taal",
    changeCourse: "Wijzig actieve cursus",
    appVersion: "App-versie",
    builtWith: "Gemaakt met Lovable",
    searchSettings: "Instellingen zoeken",
    noResults: "Geen resultaten",
    deleteAccount: "Verwijder account",
    deleteAccountConfirm: "Weet je het zeker? Dit kan niet ongedaan worden gemaakt.",
    dictionary: "Woordenboek",
    marked: "Gemarkeerd",
    noMarkedWords: "Nog geen gemarkeerde woorden.",
    mark: "Markeer",
    unmark: "Markering verwijderen",
    learningPath: "Leerpad",
    currentUnit: "Huidige unit",
    unit: "Unit",
    speakNow: "Spreek nu",
    listenAndSpeak: "Luister en spreek het woord",
    speakWord: "Spreek het woord uit",
    tryAgain: "Probeer opnieuw",
    pronunciation: "Uitspraak",
    gender: "Geslacht",
    masculine: "mannelijk",
    feminine: "vrouwelijk",
    neuter: "onzijdig",
    common: "de-woord",
    yourAnswerWas: "Jouw antwoord",
    chess: "Schaken",
    beginner: "Beginner",
    intermediate: "Gemiddeld",
    advanced: "Gevorderd",
    manageCourses: "Cursussen beheren",
    theme: "Thema", themeLight: "Licht", themeDark: "Donker", themeSystem: "Systeem",
    accessibility: "Toegankelijkheid", textSize: "Tekstgrootte",
    textSizeSmall: "Klein", textSizeMedium: "Normaal", textSizeLarge: "Groot",
    highContrast: "Hoog contrast", highContrastDesc: "Pure zwart-witte randen en tekst",
    other: "Overig",
    chessPractice: "Oefenen", chessPuzzles: "Puzzels",
    completed: "Voltooid", lesson: "Les", puzzle: "Puzzel",
    whiteToMove: "Wit aan zet", blackToMove: "Zwart aan zet",
    yourTurn: "Jouw zet", correctMove: "Correcte zet!",
    wrongMove: "Verkeerde zet, probeer opnieuw",
    resetBoard: "Reset bord", revisit: "Herhalen",
  },
  en: {
    practice: "Practice",
    back: "Back",
    definition: "Definition",
    plural: "Plural",
    diminutive: "Diminutive",
    conjugation: "Conjugation",
    example: "Example",
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
    sessionComplete: "Session complete!",
    wordsLearned: "Words practiced",
    accuracy: "Accuracy",
    greatJob: "Great job!",
    keepGoing: "Keep going!",
    nice: "Nice!",
    perfect: "Perfect!",
    wellDone: "Well done!",
    awesome: "Awesome!",
    profile: "Profile",
    root: "Root",
    search: "Search",
    courses: "Courses",
    notFound: "Not found.",
    interfaceLanguage: "Interface language",
    selectInterfaceLanguage: "Select interface language",
    selectConceptShort: "Select concept",
    selectCourse: "Select course",
    create: "Create",
    cancel: "Cancel",
    language: "Language",
    typeAnswer: "Type the answer",
    listenAndType: "Listen and type what you hear",
    speakAnswer: "Speak the answer",
    tapToSpeak: "Tap to speak",
    play: "Play",
    yourAnswer: "Your answer",
    selectMeaning: "Select the meaning",
    submit: "Submit",
    account: "Account",
    courseSettings: "Course",
    about: "About",
    activeCourse: "Active course",
    changeInterfaceLanguage: "Change interface language",
    changeCourse: "Change active course",
    appVersion: "App version",
    builtWith: "Built with Lovable",
    searchSettings: "Search settings",
    noResults: "No results",
    deleteAccount: "Delete account",
    deleteAccountConfirm: "Are you sure? This cannot be undone.",
    dictionary: "Dictionary",
    marked: "Marked",
    noMarkedWords: "No marked words yet.",
    mark: "Mark",
    unmark: "Unmark",
    learningPath: "Learning Path",
    currentUnit: "Current Unit",
    unit: "Unit",
    speakNow: "Speak now",
    listenAndSpeak: "Listen and speak the word",
    speakWord: "Speak the word",
    tryAgain: "Try again",
    pronunciation: "Pronunciation",
    gender: "Gender",
    masculine: "masculine",
    feminine: "feminine",
    neuter: "neuter",
    common: "common (de-word)",
    yourAnswerWas: "Your answer",
    chess: "Chess",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    manageCourses: "Manage courses",
    theme: "Theme", themeLight: "Light", themeDark: "Dark", themeSystem: "System",
    accessibility: "Accessibility", textSize: "Text size",
    textSizeSmall: "Small", textSizeMedium: "Medium", textSizeLarge: "Large",
    highContrast: "High contrast", highContrastDesc: "Pure black & white borders and text",
    other: "Other",
    chessPractice: "Practice", chessPuzzles: "Puzzles",
    completed: "Completed", lesson: "Lesson", puzzle: "Puzzle",
    whiteToMove: "White to move", blackToMove: "Black to move",
    yourTurn: "Your turn", correctMove: "Correct move!",
    wrongMove: "Wrong move, try again",
    resetBoard: "Reset board", revisit: "Revisit",
  },
  ar: {
    practice: "تدريب",
    back: "رجوع",
    definition: "تعريف",
    plural: "الجمع",
    diminutive: "تصغير",
    conjugation: "تصريف",
    example: "مثال",
    categories: "الفئات",
    words: "كلمات",
    practiceThis: "تدرب على هذا",
    tapToFlip: "اضغط للقلب",
    whatDoes: "ماذا تعني",
    correct: "صحيح!",
    incorrect: "خطأ",
    correctAnswer: "الإجابة الصحيحة",
    check: "تحقق",
    skip: "تخطي",
    continue: "متابعة",
    finish: "إنهاء",
    noWords: "لا توجد كلمات متاحة.",
    backToHome: "العودة للرئيسية",
    yourCourses: "دوراتك",
    noCourses: "لا توجد دورات بعد. اضغط + لإضافة واحدة.",
    whatLangSpeak: "ما اللغة التي تتحدثها؟",
    selectConcept: "اختر المفهوم",
    whatLearn: "ماذا تريد أن تتعلم؟",
    alreadyAdded: "(تمت إضافتها)",
    settings: "الإعدادات",
    signOut: "تسجيل الخروج",
    sessionComplete: "اكتملت الجلسة!",
    wordsLearned: "الكلمات المتدرّب عليها",
    accuracy: "الدقة",
    greatJob: "عمل رائع!",
    keepGoing: "استمر!",
    nice: "جميل!",
    perfect: "ممتاز!",
    wellDone: "أحسنت!",
    awesome: "رائع!",
    profile: "الملف الشخصي",
    root: "الرئيسية",
    search: "بحث",
    courses: "الدورات",
    notFound: "غير موجود.",
    interfaceLanguage: "لغة الواجهة",
    selectInterfaceLanguage: "اختر لغة الواجهة",
    selectConceptShort: "اختر المفهوم",
    selectCourse: "اختر الدورة",
    create: "إنشاء",
    cancel: "إلغاء",
    language: "اللغة",
    typeAnswer: "اكتب الإجابة",
    listenAndType: "استمع واكتب ما تسمع",
    speakAnswer: "انطق الإجابة",
    tapToSpeak: "اضغط للتحدث",
    play: "تشغيل",
    yourAnswer: "إجابتك",
    selectMeaning: "اختر المعنى",
    submit: "إرسال",
    account: "الحساب",
    courseSettings: "الدورة",
    about: "حول",
    activeCourse: "الدورة النشطة",
    changeInterfaceLanguage: "تغيير لغة الواجهة",
    changeCourse: "تغيير الدورة النشطة",
    appVersion: "إصدار التطبيق",
    builtWith: "صُنع باستخدام Lovable",
    searchSettings: "بحث في الإعدادات",
    noResults: "لا توجد نتائج",
    deleteAccount: "حذف الحساب",
    deleteAccountConfirm: "هل أنت متأكد؟ لا يمكن التراجع.",
    dictionary: "القاموس",
    marked: "محدد",
    noMarkedWords: "لا توجد كلمات محددة بعد.",
    mark: "تحديد",
    unmark: "إزالة التحديد",
    learningPath: "مسار التعلم",
    currentUnit: "الوحدة الحالية",
    unit: "وحدة",
    speakNow: "تحدث الآن",
    listenAndSpeak: "استمع وانطق الكلمة",
    speakWord: "انطق الكلمة",
    tryAgain: "حاول مرة أخرى",
    pronunciation: "النطق",
    gender: "الجنس",
    masculine: "مذكّر",
    feminine: "مؤنّث",
    neuter: "محايد",
    common: "كلمة de",
    yourAnswerWas: "إجابتك",
    chess: "الشطرنج",
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
    manageCourses: "إدارة الدورات",
    theme: "السمة", themeLight: "فاتح", themeDark: "داكن", themeSystem: "النظام",
    accessibility: "إمكانية الوصول", textSize: "حجم النص",
    textSizeSmall: "صغير", textSizeMedium: "متوسط", textSizeLarge: "كبير",
    highContrast: "تباين عالٍ", highContrastDesc: "حدود ونصوص بأبيض وأسود نقي",
    other: "أخرى",
    chessPractice: "تدريب", chessPuzzles: "ألغاز",
    completed: "مكتمل", lesson: "درس", puzzle: "لغز",
    whiteToMove: "دور الأبيض", blackToMove: "دور الأسود",
    yourTurn: "دورك", correctMove: "نقلة صحيحة!",
    wrongMove: "نقلة خاطئة، حاول مجددًا",
    resetBoard: "إعادة ضبط الرقعة", revisit: "مراجعة",
  },
};

export const globalLearningOrder: string[] = [
  "hallo", "goedemorgen", "goedemiddag", "goedenavond", "tot-ziens", "doei",
  "hond", "kat", "paard", "vogel", "vis", "konijn",
  "man", "vrouw", "kind", "baby",
  "wortel", "aardappel", "ui", "tomaat",
  "appel", "banaan", "aardbei", "druif",
  "jas", "schoen", "broek", "jurk",
  "hoofd", "hand", "been", "oog",
  "brood", "kaas", "soep", "rijst",
  "groot", "klein", "mooi", "lelijk", "snel", "langzaam",
  "blij", "boos", "bang", "moe",
  "warm", "koud", "nat", "droog",
  "lopen", "eten", "drinken", "slapen", "lezen", "schrijven",
  "rennen", "springen", "zwemmen", "fietsen",
  "praten", "luisteren", "vragen", "antwoorden",
  "heel", "soms", "altijd", "nooit", "hier", "daar",
];

export const categories: Category[] = [
  {
    id: "zelfstandig-naamwoord",
    name: { nl: "Zelfstandig Naamwoord", en: "Noun", ar: "اسم" },
    subcategories: [
      {
        id: "begroeting",
        name: { nl: "Begroeting", en: "Greeting", ar: "تحية" },
        words: [
          { id: "hallo", nl: { word: "Hallo", definitie: "Een informele begroeting.", voorbeeld: "Hallo, hoe gaat het?" }, en: { word: "Hello", definition: "An informal greeting.", example: "Hello, how are you?" } },
          { id: "goedemorgen", nl: { word: "Goedemorgen", definitie: "Begroeting gebruikt in de ochtend.", voorbeeld: "Goedemorgen, lekker geslapen?" }, en: { word: "Good morning", definition: "Greeting used in the morning.", example: "Good morning, did you sleep well?" } },
          { id: "goedemiddag", nl: { word: "Goedemiddag", definitie: "Begroeting gebruikt in de middag.", voorbeeld: "Goedemiddag mevrouw." }, en: { word: "Good afternoon", definition: "Greeting used in the afternoon.", example: "Good afternoon, ma'am." } },
          { id: "goedenavond", nl: { word: "Goedenavond", definitie: "Begroeting gebruikt in de avond.", voorbeeld: "Goedenavond allemaal!" }, en: { word: "Good evening", definition: "Greeting used in the evening.", example: "Good evening everyone!" } },
          { id: "tot-ziens", nl: { word: "Tot ziens", definitie: "Formeel afscheid.", voorbeeld: "Tot ziens en een fijne dag!" }, en: { word: "Goodbye", definition: "Formal farewell.", example: "Goodbye and have a nice day!" } },
          { id: "doei", nl: { word: "Doei", definitie: "Informeel afscheid.", voorbeeld: "Doei, tot morgen!" }, en: { word: "Bye", definition: "Informal farewell.", example: "Bye, see you tomorrow!" } },
        ],
      },
      {
        id: "dier",
        name: { nl: "Dier", en: "Animal", ar: "حيوان" },
        words: [
          { id: "hond", nl: { word: "De Hond", definitie: "Een huisdier.", meervoud: "Honden", verkleinwoord: "Hondje", voorbeeld: "De hond blaft.", pronunciation: "[hont]", gender: "c" }, en: { word: "The Dog", definition: "A pet.", plural: "Dogs", diminutive: "Doggy", example: "The dog barks.", pronunciation: "[dawg]" } },
          { id: "kat", nl: { word: "De Kat", definitie: "Een huisdier.", meervoud: "Katten", verkleinwoord: "Katje", voorbeeld: "De kat slaapt op de bank.", pronunciation: "[kaht]", gender: "c" }, en: { word: "The Cat", definition: "A pet.", plural: "Cats", diminutive: "Kitty", example: "The cat sleeps on the couch.", pronunciation: "[kat]" } },
          { id: "paard", nl: { word: "Het Paard", definitie: "Een groot dier.", meervoud: "Paarden", verkleinwoord: "Paardje", voorbeeld: "Het paard rent door het veld." }, en: { word: "The Horse", definition: "A large animal.", plural: "Horses", diminutive: "Pony", example: "The horse runs through the field." } },
          { id: "vogel", nl: { word: "De Vogel", definitie: "Een dier dat kan vliegen.", meervoud: "Vogels", verkleinwoord: "Vogeltje", voorbeeld: "De vogel zingt in de boom." }, en: { word: "The Bird", definition: "An animal that can fly.", plural: "Birds", diminutive: "Birdie", example: "The bird sings in the tree." } },
          { id: "vis", nl: { word: "De Vis", definitie: "Een dier dat in water leeft.", meervoud: "Vissen", verkleinwoord: "Visje", voorbeeld: "De vis zwemt in de vijver." }, en: { word: "The Fish", definition: "An animal that lives in water.", plural: "Fish", diminutive: "Fishy", example: "The fish swims in the pond." } },
          { id: "konijn", nl: { word: "Het Konijn", definitie: "Een klein zoogdier met lange oren.", meervoud: "Konijnen", verkleinwoord: "Konijntje", voorbeeld: "Het konijn eet een wortel." }, en: { word: "The Rabbit", definition: "A small mammal with long ears.", plural: "Rabbits", diminutive: "Bunny", example: "The rabbit eats a carrot." } },
        ],
      },
      {
        id: "mens",
        name: { nl: "Mens", en: "Person", ar: "شخص" },
        words: [
          { id: "man", nl: { word: "De Man", definitie: "Een volwassen mannelijk persoon.", meervoud: "Mannen", verkleinwoord: "Mannetje", voorbeeld: "De man leest een boek.", pronunciation: "[mahn]", gender: "m" }, en: { word: "The Man", definition: "An adult male person.", plural: "Men", example: "The man reads a book.", pronunciation: "[man]", gender: "m" } },
          { id: "vrouw", nl: { word: "De Vrouw", definitie: "Een volwassen vrouwelijk persoon.", meervoud: "Vrouwen", verkleinwoord: "Vrouwtje", voorbeeld: "De vrouw kookt eten.", pronunciation: "[vrow]", gender: "f" }, en: { word: "The Woman", definition: "An adult female person.", plural: "Women", example: "The woman cooks food.", pronunciation: "[wuh-muhn]", gender: "f" } },
          { id: "kind", nl: { word: "Het Kind", definitie: "Een jong persoon.", meervoud: "Kinderen", verkleinwoord: "Kindje", voorbeeld: "Het kind speelt buiten." }, en: { word: "The Child", definition: "A young person.", plural: "Children", example: "The child plays outside." } },
          { id: "baby", nl: { word: "De Baby", definitie: "Een heel jong kind.", meervoud: "Baby's", verkleinwoord: "Babytje", voorbeeld: "De baby slaapt." }, en: { word: "The Baby", definition: "A very young child.", plural: "Babies", example: "The baby sleeps." } },
        ],
      },
      {
        id: "groente",
        name: { nl: "Groente", en: "Vegetable", ar: "خضار" },
        words: [
          { id: "wortel", nl: { word: "De Wortel", definitie: "Een oranje groente.", meervoud: "Wortels", verkleinwoord: "Worteltje", voorbeeld: "Ik eet een wortel." }, en: { word: "The Carrot", definition: "An orange vegetable.", plural: "Carrots", example: "I eat a carrot." } },
          { id: "aardappel", nl: { word: "De Aardappel", definitie: "Een veelgebruikte groente.", meervoud: "Aardappelen", verkleinwoord: "Aardappeltje", voorbeeld: "We eten aardappelen bij het avondeten." }, en: { word: "The Potato", definition: "A commonly used vegetable.", plural: "Potatoes", example: "We eat potatoes for dinner." } },
          { id: "ui", nl: { word: "De Ui", definitie: "Een groente met lagen.", meervoud: "Uien", verkleinwoord: "Uitje", voorbeeld: "De ui maakt je aan het huilen." }, en: { word: "The Onion", definition: "A vegetable with layers.", plural: "Onions", example: "The onion makes you cry." } },
          { id: "tomaat", nl: { word: "De Tomaat", definitie: "Een rode groente/vrucht.", meervoud: "Tomaten", verkleinwoord: "Tomaatje", voorbeeld: "De tomaat is rood en sappig." }, en: { word: "The Tomato", definition: "A red vegetable/fruit.", plural: "Tomatoes", example: "The tomato is red and juicy." } },
        ],
      },
      {
        id: "fruit",
        name: { nl: "Fruit", en: "Fruit", ar: "فاكهة" },
        words: [
          { id: "appel", nl: { word: "De Appel", definitie: "Een populaire vrucht.", meervoud: "Appels", verkleinwoord: "Appeltje", voorbeeld: "Ik eet een appel als snack.", pronunciation: "[ah-puhl]", gender: "c" }, en: { word: "The Apple", definition: "A popular fruit.", plural: "Apples", example: "I eat an apple as a snack.", pronunciation: "[a-puhl]" } },
          { id: "banaan", nl: { word: "De Banaan", definitie: "Een gele vrucht.", meervoud: "Bananen", verkleinwoord: "Banaantje", voorbeeld: "De aap eet een banaan.", pronunciation: "[bah-naan]", gender: "c" }, en: { word: "The Banana", definition: "A yellow fruit.", plural: "Bananas", example: "The monkey eats a banana.", pronunciation: "[buh-na-nuh]" } },
          { id: "aardbei", nl: { word: "De Aardbei", definitie: "Een rode, zoete vrucht.", meervoud: "Aardbeien", verkleinwoord: "Aardbeitje", voorbeeld: "Aardbeien zijn lekker met slagroom." }, en: { word: "The Strawberry", definition: "A red, sweet fruit.", plural: "Strawberries", example: "Strawberries are delicious with cream." } },
          { id: "druif", nl: { word: "De Druif", definitie: "Een kleine vrucht in trossen.", meervoud: "Druiven", verkleinwoord: "Druifje", voorbeeld: "Wijn wordt gemaakt van druiven." }, en: { word: "The Grape", definition: "A small fruit in clusters.", plural: "Grapes", example: "Wine is made from grapes." } },
        ],
      },
      {
        id: "kleding",
        name: { nl: "Kleding", en: "Clothing", ar: "ملابس" },
        words: [
          { id: "jas", nl: { word: "De Jas", definitie: "Kledingstuk voor buitenshuis.", meervoud: "Jassen", verkleinwoord: "Jasje", voorbeeld: "Trek je jas aan, het is koud." }, en: { word: "The Jacket", definition: "Outerwear garment.", plural: "Jackets", example: "Put on your jacket, it's cold." } },
          { id: "schoen", nl: { word: "De Schoen", definitie: "Schoeisel voor de voet.", meervoud: "Schoenen", verkleinwoord: "Schoentje", voorbeeld: "Mijn schoenen zijn nieuw." }, en: { word: "The Shoe", definition: "Footwear.", plural: "Shoes", example: "My shoes are new." } },
          { id: "broek", nl: { word: "De Broek", definitie: "Kledingstuk voor de benen.", meervoud: "Broeken", verkleinwoord: "Broekje", voorbeeld: "Ik draag een blauwe broek." }, en: { word: "The Pants", definition: "Garment for the legs.", plural: "Pants", example: "I wear blue pants." } },
          { id: "jurk", nl: { word: "De Jurk", definitie: "Een kledingstuk voor vrouwen.", meervoud: "Jurken", verkleinwoord: "Jurkje", voorbeeld: "Ze draagt een mooie jurk." }, en: { word: "The Dress", definition: "A garment for women.", plural: "Dresses", example: "She wears a beautiful dress." } },
        ],
      },
      {
        id: "lichaam",
        name: { nl: "Lichaam", en: "Body", ar: "جسم" },
        words: [
          { id: "hoofd", nl: { word: "Het Hoofd", definitie: "Het bovenste deel van het lichaam.", meervoud: "Hoofden", verkleinwoord: "Hoofdje", voorbeeld: "Mijn hoofd doet pijn." }, en: { word: "The Head", definition: "The upper part of the body.", plural: "Heads", example: "My head hurts." } },
          { id: "hand", nl: { word: "De Hand", definitie: "Lichaamsdeel aan het eind van de arm.", meervoud: "Handen", verkleinwoord: "Handje", voorbeeld: "Was je handen voor het eten." }, en: { word: "The Hand", definition: "Body part at the end of the arm.", plural: "Hands", example: "Wash your hands before eating." } },
          { id: "been", nl: { word: "Het Been", definitie: "Lichaamsdeel om mee te lopen.", meervoud: "Benen", verkleinwoord: "Beentje", voorbeeld: "Hij heeft lange benen." }, en: { word: "The Leg", definition: "Body part used for walking.", plural: "Legs", example: "He has long legs." } },
          { id: "oog", nl: { word: "Het Oog", definitie: "Lichaamsdeel om mee te zien.", meervoud: "Ogen", verkleinwoord: "Oogje", voorbeeld: "Ze heeft blauwe ogen." }, en: { word: "The Eye", definition: "Body part used for seeing.", plural: "Eyes", example: "She has blue eyes." } },
        ],
      },
      {
        id: "eten",
        name: { nl: "Eten", en: "Food", ar: "طعام" },
        words: [
          { id: "brood", nl: { word: "Het Brood", definitie: "Een basisvoedsel gemaakt van deeg.", meervoud: "Broden", verkleinwoord: "Broodje", voorbeeld: "Ik eet brood bij het ontbijt." }, en: { word: "The Bread", definition: "A staple food made from dough.", plural: "Breads", example: "I eat bread for breakfast." } },
          { id: "kaas", nl: { word: "De Kaas", definitie: "Een zuivelproduct.", meervoud: "Kazen", verkleinwoord: "Kaasje", voorbeeld: "Nederland is beroemd om kaas." }, en: { word: "The Cheese", definition: "A dairy product.", plural: "Cheeses", example: "The Netherlands is famous for cheese." } },
          { id: "soep", nl: { word: "De Soep", definitie: "Een warm vloeibaar gerecht.", meervoud: "Soepen", verkleinwoord: "Soepje", voorbeeld: "De soep is lekker warm." }, en: { word: "The Soup", definition: "A warm liquid dish.", plural: "Soups", example: "The soup is nice and warm." } },
          { id: "rijst", nl: { word: "De Rijst", definitie: "Een graanproduct.", voorbeeld: "We eten rijst met kip." }, en: { word: "The Rice", definition: "A grain product.", example: "We eat rice with chicken." } },
        ],
      },
    ],
  },
  {
    id: "bijvoeglijk-naamwoord",
    name: { nl: "Bijvoeglijk Naamwoord", en: "Adjective", ar: "صفة" },
    subcategories: [
      {
        id: "beschrijving",
        name: { nl: "Beschrijving", en: "Description", ar: "وصف" },
        words: [
          { id: "groot", nl: { word: "Groot", definitie: "Van grote omvang.", voorbeeld: "Het huis is groot." }, en: { word: "Big/Large", definition: "Of great size.", example: "The house is big." } },
          { id: "klein", nl: { word: "Klein", definitie: "Van kleine omvang.", verkleinwoord: "Kleintje", voorbeeld: "De muis is klein." }, en: { word: "Small", definition: "Of small size.", example: "The mouse is small." } },
          { id: "mooi", nl: { word: "Mooi", definitie: "Aantrekkelijk om te zien.", voorbeeld: "Wat een mooi schilderij!" }, en: { word: "Beautiful", definition: "Attractive to look at.", example: "What a beautiful painting!" } },
          { id: "lelijk", nl: { word: "Lelijk", definitie: "Niet aantrekkelijk om te zien.", voorbeeld: "Het weer is lelijk vandaag." }, en: { word: "Ugly", definition: "Not attractive to look at.", example: "The weather is ugly today." } },
          { id: "snel", nl: { word: "Snel", definitie: "Met grote snelheid.", voorbeeld: "De auto is snel." }, en: { word: "Fast", definition: "With great speed.", example: "The car is fast." } },
          { id: "langzaam", nl: { word: "Langzaam", definitie: "Met lage snelheid.", voorbeeld: "De schildpad is langzaam." }, en: { word: "Slow", definition: "With low speed.", example: "The turtle is slow." } },
        ],
      },
      {
        id: "emoties",
        name: { nl: "Emoties", en: "Emotions", ar: "مشاعر" },
        words: [
          { id: "blij", nl: { word: "Blij", definitie: "Een gevoel van geluk.", voorbeeld: "Ik ben blij vandaag!" }, en: { word: "Happy", definition: "A feeling of joy.", example: "I am happy today!" } },
          { id: "boos", nl: { word: "Boos", definitie: "Een gevoel van woede.", voorbeeld: "Hij is boos op zijn broer." }, en: { word: "Angry", definition: "A feeling of anger.", example: "He is angry at his brother." } },
          { id: "bang", nl: { word: "Bang", definitie: "Een gevoel van angst.", voorbeeld: "Ze is bang in het donker." }, en: { word: "Scared", definition: "A feeling of fear.", example: "She is scared in the dark." } },
          { id: "moe", nl: { word: "Moe", definitie: "Een gevoel van vermoeidheid.", voorbeeld: "Ik ben moe na het werk." }, en: { word: "Tired", definition: "A feeling of fatigue.", example: "I am tired after work." } },
        ],
      },
      {
        id: "weer",
        name: { nl: "Weer", en: "Weather", ar: "طقس" },
        words: [
          { id: "warm", nl: { word: "Warm", definitie: "Hoge temperatuur.", voorbeeld: "Het is warm in de zomer." }, en: { word: "Warm/Hot", definition: "High temperature.", example: "It is warm in the summer." } },
          { id: "koud", nl: { word: "Koud", definitie: "Lage temperatuur.", voorbeeld: "Het is koud in de winter." }, en: { word: "Cold", definition: "Low temperature.", example: "It is cold in the winter." } },
          { id: "nat", nl: { word: "Nat", definitie: "Bedekt met water.", voorbeeld: "De straat is nat van de regen." }, en: { word: "Wet", definition: "Covered with water.", example: "The street is wet from the rain." } },
          { id: "droog", nl: { word: "Droog", definitie: "Zonder water.", voorbeeld: "De woestijn is droog." }, en: { word: "Dry", definition: "Without water.", example: "The desert is dry." } },
        ],
      },
    ],
  },
  {
    id: "werkwoord",
    name: { nl: "Werkwoord", en: "Verb", ar: "فعل" },
    subcategories: [
      {
        id: "dagelijkse-acties",
        name: { nl: "Dagelijkse Acties", en: "Daily Actions", ar: "أفعال يومية" },
        words: [
          {
            id: "lopen", nl: { word: "Lopen", definitie: "Zich voortbewegen te voet.", voorbeeld: "Ik loop naar school.", vervoeging: { "ik": "loop", "jij": "loopt", "hij/zij": "loopt", "wij": "lopen", "jullie": "lopen", "zij (mv)": "lopen" } },
            en: { word: "To Walk/Run", definition: "To move on foot.", example: "I walk to school.", conjugation: { "I": "walk", "you": "walk", "he/she": "walks", "we": "walk", "they": "walk" } },
          },
          {
            id: "eten", nl: { word: "Eten", definitie: "Voedsel consumeren.", voorbeeld: "Wij eten samen.", vervoeging: { "ik": "eet", "jij": "eet", "hij/zij": "eet", "wij": "eten", "jullie": "eten", "zij (mv)": "eten" } },
            en: { word: "To Eat", definition: "To consume food.", example: "We eat together.", conjugation: { "I": "eat", "you": "eat", "he/she": "eats", "we": "eat", "they": "eat" } },
          },
          {
            id: "drinken", nl: { word: "Drinken", definitie: "Vloeistof consumeren.", voorbeeld: "Ik drink water.", vervoeging: { "ik": "drink", "jij": "drinkt", "hij/zij": "drinkt", "wij": "drinken", "jullie": "drinken", "zij (mv)": "drinken" } },
            en: { word: "To Drink", definition: "To consume liquid.", example: "I drink water.", conjugation: { "I": "drink", "you": "drink", "he/she": "drinks", "we": "drink", "they": "drink" } },
          },
          {
            id: "slapen", nl: { word: "Slapen", definitie: "Rusten met gesloten ogen.", voorbeeld: "De baby slaapt.", vervoeging: { "ik": "slaap", "jij": "slaapt", "hij/zij": "slaapt", "wij": "slapen", "jullie": "slapen", "zij (mv)": "slapen" } },
            en: { word: "To Sleep", definition: "To rest with eyes closed.", example: "The baby sleeps.", conjugation: { "I": "sleep", "you": "sleep", "he/she": "sleeps", "we": "sleep", "they": "sleep" } },
          },
          {
            id: "lezen", nl: { word: "Lezen", definitie: "Tekst interpreteren.", voorbeeld: "Zij leest een boek.", vervoeging: { "ik": "lees", "jij": "leest", "hij/zij": "leest", "wij": "lezen", "jullie": "lezen", "zij (mv)": "lezen" } },
            en: { word: "To Read", definition: "To interpret text.", example: "She reads a book.", conjugation: { "I": "read", "you": "read", "he/she": "reads", "we": "read", "they": "read" } },
          },
          {
            id: "schrijven", nl: { word: "Schrijven", definitie: "Tekst produceren.", voorbeeld: "Hij schrijft een brief.", vervoeging: { "ik": "schrijf", "jij": "schrijft", "hij/zij": "schrijft", "wij": "schrijven", "jullie": "schrijven", "zij (mv)": "schrijven" } },
            en: { word: "To Write", definition: "To produce text.", example: "He writes a letter.", conjugation: { "I": "write", "you": "write", "he/she": "writes", "we": "write", "they": "write" } },
          },
        ],
      },
      {
        id: "beweging",
        name: { nl: "Beweging", en: "Movement", ar: "حركة" },
        words: [
          {
            id: "rennen", nl: { word: "Rennen", definitie: "Snel lopen.", voorbeeld: "De kinderen rennen in het park.", vervoeging: { "ik": "ren", "jij": "rent", "hij/zij": "rent", "wij": "rennen", "jullie": "rennen", "zij (mv)": "rennen" } },
            en: { word: "To Run", definition: "To move fast on foot.", example: "The children run in the park.", conjugation: { "I": "run", "you": "run", "he/she": "runs", "we": "run", "they": "run" } },
          },
          {
            id: "springen", nl: { word: "Springen", definitie: "Van de grond af komen.", voorbeeld: "Het konijn springt hoog.", vervoeging: { "ik": "spring", "jij": "springt", "hij/zij": "springt", "wij": "springen", "jullie": "springen", "zij (mv)": "springen" } },
            en: { word: "To Jump", definition: "To leave the ground.", example: "The rabbit jumps high.", conjugation: { "I": "jump", "you": "jump", "he/she": "jumps", "we": "jump", "they": "jump" } },
          },
          {
            id: "zwemmen", nl: { word: "Zwemmen", definitie: "Bewegen door water.", voorbeeld: "Ik zwem in het zwembad.", vervoeging: { "ik": "zwem", "jij": "zwemt", "hij/zij": "zwemt", "wij": "zwemmen", "jullie": "zwemmen", "zij (mv)": "zwemmen" } },
            en: { word: "To Swim", definition: "To move through water.", example: "I swim in the pool.", conjugation: { "I": "swim", "you": "swim", "he/she": "swims", "we": "swim", "they": "swim" } },
          },
          {
            id: "fietsen", nl: { word: "Fietsen", definitie: "Rijden op een fiets.", voorbeeld: "Nederlanders fietsen veel.", vervoeging: { "ik": "fiets", "jij": "fietst", "hij/zij": "fietst", "wij": "fietsen", "jullie": "fietsen", "zij (mv)": "fietsen" } },
            en: { word: "To Cycle", definition: "To ride a bicycle.", example: "The Dutch cycle a lot.", conjugation: { "I": "cycle", "you": "cycle", "he/she": "cycles", "we": "cycle", "they": "cycle" } },
          },
        ],
      },
      {
        id: "communicatie",
        name: { nl: "Communicatie", en: "Communication", ar: "تواصل" },
        words: [
          {
            id: "praten", nl: { word: "Praten", definitie: "Woorden spreken.", voorbeeld: "We praten over het weer.", vervoeging: { "ik": "praat", "jij": "praat", "hij/zij": "praat", "wij": "praten", "jullie": "praten", "zij (mv)": "praten" } },
            en: { word: "To Talk", definition: "To speak words.", example: "We talk about the weather.", conjugation: { "I": "talk", "you": "talk", "he/she": "talks", "we": "talk", "they": "talk" } },
          },
          {
            id: "luisteren", nl: { word: "Luisteren", definitie: "Aandachtig horen.", voorbeeld: "Luister naar de muziek.", vervoeging: { "ik": "luister", "jij": "luistert", "hij/zij": "luistert", "wij": "luisteren", "jullie": "luisteren", "zij (mv)": "luisteren" } },
            en: { word: "To Listen", definition: "To hear attentively.", example: "Listen to the music.", conjugation: { "I": "listen", "you": "listen", "he/she": "listens", "we": "listen", "they": "listen" } },
          },
          {
            id: "vragen", nl: { word: "Vragen", definitie: "Een vraag stellen.", voorbeeld: "Mag ik iets vragen?", vervoeging: { "ik": "vraag", "jij": "vraagt", "hij/zij": "vraagt", "wij": "vragen", "jullie": "vragen", "zij (mv)": "vragen" } },
            en: { word: "To Ask", definition: "To pose a question.", example: "May I ask something?", conjugation: { "I": "ask", "you": "ask", "he/she": "asks", "we": "ask", "they": "ask" } },
          },
          {
            id: "antwoorden", nl: { word: "Antwoorden", definitie: "Reageren op een vraag.", voorbeeld: "Kun je antwoorden?", vervoeging: { "ik": "antwoord", "jij": "antwoordt", "hij/zij": "antwoordt", "wij": "antwoorden", "jullie": "antwoorden", "zij (mv)": "antwoorden" } },
            en: { word: "To Answer", definition: "To respond to a question.", example: "Can you answer?", conjugation: { "I": "answer", "you": "answer", "he/she": "answers", "we": "answer", "they": "answer" } },
          },
        ],
      },
    ],
  },
  {
    id: "bijwoord",
    name: { nl: "Bijwoord", en: "Adverb", ar: "ظرف" },
    subcategories: [
      {
        id: "frequentie",
        name: { nl: "Frequentie", en: "Frequency", ar: "تكرار" },
        words: [
          { id: "altijd", nl: { word: "Altijd", definitie: "Op elk moment.", voorbeeld: "Ik drink altijd koffie." }, en: { word: "Always", definition: "At all times.", example: "I always drink coffee." } },
          { id: "soms", nl: { word: "Soms", definitie: "Af en toe.", voorbeeld: "Soms regent het." }, en: { word: "Sometimes", definition: "Occasionally.", example: "Sometimes it rains." } },
          { id: "nooit", nl: { word: "Nooit", definitie: "Op geen enkel moment.", voorbeeld: "Ik ga nooit naar bed laat." }, en: { word: "Never", definition: "At no time.", example: "I never go to bed late." } },
          { id: "heel", nl: { word: "Heel", definitie: "In grote mate.", voorbeeld: "Het eten is heel lekker." }, en: { word: "Very", definition: "To a great degree.", example: "The food is very tasty." } },
        ],
      },
      {
        id: "plaats",
        name: { nl: "Plaats", en: "Place", ar: "مكان" },
        words: [
          { id: "hier", nl: { word: "Hier", definitie: "Op deze plek.", voorbeeld: "Kom hier!" }, en: { word: "Here", definition: "In this place.", example: "Come here!" } },
          { id: "daar", nl: { word: "Daar", definitie: "Op die plek.", voorbeeld: "Het boek ligt daar." }, en: { word: "There", definition: "In that place.", example: "The book is there." } },
        ],
      },
    ],
  },
];

export type Difficulty = "beginner" | "intermediate" | "advanced";

/** Difficulty tier per subcategory id (used by the Learning Path). */
export const subcategoryDifficulty: Record<string, Difficulty> = {
  begroeting: "beginner",
  dier: "beginner",
  mens: "beginner",
  fruit: "beginner",
  groente: "intermediate",
  kleding: "intermediate",
  lichaam: "intermediate",
  eten: "intermediate",
  beschrijving: "intermediate",
  emoties: "intermediate",
  weer: "intermediate",
  "dagelijkse-acties": "advanced",
  beweging: "advanced",
  communicatie: "advanced",
  frequentie: "advanced",
  plaats: "advanced",
};

export interface PathSubcategoryRef {
  category: Category;
  subcategory: Subcategory;
}

export function getLearningPathByDifficulty(): Record<Difficulty, PathSubcategoryRef[]> {
  const out: Record<Difficulty, PathSubcategoryRef[]> = {
    beginner: [],
    intermediate: [],
    advanced: [],
  };
  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      const d = subcategoryDifficulty[sub.id] ?? "intermediate";
      out[d].push({ category: cat, subcategory: sub });
    }
  }
  return out;
}


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

export function getWordText(word: WordDetail, lang: WordLang): string {
  if (lang === "ar") return word.ar?.word ?? word.en.word;
  return word[lang].word;
}

export function getTranslation(word: WordDetail, learningLang: WordLang): string {
  const other: WordLang = learningLang === "nl" ? "en" : "nl";
  return word[other].word;
}
