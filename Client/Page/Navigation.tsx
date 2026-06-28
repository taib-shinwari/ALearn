import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, CheckSquare, Clock, Filter, Plus, Square, X } from "lucide-react";
import { CardButton } from "Client/Component/UI/card-button";
import { Button } from "Client/Component/UI/button";
import { Container } from "Client/Component/UI/container";
import { FullPageDialog } from "Client/Component/UI/full-page-dialog";
import { useApp } from "Client/Context/App";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { useMarkedWords } from "Client/Hook/useMarkedWords";
import { useCustomWords } from "Client/Hook/useCustomWords";
import { useFavoriteWords } from "Client/Hook/useFavoriteWords";
import { RecallButton } from "Client/Component/RecallButton";
import { ALPHABET_SEGMENT } from "Client/Library/navigation";
import { cn } from "Client/Library/utils";
import { WordEditDialog } from "Client/Component/Word/WordEditDialog";
import { LessonsView } from "Client/Component/Lesson/LessonsView";
import { AlphabetView } from "Client/Component/View/Alphabet";
import { WordDetailView } from "Client/Component/View/Word";
import { ChessBranch, EmptyState } from "Client/Component/View/Chess";
import { SubcategoriesView } from "Client/Component/View/Subcategory";
import { LanguageDictionaryView, LanguageRootView } from "Client/Component/View/Language";

// ── NEW API IMPORTS ───────────────────────────────────────────────────
import {
  getCategories,
  getSubcategories,
  getWordSlugs,
  getWord,
  getWordsInSubcategory,
  type SupportedLang,
  type SectionType,
  type WordEntry
} from "Server/API/Language";

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

