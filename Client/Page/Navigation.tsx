import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, CheckSquare, Clock, Filter, Plus, Square, X } from "lucide-react";
import { CardButton } from "Client/Component/UI/card-button";
import { Button } from "Client/Component/UI/button";
import { Container } from "Client/Component/UI/container";
import { TitleBar } from "Client/Component/UI/title-bar";
import { FullPageDialog } from "Client/Component/UI/full-page-dialog";
import { useApp } from "Client/Context/App";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { useMarkedWords } from "Client/Hook/useMarkedWords";
import { useCustomWords } from "Client/Hook/useCustomWords";
import { useCustomCollections } from "Client/Hook/useCustomCollections";
import { useFavoriteWords } from "Client/Hook/useFavoriteWords";
import {
  categories, getWordsForCategory, localizedName, getWordText,
  type Lang, type WordLang, type WordDetail,
} from "Server/Data/courseData";
import { RecallButton } from "Client/Component/RecallButton";
import { ALPHABET_SEGMENT } from "Client/Library/navigation";
import { cn } from "Client/Library/utils";
import { WordEditDialog } from "Client/Component/Word/WordEditDialog";
import { LessonsView } from "Client/Component/Lesson/LessonsView";
import { AlphabetView } from "Client/Component/View/Alphabet";
import { WordDetailView } from "Client/Component/View/Word";
import { ChessBranch, EmptyState } from "Client/Component/View/Chess";
import { SubcategoriesView } from "Client/Component/View/Subcategory";
import { LanguageRootView } from "Client/Component/View/Language";

const TARGET_LANGS: { code: Lang; label: string }[] = [
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
];

const EXTRA_LANGS: { code: string; label: string; preview?: boolean }[] = [
  { code: "ps", label: "پښتو (Pashto)", preview: true },
];

const LANGUAGE_LABEL: Record<Lang, string> = { nl: "Taal",      en: "Language", ar: "اللغة"    };
const CHESS_LABEL:    Record<Lang, string> = { nl: "Schaken",   en: "Chess",    ar: "الشطرنج"  };

