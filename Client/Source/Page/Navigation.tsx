import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, CheckSquare, Clock, Filter, Plus, Square, X } from "lucide-react";
import { CardButton } from "@/Component/UI/card-button";
import { Button } from "@/Component/UI/button";
import { Container } from "@/Component/UI/container";
import { FullPageDialog } from "@/Component/UI/full-page-dialog";
import { useApp } from "@/Context/App";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useMarkedWords } from "@/Hook/useMarkedWords";
import { useCustomCollections } from "@/Hook/useCustomCollections";
import { useCustomWords } from "@/Hook/useCustomWords";
import type { WordDetail } from "@/Hook/useCustomWords";
import { useFavoriteWords } from "@/Hook/useFavoriteWords";
import { RecallButton } from "@/Component/RecallButton";
import { ALPHABET_SEGMENT } from "@/Library/navigation";
import { cn } from "@/Library/utils";
import { WordEditDialog } from "@/Component/Word/WordEditDialog";
import { LessonsView } from "@/Component/Lesson/Lesson";
import { AlphabetView } from "@/Component/View/Alphabet";
import { WordDetailView } from "@/Component/View/Word";
import { ChessBranch } from "@/Component/View/Chess";
import { SubcategoriesView } from "@/Component/View/Subcategory";
import { LanguageDictionaryView, LanguageRootView } from "@/Component/View/Language";

// FIX: Localized type boundaries to prevent backend cross-contamination
export type SupportedLang = "Dutch" | "English" | "Arabic" | "Pashto";
export type SectionType = "Vocabulary" | "Grammar";
export type WordEntry = string[] | Record<string, any>[];

// Helper mapper to translate internal UI shorthand codes to API expected Type names
const MAP_LANG_CODE: Record<string, SupportedLang> = {
  nl: "Dutch",
  en: "English",
  ar: "Arabic",
  ps: "Pashto"
};

const TARGET_LANGS: { code: string; label: string }[] = [
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
];

const EXTRA_LANGS: { code: string; label: string; preview?: boolean }[] = [
  { code: "ps", label: "پښتو (Pashto)", preview: true },
];

const LANGUAGE_LABEL: Record<string, string> = { nl: "Taal",      en: "Language", ar: "اللغة"    };
const CHESS_LABEL:    Record<string, string> = { nl: "Schaken",   en: "Chess",    ar: "الشطرنج"  };
const DEFAULT_SECTION: SectionType = "Vocabulary";

const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function entryText(entry: WordEntry | null | undefined, index: number): string | undefined {
  const value = Array.isArray(entry) ? entry[index] : undefined;
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return value.English ?? Object.values(value)[0];
  return undefined;
}