export default function HomePage() {
  const {
    browsePath, pushBrowse, setBrowsePath,
    setLearningLanguage, interfaceLanguage,
    setActiveRecall, setRecallReturnPath,
  } = useApp();
  const { uiLang, i18nLang, t } = useCourseLanguage();
  const navigate = useNavigate();

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

  const targetLangCode = browsePath[1];
  const apiLangName = MAP_LANG_CODE[targetLangCode] || "English";

  // ── LANGUAGE HOME ─────────────────────────────────────────────────────
  if (browsePath.length === 2) {
    return <LanguageRootView targetLang={apiLangName} targetLangCode={targetLangCode} />;
  }

  // ── DICTIONARY ROOT ───────────────────────────────────────────────────
  if (browsePath[2] === "dictionary") {
    return <LanguageDictionaryView targetLang={apiLangName} targetLangCode={targetLangCode} />;
  }

  // ── ALPHABET ──────────────────────────────────────────────────────────
  if (browsePath[2] === ALPHABET_SEGMENT) {
    return <AlphabetView targetLang={targetLangCode as any} uiLang={i18nLang} />;
  }

  // ── LESSONS ───────────────────────────────────────────────────────────
  if (browsePath[2] === "lessons") {
    return <LessonsView lang={apiLangName} langCode={targetLangCode} />;
  }

  // ── DICTIONARY MARKED BRANCH: ["language", lang, "_marked", catId, subId, wordId?] ──
  if (browsePath[2] === "_marked") {
    const catId = browsePath[3];
    const subId = browsePath[4];
    
    const availableCategories = getCategories(apiLangName, DEFAULT_SECTION);
    if (!availableCategories.includes(catId)) return <div className="px-4 text-sm">{t("notFound")}</div>;

    const availableSubcategories = getSubcategories(apiLangName, DEFAULT_SECTION, catId);
    if (!availableSubcategories.includes(subId)) return <div className="px-4 text-sm">{t("notFound")}</div>;

    if (browsePath.length === 5) {
      return <MarkedSubcategoryWordsView categoryId={catId} subcategoryId={subId} targetLang={targetLangCode} />;
    }

    const wordSlugs = getWordSlugs(apiLangName, DEFAULT_SECTION, catId, subId);
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

  // ── SUBCATEGORIES ─────────────────────────────────────────────────────
  const categoryId = browsePath[2];
  const allCategories = getCategories(apiLangName, DEFAULT_SECTION);
  
  if (!allCategories.includes(categoryId)) return <div className="px-4 text-sm">{t("notFound")}</div>;

  if (browsePath.length === 3) {
    const subIds = getSubcategories(apiLangName, DEFAULT_SECTION, categoryId);
    const mockCategoryStructure = {
      id: categoryId,
      subcategories: subIds.map(id => ({ id, name: { nl: id, en: id } }))
    };

    return <SubcategoriesView category={mockCategoryStructure as any} onOpen={(id) => pushBrowse(id)} />;
  }

  // ── WORDS ─────────────────────────────────────────────────────────────
  const subcategoryId = browsePath[3];
  const availableSubs = getSubcategories(apiLangName, DEFAULT_SECTION, categoryId);
  const isValidSub = availableSubs.includes(subcategoryId);

  const wordSlugs = isValidSub ? getWordSlugs(apiLangName, DEFAULT_SECTION, categoryId, subcategoryId) : [];

  if (browsePath.length === 4 && wordSlugs.length === 0 && isValidSub) {
    return <EmptyState uiLang={i18nLang} kind="words" />;
  }

  if (browsePath.length === 4) {
    return (
      <WordsView
        categoryId={categoryId}
        subcategoryId={subcategoryId}
        targetLang={targetLangCode}
        apiLangName={apiLangName}
        onOpenWord={(id) => pushBrowse(id)}
        onSelectedRecall={(wordIds) => {
          setRecallReturnPath(browsePath);
          setActiveRecall({
            scope: "word",
            categoryId: categoryId,
            subcategoryId: subcategoryId,
            wordIds,
          });
          navigate("/Recall");
        }}
      />
    );
  }

  // ── WORD DETAIL ───────────────────────────────────────────────────────
  return (
    <WordDetailResolver
      categoryId={categoryId}
      subcategoryId={subcategoryId}
      wordId={browsePath[4]}
      apiLangName={apiLangName}
      builtInSlugs={wordSlugs}
    />
  );
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

  let raw: any = null;
  if (builtInSlugs.includes(wordId)) {
    const apiData = getWord(apiLangName, DEFAULT_SECTION, categoryId, subcategoryId, wordId);
    if (apiData) {
      raw = { id: wordId, value: apiData };
    }
  } else {
    raw = customWords.find(w => w.id === wordId);
  }

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

function MarkedSubcategoryWordsView({ categoryId, subcategoryId, targetLang }: {
  categoryId: string;
  subcategoryId: string;
  targetLang: string;
}) {
  const { setBrowsePath } = useApp();
  const { map } = useMarkedWords();
  const apiLangName = MAP_LANG_CODE[targetLang] || "English";
  
  const markedIds = useMemo(() => new Set(map[targetLang as any] || []), [map, targetLang]);
  const slugs = getWordSlugs(apiLangName, DEFAULT_SECTION, categoryId, subcategoryId);
  const words = slugs.filter(id => markedIds.has(id));

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
  categoryId, subcategoryId, targetLang, apiLangName, onOpenWord, onSelectedRecall,
}: {
  categoryId: string;
  subcategoryId: string;
  targetLang: string;
  apiLangName: SupportedLang;
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

  const allWords: any[] = useMemo(() => {
    const slugs = getWordSlugs(apiLangName, DEFAULT_SECTION, categoryId, subcategoryId);
    const apiWordsMapped = slugs.map(slug => ({
      id: slug,
      value: getWord(apiLangName, DEFAULT_SECTION, categoryId, subcategoryId, slug)
    }));
    return [...apiWordsMapped, ...customWords].map(applyOverride);
  }, [categoryId, subcategoryId, apiLangName, customWords, applyOverride]);

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
                className="min-h-[56px] py-2 px-3 flex items-center justify-between gap-3"
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

/* ──────────────────────── PashtoComingSoon ──────────────────────────── */

function PashtoComingSoon() {
  const { uiLang } = useCourseLanguage();
  return (
    <div className="px-4 max-w-md mx-auto py-8">
      <Container className="p-6 text-center space-y-3">
        <h2 className="text-2xl font-bold">پښتو</h2>
        <p className="text-sm opacity-70">
          {uiLang === "nl" ? "Pashto is in voorbeeld. Inhoud wordt nog toegevoegd."
            : uiLang === "ar" ? "البشتو في وضع المعاينة. المحتوى لا يزال قيد الإضافة."
            : "Pashto is in preview — content is still being added."}
        </p>
        <p className="text-xs opacity-60">
          {uiLang === "nl" ? "Alfabet, lessen en woordenboek volgen binnenkort."
            : uiLang === "ar" ? "الأبجدية والدروس والقاموس قادمة قريبًا."
            : "Alphabet, lessons, and dictionary coming soon."}
        </p>
      </Container>
    </div>
  );
}