export default function HomePage() {
  const {
    browsePath, pushBrowse, setBrowsePath,
    setLearningLanguage, interfaceLanguage,
    setActiveRecall, setRecallReturnPath,
  } = useApp();
  const { uiLang, t } = useCourseLanguage();
  const navigate = useNavigate();

  // ── ROOT ──────────────────────────────────────────────────────────────
  if (browsePath.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        <CardButton
          onClick={() => pushBrowse("language")}
          className="min-h-[64px] py-3 flex items-center justify-center text-center"
        >
          <span className="font-semibold">{LANGUAGE_LABEL[uiLang]}</span>
        </CardButton>
        <CardButton
          onClick={() => pushBrowse("chess")}
          className="min-h-[64px] py-3 flex items-center justify-center text-center"
        >
          <span className="font-semibold">{CHESS_LABEL[uiLang]}</span>
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

  // ── PASHTO PREVIEW ────────────────────────────────────────────────────
  if (browsePath[0] === "language" && browsePath[1] === "ps") {
    return <PashtoComingSoon />;
  }

  const targetLang = browsePath[1] as Lang;

  // ── LANGUAGE HOME ─────────────────────────────────────────────────────
  if (browsePath.length === 2) {
    return <LanguageRootView targetLang={targetLang} />;
  }

  // ── ALPHABET ──────────────────────────────────────────────────────────
  if (browsePath[2] === ALPHABET_SEGMENT) {
    return <AlphabetView targetLang={targetLang} uiLang={uiLang} />;
  }

  // ── LESSONS ───────────────────────────────────────────────────────────
  if (browsePath[2] === "lessons") {
    return <LessonsView lang={targetLang} />;
  }

  // ── DICTIONARY MARKED BRANCH: ["language", lang, "_marked", catId, subId, wordId?] ──
  if (browsePath[2] === "_marked") {
    const cat = categories.find(c => c.id === browsePath[3]);
    const sub = cat?.subcategories.find(s => s.id === browsePath[4]);
    if (!cat || !sub) return <div className="px-4 text-sm">{t("notFound")}</div>;
    if (browsePath.length === 5) {
      return <MarkedSubcategoryWordsView cat={cat} sub={sub} targetLang={targetLang} />;
    }
    return (
      <WordDetailResolver
        categoryId={cat.id}
        subcategoryId={sub.id}
        wordId={browsePath[5]}
        builtIn={sub.words}
      />
    );
  }

  // ── SUBCATEGORIES ─────────────────────────────────────────────────────
  const category = categories.find(c => c.id === browsePath[2]);
  if (!category) return <div className="px-4 text-sm">{t("notFound")}</div>;

  if (browsePath.length === 3) {
    return <SubcategoriesView category={category} onOpen={(id) => pushBrowse(id)} />;
  }

  // ── WORDS ─────────────────────────────────────────────────────────────
  const builtInSub = category.subcategories.find(s => s.id === browsePath[3]);
  const subId      = browsePath[3];
  const resolvedSub = builtInSub ?? { id: subId, name: { nl: subId, en: subId }, words: [] };

  if (browsePath.length === 4 && resolvedSub.words.length === 0 && builtInSub) {
    return <EmptyState uiLang={uiLang} kind="words" />;
  }

  if (browsePath.length === 4) {
    return (
      <WordsView
        categoryId={category.id}
        subcategoryId={resolvedSub.id}
        targetLang={targetLang}
        onOpenWord={(id) => pushBrowse(id)}
        onSelectedRecall={(wordIds) => {
          setRecallReturnPath(browsePath);
          setActiveRecall({
            scope: "word",
            categoryId: category.id,
            subcategoryId: resolvedSub.id,
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
      categoryId={category.id}
      subcategoryId={resolvedSub.id}
      wordId={browsePath[4]}
      builtIn={resolvedSub.words}
    />
  );
}

/* ──────────────────────── WordDetailResolver ────────────────────────── */

function WordDetailResolver({ categoryId, subcategoryId, wordId, builtIn }: {
  categoryId: string;
  subcategoryId: string;
  wordId: string;
  builtIn: WordDetail[];
}) {
  const { t } = useCourseLanguage();
  const { customWords, applyOverride } = useCustomWords(categoryId, subcategoryId);
  const raw  = builtIn.find(w => w.id === wordId) || customWords.find(w => w.id === wordId);
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

function MarkedSubcategoryWordsView({ cat, sub, targetLang }: {
  cat: typeof categories[number];
  sub: typeof categories[number]["subcategories"][number];
  targetLang: Lang;
}) {
  const { setBrowsePath } = useApp();
  const { map } = useMarkedWords();
  const markedIds = useMemo(() => new Set(map[targetLang] || []), [map, targetLang]);
  const words = sub.words.filter(w => markedIds.has(w.id));
  return (
    <div className="px-4 w-full space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {words.map(w => (
          <CardButton
            key={w.id}
            onClick={() => setBrowsePath(["language", targetLang, "_marked", cat.id, sub.id, w.id])}
            className="min-h-[56px] py-2 px-3 flex items-center justify-center text-center"
          >
            <span className="font-semibold text-sm">{getWordText(w, targetLang as WordLang)}</span>
          </CardButton>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────── WordsView ─────────────────────────────── */

function WordsView({
  categoryId, subcategoryId, targetLang, onOpenWord, onSelectedRecall,
}: {
  categoryId: string;
  subcategoryId: string;
  targetLang: Lang;
  onOpenWord: (wordId: string) => void;
  onSelectedRecall: (wordIds: string[]) => void;
}) {
  const category    = categories.find(c => c.id === categoryId)!;
  const builtIn     = category.subcategories.find(s => s.id === subcategoryId);
  const subcategory = builtIn ?? { id: subcategoryId, name: { nl: subcategoryId, en: subcategoryId }, words: [] };
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

  const allWords: WordDetail[] = useMemo(
    () => [...subcategory.words, ...customWords].map(applyOverride),
    [subcategory.words, customWords, applyOverride],
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case "marked":    return allWords.filter(w => isMarked(courseLang, w.id));
      case "favorites": return allWords.filter(w => isFavorite(courseLang, w.id));
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
  const subItem   = recallQueue.find(r => r.scope === "subcategory" && r.categoryId === categoryId && r.subcategoryId === subcategoryId);
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
          const wText   = getWordText(word, targetLang as WordLang);
          const wPron   = (targetLang === "ar" ? word.ar?.pronunciation : word[targetLang as WordLang]?.pronunciation) ?? undefined;
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