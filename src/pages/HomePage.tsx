import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Type, Volume2, Bookmark, BookmarkCheck, CheckSquare, Square, Brain, X, Clock } from "lucide-react";
import { CardButton } from "@/components/ui/card-button";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { TitleBar } from "@/components/ui/title-bar";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useMarkedWords } from "@/hooks/useMarkedWords";
import {
  categories, getWordsForCategory, localizedName, getWordText,
  type Lang, type WordLang,
} from "@/data/courseData";
import { RecallButton } from "@/components/RecallButton";
import { speak, isSpeechAvailable } from "@/components/practice/speech";
import { ALPHABET_SEGMENT } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { fetchWordImage } from "@/lib/wordImage";

const TARGET_LANGS: { code: Lang; label: string }[] = [
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
];

const ALPHABET_LABEL: Record<Lang, string> = {
  nl: "Alfabet", en: "Alphabet", ar: "الحروف",
};

const LANGUAGE_LABEL: Record<Lang, string> = {
  nl: "Taal", en: "Language", ar: "اللغة",
};

export default function HomePage() {
  const {
    isAuthenticated, introductionCompleted, browsePath, pushBrowse, setBrowsePath,
    setLearningLanguage, interfaceLanguage,
    setActiveRecall, setRecallReturnPath,
  } = useApp();
  const { uiLang, t } = useCourseLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !introductionCompleted) navigate("/introduction");
  }, [isAuthenticated, introductionCompleted, navigate]);

  // ── ROOT ────────────────────────────────────────────────────────────
  if (browsePath.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        <CardButton
          onClick={() => pushBrowse("language")}
          className="min-h-[64px] py-3 flex items-center justify-center text-center"
        >
          <span className="font-semibold">{LANGUAGE_LABEL[uiLang]}</span>
        </CardButton>
      </div>
    );
  }

  // ── pick a target language ─────────────────────────────────────────
  if (browsePath[0] === "language" && browsePath.length === 1) {
    const available = TARGET_LANGS.filter(l => l.code !== interfaceLanguage);
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        {available.map(l => (
          <CardButton
            key={l.code}
            onClick={() => {
              setLearningLanguage(l.code);
              setBrowsePath(["language", l.code]);
            }}
            className="min-h-[64px] py-3 flex items-center justify-center text-center"
          >
            <span className="font-semibold">{l.label}</span>
          </CardButton>
        ))}
      </div>
    );
  }


  const targetLang = browsePath[1] as Lang;

  // ── language home: Alphabet folder + categories ────────────────────
  if (browsePath.length === 2) {
    return (
      <div className="px-4 w-full">
        <div className="grid grid-cols-2 gap-3">
          <CardButton
            onClick={() => pushBrowse(ALPHABET_SEGMENT)}
            className="min-h-[88px] flex flex-col justify-between"
          >
            <span className="font-semibold text-sm inline-flex items-center gap-2">
              <Type className="h-4 w-4" />
              {ALPHABET_LABEL[uiLang]}
            </span>
            <span className="text-xs mt-2 opacity-70">{t("letters") || "letters"}</span>
          </CardButton>
          {categories.map(cat => {
            const total = getWordsForCategory(cat.id).length;
            return (
              <CardButton
                key={cat.id}
                onClick={() => pushBrowse(cat.id)}
                className="min-h-[88px] flex flex-col justify-between"
              >
                <span className="font-semibold text-sm">{localizedName(cat.name, uiLang)}</span>
                <span className="text-xs mt-2 opacity-70">{total} {t("words")}</span>
              </CardButton>
            );
          })}
        </div>
      </div>
    );
  }

  // ── alphabet ────────────────────────────────────────────────────────
  if (browsePath[2] === ALPHABET_SEGMENT) {
    return <AlphabetView targetLang={targetLang} uiLang={uiLang} />;
  }

  // ── subcategories ──────────────────────────────────────────────────
  const category = categories.find(c => c.id === browsePath[2]);
  if (!category) return <div className="px-4 text-sm">{t("notFound")}</div>;

  if (browsePath.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-3 px-4">
        {category.subcategories.map(sub => (
          <CardButton
            key={sub.id}
            onClick={() => pushBrowse(sub.id)}
            className="min-h-[80px] flex flex-col justify-between"
          >
            <span className="font-semibold text-sm">{localizedName(sub.name, uiLang)}</span>
            <span className="text-xs mt-2 opacity-70">{sub.words.length} {t("words")}</span>
          </CardButton>
        ))}
      </div>
    );
  }

  // ── words ──────────────────────────────────────────────────────────
  const subcategory = category.subcategories.find(s => s.id === browsePath[3]);
  if (!subcategory) return <div className="px-4 text-sm">{t("notFound")}</div>;

  if (browsePath.length === 4) {
    return (
      <WordsView
        categoryId={category.id}
        subcategoryId={subcategory.id}
        targetLang={targetLang}
        onOpenWord={(id) => pushBrowse(id)}
        onSelectedRecall={(wordIds) => {
          setRecallReturnPath(browsePath);
          setActiveRecall({
            scope: "word",
            categoryId: category.id,
            subcategoryId: subcategory.id,
            wordIds,
          });
          navigate("/recall");
        }}
      />
    );
  }

  // ── word detail ────────────────────────────────────────────────────
  const word = subcategory.words.find(w => w.id === browsePath[4]);
  if (!word) return <div className="px-4 text-sm">{t("notFound")}</div>;
  return (
    <WordDetailView
      categoryId={category.id}
      subcategoryId={subcategory.id}
      word={word}
    />
  );
}