function wordDetailFromApi(id: string, entry: WordEntry, lang: SupportedLang): WordDetail {
  const word = entryText(entry, 0) ?? id;
  const definition = entryText(entry, 1);
  const example = entryText(entry, 2);
  const base: WordDetail = {
    id,
    nl: { word: id },
    en: { word: id },
  };

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

export default function HomePage() {
  const {
    browsePath, pushBrowse, setBrowsePath,
    setLearningLanguage, interfaceLanguage,
    setActiveRecall, setRecallReturnPath,
  } = useApp();
  const { uiLang, i18nLang, t } = useCourseLanguage();
  const navigate = useNavigate();
  const hookTargetLangCode = browsePath[0] === "language" ? browsePath[1] : undefined;
  const hookApiLangName = hookTargetLangCode ? (MAP_LANG_CODE[hookTargetLangCode] || "English") : undefined;
  const { collections: customCategories } = useCustomCollections(hookApiLangName ? `__lang_${hookApiLangName}` : undefined);
  
  const { collections: customSubcategories } = useCustomCollections(
    browsePath[0] === "language" && browsePath[2] === "dictionary" && browsePath[3] === "vocabulary"
      ? browsePath[4]
      : undefined,
  );

  // Structural fetching state for items that rely on cross-network definitions
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [wordSlugs, setWordSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const targetLangCode = browsePath[1];
  const apiLangName = MAP_LANG_CODE[targetLangCode] || "English";

  // Dynamic remote fetching synchronization
  useEffect(() => {
    if (!hookApiLangName) return;
    setLoading(true);
    
    fetch(`${BACKEND_BASE_URL}/api/categories?lang=${encodeURIComponent(hookApiLangName)}&section=${DEFAULT_SECTION}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setCategories(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [hookApiLangName]);

  useEffect(() => {
    if (browsePath[2] !== "dictionary" || browsePath[3] !== "vocabulary" || !browsePath[4]) return;
    const catId = browsePath[4];
    
    fetch(`${BACKEND_BASE_URL}/api/subcategories?lang=${encodeURIComponent(apiLangName)}&section=${DEFAULT_SECTION}&category=${encodeURIComponent(catId)}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setSubcategories(data))
      .catch(err => console.error(err));
  }, [browsePath, apiLangName]);

  useEffect(() => {
    if (browsePath[2] !== "dictionary" || browsePath[3] !== "vocabulary" || !browsePath[4] || !browsePath[5]) return;
    const catId = browsePath[4];
    const subId = browsePath[5];
    
    fetch(`${BACKEND_BASE_URL}/api/word-slugs?lang=${encodeURIComponent(apiLangName)}&section=${DEFAULT_SECTION}&category=${encodeURIComponent(catId)}&subcategory=${encodeURIComponent(subId)}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setWordSlugs(data))
      .catch(err => console.error(err));
  }, [browsePath, apiLangName]);

  // ── ROOT ──────────────────────────────────────────────────────────────
  if (browsePath.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        <CardButton
          onClick={() => pushBrowse("language")}
          className="min-h-[64px] py-3 flex items-center justify-center text-center"
        >
          <span className="font-semibold">{LANGUAGE_LABEL[uiLang] || "Language"}</span>
        </CardButton>
        <CardButton
          onClick={() => pushBrowse("chess")}
          className="min-h-[64px] py-3 flex items-center justify-center text-center"
        >
          <span className="font-semibold">{CHESS_LABEL[uiLang] || "Chess"}</span>
        </CardButton>
      </div>
    );
  }

  // ── CHESS ─────────────────────────────────────────────────────────────
  if (browsePath[0] === "chess") {
    return <ChessBranch />;
  }

  // ── LANGUAGE PICKER ───────────────────────────────────────────────────
  if (browsePath[0] === "language" && browsePath.length === 1) {
    return (
      <LanguagePicker
        interfaceLanguage={interfaceLanguage}
        onPick={(code) => {
          if (code === "ps") { setBrowsePath(["language", "ps"]); return; }
          setLearningLanguage(code);
          setBrowsePath(["language", code]);
        }}
      />
    );
  }

  // ── LANGUAGE HOME ─────────────────────────────────────────────────────
  if (browsePath.length === 2) {
    return <LanguageRootView targetLang={apiLangName} targetLangCode={targetLangCode} />;
  }

  // ── DICTIONARY ROOT (shows just the "Vocabulary" button) ──────────────
  if (browsePath[2] === "dictionary" && browsePath.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        <CardButton
          onClick={() => pushBrowse("vocabulary")}
          className="min-h-[64px] py-3 flex items-center justify-center text-center"
        >
          <span className="font-semibold">{t("vocabulary") || "Vocabulary"}</span>
        </CardButton>
      </div>
    );
  }

  // ── DICTIONARY / VOCABULARY (categories grid) ─────────────────────────
  if (browsePath[2] === "dictionary" && browsePath[3] === "vocabulary" && browsePath.length === 4) {
    return <LanguageDictionaryView targetLang={apiLangName} targetLangCode={targetLangCode} />;
  }

  // ── ALPHABET ──────────────────────────────────────────────────────────
  if (browsePath[2] === ALPHABET_SEGMENT) {
    return <AlphabetView targetLang={targetLangCode as any} uiLang={i18nLang} />;
  }

  // ── LESSONS ───────────────────────────────────────────────────────────
  if (browsePath[2] === "lessons") {
    return <LessonsView lang={apiLangName} />;
  }

  // ── DICTIONARY MARKED BRANCH ──────────────────────────────────────────
  if (browsePath[2] === "_marked") {
    const catId = browsePath[3];
    const subId = browsePath[4];

    if (loading) return <div className="px-4 text-sm opacity-50">Syncing definitions...</div>;
    if (categories.length > 0 && !categories.includes(catId)) return <div className="px-4 text-sm">{t("notFound")}</div>;
    if (subcategories.length > 0 && !subcategories.includes(subId)) return <div className="px-4 text-sm">{t("notFound")}</div>;

    if (browsePath.length === 5) {
      return <MarkedSubcategoryWordsView categoryId={catId} subcategoryId={subId} targetLang={targetLangCode} initialSlugs={wordSlugs} />;
    }

    return (
      <WordDetailResolver
        categoryId={catId}
        subcategoryId={subId}
        wordId={browsePath[5]}
        apiLangName={apiLangName}
        builtInSlugs={wordSlugs}
      />
    );
  }

  // ── DICTIONARY → VOCABULARY → CATEGORY/… ──────────────────────────────
  if (browsePath[2] === "dictionary" && browsePath[3] === "vocabulary") {
    const categoryId   = browsePath[4];
    const subcategoryId = browsePath[5];
    const wordId       = browsePath[6];

    const customCategory = customCategories.find(c => c.id === categoryId);
    const isCustomCategory = !!customCategory;

    if (categories.length > 0 && !categories.includes(categoryId) && !isCustomCategory) {
      return <div className="px-4 text-sm">{t("notFound")}</div>;
    }

    // /dictionary/vocabulary/<cat>
    if (browsePath.length === 5) {
      const mockCategoryStructure = {
        id: categoryId,
        name: customCategory?.name ?? { Dutch: categoryId, English: categoryId, Arabic: categoryId },
        subcategories: subcategories.map(id => ({
          id,
          name: { Dutch: id, English: id, Arabic: id },
          words: wordSlugs.map(wid => ({ id: wid })),
        })),
      };
      return <SubcategoriesView category={mockCategoryStructure as any} onOpen={(id) => pushBrowse(id)} />;
    }

    const isCustomSub   = customSubcategories.some(c => c.id === subcategoryId);
    const isValidSub    = subcategories.includes(subcategoryId) || isCustomSub || subcategories.length === 0;

    if (!isValidSub) return <div className="px-4 text-sm">{t("notFound")}</div>;

    // /dictionary/vocabulary/<cat>/<sub>
    if (browsePath.length === 6) {
      return (
        <WordsView
          categoryId={categoryId}
          subcategoryId={subcategoryId}
          targetLang={targetLangCode}
          apiLangName={apiLangName}
          initialSlugs={wordSlugs}
          onOpenWord={(id) => pushBrowse(id)}
          onSelectedRecall={(wordIds) => {
            setRecallReturnPath(browsePath);
            setActiveRecall({
              scope: "word",
              categoryId,
              subcategoryId,
              wordIds,
            });
            navigate("/Recall");
          }}
        />
      );
    }

    // /dictionary/vocabulary/<cat>/<sub>/<word>
    return (
      <WordDetailResolver
        categoryId={categoryId}
        subcategoryId={subcategoryId}
        wordId={wordId}
        apiLangName={apiLangName}
        builtInSlugs={wordSlugs}
      />
    );
  }

  return <div className="px-4 text-sm">{t("notFound")}</div>;
}

/* ──────────────────────── WordDetailResolver ────────────────────────── */

function WordDetailResolver({ categoryId, subcategoryId, wordId, apiLangName, builtInSlugs }: {
  categoryId: string;
  subcategoryId: string;
  wordId: string;
  apiLangName: SupportedLang;
  builtInSlugs: string[];
}) {
  const { t } = useCourseLanguage();
  const { customWords, applyOverride } = useCustomWords(categoryId, subcategoryId);
  const [apiWord, setApiWord] = useState<WordDetail | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!builtInSlugs.includes(wordId)) return;
    setFetching(true);
    fetch(`${BACKEND_BASE_URL}/api/word-detail?lang=${encodeURIComponent(apiLangName)}&section=${DEFAULT_SECTION}&category=${encodeURIComponent(categoryId)}&subcategory=${encodeURIComponent(subcategoryId)}&wordId=${encodeURIComponent(wordId)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setApiWord(wordDetailFromApi(wordId, data, apiLangName));
      })
      .catch(err => console.error(err))
      .finally(() => setFetching(false));
  }, [wordId, builtInSlugs, apiLangName, categoryId, subcategoryId]);

  if (fetching) return <div className="px-4 text-sm opacity-50">Syncing word details...</div>;

  const raw = builtInSlugs.includes(wordId) ? apiWord : customWords.find(w => w.id === wordId);

  if (!raw) return <div className="px-4 text-sm">{t("notFound")}</div>;
  const word     = applyOverride(raw);
  const isCustom = customWords.some(w => w.id === wordId);
  return (
    <WordDetailView
      categoryId={categoryId}
      subcategoryId={subcategoryId}
      word={word}
      isCustom={isCustom}
    />
  );
}

/* ──────────────────── MarkedSubcategoryWordsView ────────────────────── */

function MarkedSubcategoryWordsView({ categoryId, subcategoryId, targetLang, initialSlugs }: {
  categoryId: string;
  subcategoryId: string;
  targetLang: string;
  initialSlugs: string[];
}) {
  const { setBrowsePath } = useApp();
  const { map } = useMarkedWords();
  
  const markedIds = useMemo(() => new Set(map[targetLang as any] || []), [map, targetLang]);
  const words = initialSlugs.filter(id => markedIds.has(id));

  return (
    <div className="px-4 w-full space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {words.map(slug => (
          <CardButton
            key={slug}
            onClick={() => setBrowsePath(["language", targetLang, "_marked", categoryId, subcategoryId, slug])}
            className="min-h-[56px] py-2 px-3 flex items-center justify-center text-center"
          >
            <span className="font-semibold text-sm">{slug}</span>
          </CardButton>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────── WordsView ─────────────────────────────── */

function WordsView({
  categoryId, subcategoryId, targetLang, apiLangName, initialSlugs, onOpenWord, onSelectedRecall,
}: {
  categoryId: string;
  subcategoryId: string;
  targetLang: string;
  apiLangName: SupportedLang;
  initialSlugs: string[];
  onOpenWord: (wordId: string) => void;
  onSelectedRecall: (wordIds: string[]) => void;
}) {
  const { t, courseLang } = useCourseLanguage();
  const { recallQueue } = useApp();
  const { customWords, addCustomWord, applyOverride } = useCustomWords(categoryId, subcategoryId);
  const { isMarked }    = useMarkedWords();
  const { isFavorite }  = useFavoriteWords();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  type FilterMode = "all" | "marked" | "favorites" | "custom";
  const [filter, setFilter] = useState<FilterMode>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [resolvedWords, setResolvedWords] = useState<any[]>([]);

  useEffect(() => {
    if (initialSlugs.length === 0) {
      setResolvedWords([]);
      return;
    }
    
    // Batch fetch details or construct matching structures dynamically
    Promise.all(
      initialSlugs.map(slug =>
        fetch(`${BACKEND_BASE_URL}/api/word-detail?lang=${encodeURIComponent(apiLangName)}&section=${DEFAULT_SECTION}&category=${encodeURIComponent(categoryId)}&subcategory=${encodeURIComponent(subcategoryId)}&wordId=${encodeURIComponent(slug)}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => data ? wordDetailFromApi(slug, data, apiLangName) : null)
      )
    ).then(results => {
      const filteredResults = results.filter(Boolean) as any[];
      setResolvedWords(filteredResults);
    });
  }, [initialSlugs, apiLangName, categoryId, subcategoryId]);

  const allWords: any[] = useMemo(() => {
    return [...resolvedWords, ...customWords].map(applyOverride);
  }, [resolvedWords, customWords, applyOverride]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "marked":    return allWords.filter(w => isMarked(courseLang as any, w.id));
      case "favorites": return allWords.filter(w => isFavorite(courseLang as any, w.id));
      case "custom":    return allWords.filter(w => customWords.some(c => c.id === w.id));
      default:          return allWords;
    }
  }, [allWords, filter, courseLang, isMarked, isFavorite, customWords]);

  const now = Date.now();
  const wordCooling = (wid: string) => {
    const item = recallQueue.find(
      r => r.scope === "word" && r.categoryId === categoryId && r.subcategoryId === subcategoryId && r.wordId === wid,
    );
    return !!item && item.readyAt > now;
  };
  const subItem    = recallQueue.find(r => r.scope === "subcategory" && r.categoryId === categoryId && r.subcategoryId === subcategoryId);
  const subCooling = !!subItem && subItem.readyAt > now;

  const toggle = (id: string) => {
    if (wordCooling(id)) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filterLabel = filter === "all"       ? (t("all")       || "All")
    : filter === "marked"    ? (t("marked")    || "Marked")
    : filter === "favorites" ? (t("favorites") || "Favorites")
    : (t("custom") || "Custom");

  const cycleFilter = () => {
    const order: FilterMode[] = ["all", "marked", "favorites", "custom"];
    setFilter(f => order[(order.indexOf(f) + 1) % order.length]);
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
        <Button onClick={cycleFilter} active={filter !== "all"} aria-label="Filter">
          <Filter className="h-4 w-4 mr-2" />
          {filterLabel}
        </Button>
        <Button onClick={() => setAddOpen(true)} aria-label="Add word">
          <Plus className="h-4 w-4 mr-2" />
          {t("addWord") || "Add"}
        </Button>
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
        <Button active fullWidth onClick={() => onSelectedRecall(Array.from(selected))}>
          <Brain className="h-4 w-4 mr-2" />
          {(t("recallSelected") || "Recall selected")} ({selected.size})
        </Button>
      )}

      <div className="grid grid-cols-2 gap-3">
        {filtered.map(word => {
          const isSel   = selected.has(word.id);
          const cooling = wordCooling(word.id);
          const wText   = word.id;
          const wPron   = undefined;

          return (
            <CardButton
              key={word.id}
              onClick={() => { if (selectMode) toggle(word.id); else onOpenWord(word.id); }}
              disabled={selectMode && cooling}
              className={cn(
                "min-h-[80px] flex flex-col justify-between relative",
                selectMode && isSel && "bg-foreground text-background border-foreground hover:bg-foreground hover:text-background hover:border-foreground",
                selectMode && cooling && "opacity-50",
              )}
            >
              {selectMode && (
                <span className="absolute top-2 right-2">
                  {cooling ? <Clock className="h-4 w-4 opacity-60" />
                    : isSel ? <CheckSquare className="h-4 w-4" />
                    : <Square className="h-4 w-4 opacity-60" />}
                </span>
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{wText}</span>
                {wPron && <span className="text-[11px] opacity-60 font-mono mt-0.5">/{wPron}/</span>}
              </div>
            </CardButton>
          );
        })}
      </div>

      <WordEditDialog open={addOpen} onOpenChange={setAddOpen} onSave={(w) => addCustomWord(w)} />
    </div>
  );
}

/* ──────────────────────── LanguagePicker ────────────────────────────── */

function LanguagePicker({ interfaceLanguage, onPick }: {
  interfaceLanguage: string | null;
  onPick: (code: string) => void;
}) {
  const { uiLang } = useCourseLanguage();
  const [pickOpen, setPickOpen] = useState(false);
  const available = TARGET_LANGS.filter(l => l.code !== interfaceLanguage);
  return (
    <div className="px-4 space-y-3 w-full">
      <div className="flex justify-end">
        <Button onClick={() => setPickOpen(true)} aria-label="Add language">
          <Plus className="h-4 w-4 mr-1" />
          {uiLang === "nl" ? "Taal" : uiLang === "ar" ? "لغة" : "Language"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {available.map(l => (
          <CardButton
            key={l.code}
            onClick={() => onPick(l.code)}
            className="min-h-[64px] py-3 flex items-center justify-center text-center"
          >
            <span className="font-semibold">{l.label}</span>
          </CardButton>
        ))}
      </div>

      <FullPageDialog
        open={pickOpen}
        onOpenChange={setPickOpen}
        title={uiLang === "nl" ? "Taal toevoegen" : uiLang === "ar" ? "إضافة لغة" : "Add language"}
      >
        <div className="space-y-3">
          <p className="text-xs opacity-70">
            {uiLang === "nl" ? "Kies een extra taal om te verkennen."
              : uiLang === "ar" ? "اختر لغة إضافية لاستكشافها."
              : "Pick another language to explore."}
          </p>
          <div className="grid gap-2">
            {EXTRA_LANGS.map(l => (
              <CardButton
                key={l.code}
                onClick={() => { setPickOpen(false); onPick(l.code); }}
                className="min-h-[56px] py-2 px-3 flex items-between justify-between gap-3"
              >
                <span className="font-semibold">{l.label}</span>
                {l.preview && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border-2 border-border opacity-70">
                    Preview
                  </span>
                )}
              </CardButton>
            ))}
          </div>
        </div>
      </FullPageDialog>
    </div>
  );
}