/* ─────────────────────────── Words view ───────────────────────────── */

function WordsView({
  categoryId, subcategoryId, targetLang, onOpenWord, onSelectedRecall,
}: {
  categoryId: string;
  subcategoryId: string;
  targetLang: Lang;
  onOpenWord: (wordId: string) => void;
  onSelectedRecall: (wordIds: string[]) => void;
}) {
  const category = categories.find(c => c.id === categoryId)!;
  const subcategory = category.subcategories.find(s => s.id === subcategoryId)!;
  const { t } = useCourseLanguage();
  const { recallQueue } = useApp();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const now = Date.now();
  const wordCooling = (wid: string) => {
    const item = recallQueue.find(
      r => r.scope === "word" && r.categoryId === categoryId && r.subcategoryId === subcategoryId && r.wordId === wid
    );
    return !!item && item.readyAt > now;
  };
  const subItem = recallQueue.find(
    r => r.scope === "subcategory" && r.categoryId === categoryId && r.subcategoryId === subcategoryId
  );
  const subCooling = !!subItem && subItem.readyAt > now;

  const toggle = (id: string) => {
    if (wordCooling(id)) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4 px-4">
      <div className="flex items-center gap-2 flex-wrap">
        <RecallButton
          scope="subcategory"
          categoryId={categoryId}
          subcategoryId={subcategoryId}
          className="flex-1 min-w-[160px]"
        />
        <Button
          onClick={() => { setSelectMode(s => !s); setSelected(new Set()); }}
          aria-label="Select words"
          active={selectMode}
          disabled={subCooling}
        >
          {selectMode ? <X className="h-4 w-4 mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
          {selectMode ? (t("cancel") || "Cancel") : (t("select") || "Select")}
        </Button>
      </div>

      {selectMode && selected.size > 0 && (
        <Button
          active
          fullWidth
          onClick={() => onSelectedRecall(Array.from(selected))}
        >
          <Brain className="h-4 w-4 mr-2" />
          {(t("recallSelected") || "Recall selected")} ({selected.size})
        </Button>
      )}

      <div className="grid grid-cols-2 gap-3">
        {subcategory.words.map(word => {
          const isSel = selected.has(word.id);
          const cooling = wordCooling(word.id);
          return (
            <CardButton
              key={word.id}
              onClick={() => {
                if (selectMode) toggle(word.id);
                else onOpenWord(word.id);
              }}
              disabled={selectMode && cooling}
              className={cn(
                "min-h-[80px] flex flex-col justify-between relative",
                selectMode && isSel && "bg-foreground text-background border-foreground hover:bg-foreground hover:text-background hover:border-foreground",
                selectMode && cooling && "opacity-50"
              )}
            >
              {selectMode && (
                <span className="absolute top-2 right-2">
                  {cooling ? (
                    <Clock className="h-4 w-4 opacity-60" />
                  ) : isSel ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4 opacity-60" />
                  )}
                </span>
              )}
              <span className="font-semibold text-sm">
                {getWordText(word, targetLang as WordLang)}
              </span>
            </CardButton>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── Alphabet view ─────────────────────────── */

interface AlphabetTable {
  vowelsLabel: Record<Lang, string>;
  consonantsLabel: Record<Lang, string>;
  vowels: { letter: string; name?: string }[];
  consonants: { letter: string; name?: string }[];
}

const ALPHABET_TABLES: Record<Lang, AlphabetTable> = {
  nl: {
    vowelsLabel: { nl: "Klinkers", en: "Vowels", ar: "حروف العلة" },
    consonantsLabel: { nl: "Medeklinkers", en: "Consonants", ar: "الحروف الساكنة" },
    vowels: ["a", "e", "i", "o", "u", "y"].map(l => ({ letter: l.toUpperCase() })),
    consonants: "bcdfghjklmnpqrstvwxz".split("").map(l => ({ letter: l.toUpperCase() })),
  },
  en: {
    vowelsLabel: { nl: "Klinkers", en: "Vowels", ar: "حروف العلة" },
    consonantsLabel: { nl: "Medeklinkers", en: "Consonants", ar: "الحروف الساكنة" },
    vowels: ["a", "e", "i", "o", "u"].map(l => ({ letter: l.toUpperCase() })),
    consonants: "bcdfghjklmnpqrstvwxyz".split("").map(l => ({ letter: l.toUpperCase() })),
  },
  ar: {
    vowelsLabel: { nl: "Lange klinkers", en: "Long vowels", ar: "حروف المد" },
    consonantsLabel: { nl: "Medeklinkers", en: "Consonants", ar: "الحروف الساكنة" },
    vowels: [
      { letter: "ا", name: "alif" },
      { letter: "و", name: "waw" },
      { letter: "ي", name: "ya" },
    ],
    consonants: [
      ["ب", "ba"], ["ت", "ta"], ["ث", "tha"], ["ج", "jim"], ["ح", "ha"], ["خ", "kha"],
      ["د", "dal"], ["ذ", "dhal"], ["ر", "ra"], ["ز", "zay"], ["س", "sin"], ["ش", "shin"],
      ["ص", "sad"], ["ض", "dad"], ["ط", "ta"], ["ظ", "za"], ["ع", "ayn"], ["غ", "ghayn"],
      ["ف", "fa"], ["ق", "qaf"], ["ك", "kaf"], ["ل", "lam"], ["م", "mim"], ["ن", "nun"],
      ["ه", "ha"], ["ء", "hamza"],
    ].map(([letter, name]) => ({ letter, name })),
  },
};

function AlphabetView({ targetLang, uiLang }: { targetLang: Lang; uiLang: Lang }) {
  const table = ALPHABET_TABLES[targetLang] ?? ALPHABET_TABLES.en;
  return (
    <div className="space-y-6 w-full px-4">
      <section className="space-y-3">
        <TitleBar className="font-semibold">{table.vowelsLabel[uiLang]}</TitleBar>
        <div className="grid grid-cols-6 gap-2">
          {table.vowels.map(v => <LetterCard key={v.letter} {...v} lang={targetLang} />)}
        </div>
      </section>
      <section className="space-y-3">
        <TitleBar className="font-semibold">{table.consonantsLabel[uiLang]}</TitleBar>
        <div className="grid grid-cols-6 gap-2">
          {table.consonants.map(c => <LetterCard key={c.letter} {...c} lang={targetLang} />)}
        </div>
      </section>
    </div>
  );
}

function LetterCard({ letter, name, lang }: { letter: string; name?: string; lang: Lang }) {
  const canSpeak = isSpeechAvailable();
  return (
    <Container className="p-3 flex flex-col items-center justify-center gap-1 aspect-square">
      <span className="text-2xl font-bold leading-none">{letter}</span>
      {name && <span className="text-[10px] opacity-60">{name}</span>}
      {canSpeak && (
        <Button size="icon" className="h-7 w-7" onClick={() => speak(letter, lang)} aria-label="Play">
          <Volume2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </Container>
  );
}

/* ─────────────────────────── Word detail ───────────────────────────── */

type FlipState = 0 | 1 | 2;

function WordDetailView({
  categoryId, subcategoryId, word,
}: {
  categoryId: string;
  subcategoryId: string;
  word: import("@/data/courseData").WordDetail;
}) {
  const { uiLang, courseLang, t } = useCourseLanguage();
  const [flip, setFlip] = useState<FlipState>(0);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const { isMarked, toggle } = useMarkedWords();

  const targetTextEarly = word[courseLang]?.word ?? word.en.word;
  const showImage = categoryId === "zelfstandig-naamwoord";
  useEffect(() => {
    setImgUrl(null);
    if (!targetTextEarly || !showImage) return;
    let cancelled = false;
    fetchWordImage(targetTextEarly, courseLang).then(url => {
      if (!cancelled) setImgUrl(url);
    });
    return () => { cancelled = true; };
  }, [word.id, targetTextEarly, courseLang, showImage]);

  const handleFlip = () => setFlip(f => ((f + 1) % 3) as FlipState);
  const interfaceWordLang: WordLang = uiLang === "ar" ? "en" : (uiLang as WordLang);
  const showLang: WordLang = flip === 2 ? interfaceWordLang : courseLang;
  const dataFor = (lang: WordLang) => (lang === "ar" ? word.ar ?? word.en : word[lang]);
  const data = dataFor(showLang);
  const en = word.en, nl = word.nl;
  const definition = showLang === "nl" ? nl.definitie
    : showLang === "ar" ? (word.ar?.definition ?? en.definition)
    : en.definition;
  const plural = showLang === "nl" ? nl.meervoud : en.plural;
  const diminutive = showLang === "nl" ? nl.verkleinwoord : en.diminutive;
  const conjugation = showLang === "nl" ? nl.vervoeging : en.conjugation;
  const example = showLang === "nl" ? nl.voorbeeld
    : showLang === "ar" ? (word.ar?.example ?? en.example)
    : en.example;
  const pronunciation = data.pronunciation;
  const gender = showLang === "nl" ? nl.gender : showLang === "en" ? en.gender : undefined;
  const genderLabel = gender === "m" ? t("masculine")
    : gender === "f" ? t("feminine")
    : gender === "n" ? t("neuter")
    : gender === "c" ? t("common") : null;

  const targetText = (courseLang === "ar" ? word.ar?.word : word[courseLang]?.word) ?? word.en.word;
  const frontPron = (courseLang === "ar" ? word.ar?.pronunciation : word[courseLang]?.pronunciation) ?? undefined;
  const marked = isMarked(courseLang, word.id);
  const isFront = flip === 0;

  return (
    <div className="px-4 max-w-md mx-auto space-y-3">
      <RecallButton
        scope="word"
        categoryId={categoryId}
        subcategoryId={subcategoryId}
        wordId={word.id}
        fullWidth
      />
      <CardButton
        onClick={handleFlip}
        className={cn("w-full relative", isFront ? "min-h-[140px]" : "min-h-[260px]")}
      >
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          {isSpeechAvailable() && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); speak(targetText, courseLang); }}
              className="rounded-full p-2 bg-background border-2 border-border hover:bg-foreground hover:text-background transition-colors"
              aria-label={t("play")}
            >
              <Volume2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggle(courseLang, word.id); }}
            className={cn(
              "rounded-full p-2 border-2 border-border transition-colors",
              marked ? "bg-foreground text-background" : "bg-background hover:bg-foreground hover:text-background"
            )}
            aria-label={marked ? t("unmark") : t("mark")}
          >
            {marked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex flex-col h-full">
          {isFront ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[100px] gap-1">
              <h1 className="text-3xl font-bold text-center">{targetText}</h1>
              {frontPron && <p className="text-sm opacity-70 font-mono">{frontPron}</p>}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1 pr-24">
                <h1 className="text-2xl font-bold">{data.word}</h1>
                <span className="text-xs uppercase tracking-wider opacity-70">{showLang}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {pronunciation && <span className="text-sm opacity-70 font-mono">{pronunciation}</span>}
                {genderLabel && (
                  <span className="text-xs px-2 py-0.5 rounded-full border-2 border-border bg-background">
                    {t("gender")}: {genderLabel}
                  </span>
                )}
              </div>
              {definition && <Section label={t("definition")}>{definition}</Section>}
              {plural && <Section label={t("plural")}>{plural}</Section>}
              {diminutive && <Section label={t("diminutive")}>{diminutive}</Section>}
              {conjugation && (
                <div className="mb-3">
                  <h3 className="text-xs font-medium opacity-70 mb-0.5">{t("conjugation")}</h3>
                  <div className="space-y-0.5">
                    {Object.entries(conjugation).map(([pronoun, form]) => (
                      <div key={pronoun} className="flex justify-between text-sm">
                        <span className="opacity-70">{pronoun}</span>
                        <span className="font-medium">{form}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {example && <Section label={t("example")} italic>{example}</Section>}
            </>
          )}

          {imgUrl && (
            <div className="mt-4 rounded-[14px] overflow-hidden border-2 border-border bg-background aspect-[4/3]">
              <img
                src={imgUrl}
                alt={targetText}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={() => setImgUrl(null)}
              />
            </div>
          )}

          <p className="text-xs opacity-60 mt-4 text-center">{t("tapToFlip")}</p>
        </div>
      </CardButton>
    </div>
  );
}

function Section({ label, children, italic }: { label: string; children: React.ReactNode; italic?: boolean }) {
  return (
    <div className="mb-3">
      <h3 className="text-xs font-medium opacity-70 mb-0.5">{label}</h3>
      <p className={cn("text-sm", italic && "italic")}>{children}</p>
    </div>
  );
}
