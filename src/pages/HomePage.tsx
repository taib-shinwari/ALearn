import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Volume2, Bookmark, BookmarkCheck, CheckSquare, Square, Brain, X, Clock, Star, Pencil, Plus, Filter } from "lucide-react";
import { CardButton } from "@/components/ui/card-button";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { TitleBar } from "@/components/ui/title-bar";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useMarkedWords } from "@/hooks/useMarkedWords";
import { useFavoriteWords } from "@/hooks/useFavoriteWords";
import { useCustomWords } from "@/hooks/useCustomWords";
import { useCustomCollections } from "@/hooks/useCustomCollections";
import {
  categories, getWordsForCategory, localizedName, getWordText,
  type Lang, type WordLang, type WordDetail,
} from "@/data/courseData";
import { RecallButton } from "@/components/RecallButton";
import { speak, isSpeechAvailable } from "@/components/practice/speech";
import { ALPHABET_SEGMENT } from "@/lib/navigation";
import { FullPageDialog } from "@/components/ui/full-page-dialog";
import { cn } from "@/lib/utils";
import { fetchWordImage } from "@/lib/wordImage";
import { chessLevels, cName } from "@/data/chessData";
import { ChessLessonView } from "@/components/chess/ChessLessonView";
import { ChessPlayView } from "@/components/chess/ChessPlayView";
import { ChessPuzzleView } from "@/components/chess/ChessPuzzleView";
import { PUZZLES } from "@/data/chessPuzzles";
import { findArabicForms } from "@/data/arabicForms";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WordEditDialog } from "@/components/word/WordEditDialog";
import { LessonsView } from "@/components/lessons/LessonsView";

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

const CHESS_LABEL: Record<Lang, string> = {
  nl: "Schaken", en: "Chess", ar: "الشطرنج",
};

export default function HomePage() {
  const {
    browsePath, pushBrowse, setBrowsePath,
    setLearningLanguage, interfaceLanguage,
    setActiveRecall, setRecallReturnPath,
  } = useApp();
  const { uiLang, t } = useCourseLanguage();
  const navigate = useNavigate();

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
        <CardButton
          onClick={() => pushBrowse("chess")}
          className="min-h-[64px] py-3 flex items-center justify-center text-center"
        >
          <span className="font-semibold">{CHESS_LABEL[uiLang]}</span>
        </CardButton>
      </div>
    );
  }

  // ── CHESS BRANCH ────────────────────────────────────────────────────
  if (browsePath[0] === "chess") {
    return <ChessBranch />;
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
    const alphabetSub = categories
      .find(c => c.id === "zelfstandig-naamwoord")
      ?.subcategories.find(s => s.id === "alfabet");
    const alphabetCount = alphabetSub?.words.length ?? 0;
    return (
      <LanguageRootView
        targetLang={targetLang}
        alphabetCount={alphabetCount}
        onOpenAlphabet={() => pushBrowse(ALPHABET_SEGMENT)}
        onOpenCategory={(id) => pushBrowse(id)}
      />
    );
  }

  // ── alphabet ────────────────────────────────────────────────────────
  if (browsePath[2] === ALPHABET_SEGMENT) {
    return <AlphabetView targetLang={targetLang} uiLang={uiLang} />;
  }

  // ── lessons ─────────────────────────────────────────────────────────
  if (browsePath[2] === "lessons") {
    return <LessonsView lang={targetLang} />;
  }

  // ── subcategories ──────────────────────────────────────────────────
  const category = categories.find(c => c.id === browsePath[2]);
  if (!category) return <div className="px-4 text-sm">{t("notFound")}</div>;

  if (browsePath.length === 3) {
    return <SubcategoriesView category={category} onOpen={(id) => pushBrowse(id)} />;
  }

  // ── words ──────────────────────────────────────────────────────────
  const builtInSub = category.subcategories.find(s => s.id === browsePath[3]);
  // Build a virtual subcategory if it's a user-created collection (id only known via storage).
  const subId = browsePath[3];
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
          navigate("/recall");
        }}
      />
    );
  }

  // ── word detail ────────────────────────────────────────────────────
  return (
    <WordDetailResolver
      categoryId={category.id}
      subcategoryId={resolvedSub.id}
      wordId={browsePath[4]}
      builtIn={resolvedSub.words}
    />
  );
}

function WordDetailResolver({ categoryId, subcategoryId, wordId, builtIn }: {
  categoryId: string; subcategoryId: string; wordId: string; builtIn: WordDetail[];
}) {
  const { t } = useCourseLanguage();
  const { customWords, applyOverride } = useCustomWords(categoryId, subcategoryId);
  const raw = builtIn.find(w => w.id === wordId) || customWords.find(w => w.id === wordId);
  if (!raw) return <div className="px-4 text-sm">{t("notFound")}</div>;
  const word = applyOverride(raw);
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

/* ──────────────────── Language root view ──────────────────── */

function LanguageRootView({
  targetLang, alphabetCount, onOpenAlphabet, onOpenCategory,
}: {
  targetLang: Lang;
  alphabetCount: number;
  onOpenAlphabet: () => void;
  onOpenCategory: (id: string) => void;
}) {
  const { uiLang, t } = useCourseLanguage();
  const rootKey = `__lang_${targetLang}`;
  const { collections, addCollection, removeCollection } = useCustomCollections(rootKey);
  const { pushBrowse } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [view, setView] = useState<"menu" | "dictionary">("menu");

  if (view === "menu") {
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        <CardButton
          onClick={() => pushBrowse("lessons")}
          className="min-h-[64px] py-3 flex items-center justify-center text-center"
        >
          <span className="font-semibold">{uiLang === "nl" ? "Lessen" : uiLang === "ar" ? "دروس" : "Lessons"}</span>
        </CardButton>
        <CardButton
          onClick={() => setView("dictionary")}
          className="min-h-[64px] py-3 flex items-center justify-center text-center"
        >
          <span className="font-semibold">{uiLang === "nl" ? "Woordenboek" : uiLang === "ar" ? "قاموس" : "Dictionary"}</span>
        </CardButton>
      </div>
    );
  }

  return (
    <DictionaryBrowseView
      targetLang={targetLang}
      rootKey={rootKey}
      collections={collections}
      addCollection={addCollection}
      removeCollection={removeCollection}
      onBack={() => setView("menu")}
      menuOpen={menuOpen}
      setMenuOpen={setMenuOpen}
      addOpen={addOpen}
      setAddOpen={setAddOpen}
      name={name}
      setName={setName}
    />
  );
}

/* ──────────────────── Dictionary (marked words) view ──────────────────── */

function DictionaryBrowseView({
  targetLang, rootKey, collections, addCollection, removeCollection,
  onBack, menuOpen, setMenuOpen, addOpen, setAddOpen, name, setName,
}: {
  targetLang: Lang;
  rootKey: string;
  collections: { id: string; name: { nl: string; en: string; ar?: string } }[];
  addCollection: (rootKey: string, name: string) => void;
  removeCollection: (rootKey: string, id: string) => void;
  onBack: () => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
  name: string;
  setName: (v: string) => void;
}) {
  const { uiLang, t } = useCourseLanguage();
  const { pushBrowse, setBrowsePath } = useApp();
  const { map } = useMarkedWords();
  const markedIds = useMemo(() => new Set(map[targetLang] || []), [map, targetLang]);

  // Group marked words by category (only categories that have at least one marked word).
  const groups = useMemo(() => {
    return categories
      .map(cat => {
        const words = getWordsForCategory(cat.id).filter(w => markedIds.has(w.id));
        return { cat, words };
      })
      .filter(g => g.words.length > 0);
  }, [markedIds]);

  return (
    <div className="px-4 w-full space-y-3">
      <div className="flex justify-end relative">
        <Button onClick={() => setMenuOpen(!menuOpen)} aria-label="Add">
          <Plus className="h-4 w-4 mr-1" /> {t("add") || "Add"}
        </Button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 z-20 rounded-[12px] border-2 border-border bg-background shadow-lg overflow-hidden">
            <button
              className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
              onClick={() => { setMenuOpen(false); setAddOpen(true); }}
            >
              {t("collection") || "Collection"}
            </button>
          </div>
        )}
      </div>

      {groups.length === 0 && collections.length === 0 ? (
        <Container>
          <p className="text-sm text-center opacity-70">
            {uiLang === "nl"
              ? "Je woordenboek is leeg. Voltooi lessen om woorden toe te voegen."
              : uiLang === "ar"
              ? "قاموسك فارغ. أكمل الدروس لإضافة الكلمات."
              : "Your dictionary is empty. Complete lessons to add words."}
          </p>
        </Container>
      ) : (
        <div className="space-y-4">
          {groups.map(({ cat, words }) => (
            <div key={cat.id} className="space-y-2">
              <TitleBar>{localizedName(cat.name, uiLang)}</TitleBar>
              <div className="grid grid-cols-2 gap-3">
                {words.map(w => (
                  <CardButton
                    key={w.id}
                    onClick={() => {
                      const sub = cat.subcategories.find(s => s.words.some(x => x.id === w.id));
                      if (sub) pushBrowse(cat.id, sub.id, w.id);
                    }}
                    className="min-h-[56px] py-2 px-3 flex items-center justify-center text-center"
                  >
                    <span className="font-semibold text-sm">{getWordText(w, targetLang as WordLang)}</span>
                  </CardButton>
                ))}
              </div>
            </div>
          ))}
          {collections.map(col => (
            <div key={col.id} className="space-y-2">
              <TitleBar>
                <span className="flex items-center justify-between w-full">
                  <span>{localizedName(col.name, uiLang)}</span>
                  <button
                    onClick={() => { if (confirm("Remove collection?")) removeCollection(rootKey, col.id); }}
                    className="opacity-60 hover:opacity-100"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </TitleBar>
              <CardButton
                onClick={() => pushBrowse(col.id)}
                className="min-h-[56px] py-2 px-3 flex items-center justify-center text-center"
              >
                <span className="text-xs opacity-70">0 {t("words")}</span>
              </CardButton>
            </div>
          ))}
        </div>
      )}

      <FullPageDialog open={addOpen} onOpenChange={setAddOpen} title={t("addCollection") || "Add Collection"}>
        <div className="space-y-3">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t("name") || "Name"}
            className="w-full px-3 py-2 rounded-[10px] border-2 border-border bg-background text-sm"
          />
          <div className="flex gap-2 justify-end">
            <Button onClick={() => { setAddOpen(false); setName(""); }}>{t("cancel") || "Cancel"}</Button>
            <Button active onClick={() => { addCollection(rootKey, name); setAddOpen(false); setName(""); }}>
              {t("save") || "Save"}
            </Button>
          </div>
        </div>
      </FullPageDialog>
    </div>
  );
}

/* ──────────────────────── Subcategories view ───────────────────────── */

function SubcategoriesView({
  category, onOpen,
}: {
  category: { id: string; name: { nl: string; en: string; ar?: string }; subcategories: { id: string; name: { nl: string; en: string; ar?: string }; words: WordDetail[] }[] };
  onOpen: (id: string) => void;
}) {
  const { uiLang, t } = useCourseLanguage();
  const { collections, addCollection, removeCollection } = useCustomCollections(category.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addColOpen, setAddColOpen] = useState(false);
  const [name, setName] = useState("");

  const all = [...category.subcategories, ...collections];
  const isCustom = (sid: string) => collections.some(c => c.id === sid);

  return (
    <div className="px-4 space-y-3">
      <div className="flex justify-end relative">
        <Button onClick={() => setMenuOpen(o => !o)} aria-label="Add">
          <Plus className="h-4 w-4 mr-1" />
          {t("add") || "Add"}
        </Button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 z-20 rounded-[12px] border-2 border-border bg-background shadow-lg overflow-hidden">
            <button
              className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
              onClick={() => { setMenuOpen(false); setAddColOpen(true); }}
            >
              {t("collection") || "Collection"}
            </button>
          </div>
        )}
      </div>
      {all.length === 0 ? (
        <EmptyState uiLang={uiLang} kind="subcategories" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {all.map(sub => (
            <CardButton
              key={sub.id}
              onClick={() => onOpen(sub.id)}
              className="min-h-[64px] py-3 px-4 flex items-center justify-between gap-3 relative"
            >
              <span className="font-semibold text-sm">{localizedName(sub.name, uiLang)}</span>
              <span className="text-xs opacity-70 whitespace-nowrap">{sub.words.length} {t("words")}</span>
              {isCustom(sub.id) && (
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); if (confirm("Remove collection?")) removeCollection(category.id, sub.id); }}
                  className="absolute top-1 right-1 p-1 opacity-60 hover:opacity-100"
                  aria-label="Remove collection"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </CardButton>
          ))}
        </div>
      )}

      <FullPageDialog open={addColOpen} onOpenChange={setAddColOpen} title={t("addCollection") || "Add Collection"}>
        <div className="space-y-3">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t("name") || "Name"}
            className="w-full px-3 py-2 rounded-[10px] border-2 border-border bg-background text-sm"
          />
          <div className="flex gap-2 justify-end">
            <Button onClick={() => { setAddColOpen(false); setName(""); }}>{t("cancel") || "Cancel"}</Button>
            <Button
              active
              onClick={() => { addCollection(category.id, name); setAddColOpen(false); setName(""); }}
            >
              {t("save") || "Save"}
            </Button>
          </div>
        </div>
      </FullPageDialog>
    </div>
  );
}



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
  const builtIn = category.subcategories.find(s => s.id === subcategoryId);
  const subcategory = builtIn ?? { id: subcategoryId, name: { nl: subcategoryId, en: subcategoryId }, words: [] };
  const { t, courseLang } = useCourseLanguage();
  const { recallQueue } = useApp();
  const { customWords, addCustomWord, applyOverride } = useCustomWords(categoryId, subcategoryId);
  const { isMarked } = useMarkedWords();
  const { isFavorite } = useFavoriteWords();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  type FilterMode = "all" | "marked" | "favorites" | "custom";
  const [filter, setFilter] = useState<FilterMode>("all");
  const [addOpen, setAddOpen] = useState(false);

  const allWords: WordDetail[] = useMemo(
    () => [...subcategory.words, ...customWords].map(applyOverride),
    [subcategory.words, customWords, applyOverride],
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case "marked": return allWords.filter(w => isMarked(courseLang, w.id));
      case "favorites": return allWords.filter(w => isFavorite(courseLang, w.id));
      case "custom": return allWords.filter(w => customWords.some(c => c.id === w.id));
      default: return allWords;
    }
  }, [allWords, filter, courseLang, isMarked, isFavorite, customWords]);

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

  const filterLabel = filter === "all" ? (t("all") || "All")
    : filter === "marked" ? (t("marked") || "Marked")
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
        {filtered.map(word => {
          const isSel = selected.has(word.id);
          const cooling = wordCooling(word.id);
          const wText = getWordText(word, targetLang as WordLang);
          const wPron = (targetLang === "ar" ? word.ar?.pronunciation : word[targetLang as WordLang]?.pronunciation) ?? undefined;
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
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{wText}</span>
                {wPron && <span className="text-[11px] opacity-60 font-mono mt-0.5">/{wPron}/</span>}
              </div>
            </CardButton>
          );
        })}
      </div>

      <WordEditDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={(w) => addCustomWord(w)}
      />
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
  const [open, setOpen] = useState(false);
  const forms = lang === "ar" ? findArabicForms(letter) : undefined;
  return (
    <>
      <button
        type="button"
        onClick={() => forms && setOpen(true)}
        className="block w-full text-left"
      >
        <Container className={cn(
          "p-3 flex flex-col items-center justify-center gap-1 aspect-square",
          forms && "hover:bg-foreground hover:text-background transition-colors cursor-pointer"
        )}>
          <span className="text-2xl font-bold leading-none">{letter}</span>
          {name && <span className="text-[10px] opacity-60">{name}</span>}
          {canSpeak && (
            <Button size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); speak(letter, lang); }} aria-label="Play">
              <Volume2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </Container>
      </button>
      {forms && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center text-3xl">
                {forms.letter} <span className="text-sm opacity-60 align-middle">— {forms.name}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {([
                ["Isolated", forms.isolated],
                ["Initial", forms.initial],
                ["Medial", forms.medial],
                ["Final", forms.final],
              ] as const).map(([label, ch]) => (
                <Container key={label} className="p-4 flex flex-col items-center gap-1">
                  <span className="text-3xl font-bold">{ch}</span>
                  <span className="text-[10px] opacity-60 uppercase tracking-wider">{label}</span>
                </Container>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

/* ─────────────────────────── Word detail ───────────────────────────── */

type FlipState = 0 | 1 | 2;

function WordDetailView({
  categoryId, subcategoryId, word, isCustom,
}: {
  categoryId: string;
  subcategoryId: string;
  word: import("@/data/courseData").WordDetail;
  isCustom?: boolean;
}) {
  const { uiLang, courseLang, t } = useCourseLanguage();
  const [flip, setFlip] = useState<FlipState>(0);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const { isMarked, toggle } = useMarkedWords();
  const { isFavorite, toggle: toggleFav } = useFavoriteWords();
  const { updateCustomWord, removeCustomWord, setOverride } = useCustomWords(categoryId, subcategoryId);
  const [editOpen, setEditOpen] = useState(false);

  const targetTextEarly = word[courseLang]?.word ?? word.en.word;
  const showImage = categoryId === "zelfstandig-naamwoord";
  useEffect(() => {
    setImgUrl(null);
    if (!targetTextEarly || !showImage) return;
    let cancelled = false;
    fetchWordImage({
      word: targetTextEarly,
      lang: courseLang,
      enWord: word.en.word,
      enDefinition: word.en.definition,
    }).then(url => {
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
  const favored = isFavorite(courseLang, word.id);
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
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {!isFront && (
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full border-2 border-border bg-background">
              {showLang}
            </span>
          )}
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
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleFav(courseLang, word.id); }}
            className={cn(
              "rounded-full p-2 border-2 border-border transition-colors",
              favored ? "bg-foreground text-background" : "bg-background hover:bg-foreground hover:text-background"
            )}
            aria-label={favored ? (t("unfavorite") || "Unfavorite") : (t("favorite") || "Favorite")}
          >
            {favored ? <Star className="h-4 w-4 fill-current" /> : <Star className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
            className="rounded-full p-2 bg-background border-2 border-border hover:bg-foreground hover:text-background transition-colors"
            aria-label={t("editWord") || "Edit word"}
          >
            <Pencil className="h-4 w-4" />
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
              <div className="flex items-center mb-2 pr-56">
                <h1 className="text-2xl font-bold">{data.word}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {pronunciation && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full border-2 border-border bg-background">
                    {pronunciation}
                  </span>
                )}
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

      <WordEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        word={word}
        onSave={(w) => {
          if (isCustom) updateCustomWord(word.id, w);
          else setOverride(word.id, w);
        }}
        onDelete={isCustom ? () => removeCustomWord(word.id) : undefined}
      />
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

/* ─────────────────────────── Chess branch ─────────────────────────── */

function EmptyState({ uiLang, kind }: { uiLang: Lang; kind: "subcategories" | "words" | "groups" | "lessons" }) {
  const msg: Record<typeof kind, Record<Lang, string>> = {
    subcategories: {
      nl: "Deze categorie is leeg. Voeg subcategorieën of woorden toe.",
      en: "This category is empty. Add subcategories or words.",
      ar: "هذه الفئة فارغة. أضف فئات فرعية أو كلمات.",
    },
    words: {
      nl: "Geen woorden hier. Tik op + om er een toe te voegen.",
      en: "No words here. Tap + to add one.",
      ar: "لا توجد كلمات هنا. اضغط + للإضافة.",
    },
    groups: {
      nl: "Dit niveau is nog leeg. Binnenkort meer lessen.",
      en: "This level is empty. More lessons coming soon.",
      ar: "هذا المستوى فارغ. قريباً المزيد من الدروس.",
    },
    lessons: {
      nl: "Deze groep is nog leeg. Binnenkort meer lessen.",
      en: "This group is empty. More lessons coming soon.",
      ar: "هذه المجموعة فارغة. قريباً المزيد من الدروس.",
    },
  };
  return (
    <div className="px-4">
      <Container className="p-6 text-center text-sm opacity-70">
        {msg[kind][uiLang] ?? msg[kind].en}
      </Container>
    </div>
  );
}

function ChessBranch() {
  const { browsePath, pushBrowse, setBrowsePath } = useApp();
  const { uiLang, t } = useCourseLanguage();

  if (browsePath.length === 1) {
    const items = [
      { id: "lesson", label: uiLang === "nl" ? "Les" : uiLang === "ar" ? "درس" : "Lesson" },
      { id: "puzzle", label: uiLang === "nl" ? "Puzzel" : uiLang === "ar" ? "لغز" : "Puzzle" },
      { id: "play", label: uiLang === "nl" ? "Spelen" : uiLang === "ar" ? "العب" : "Play" },
    ];
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        {items.map(it => (
          <CardButton
            key={it.id}
            onClick={() => pushBrowse(it.id)}
            className="min-h-[88px] flex items-center justify-center text-center"
          >
            <span className="font-semibold text-sm">{it.label}</span>
          </CardButton>
        ))}
      </div>
    );
  }

  if (browsePath[1] === "play") {
    return <ChessPlayView />;
  }

  if (browsePath[1] === "puzzle" && browsePath.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        {PUZZLES.map(p => (
          <CardButton
            key={p.id}
            onClick={() => pushBrowse(p.id)}
            className="min-h-[80px] flex flex-col items-center justify-center text-center gap-1"
          >
            <span className="font-semibold text-sm">{p.title[uiLang] ?? p.title.en}</span>
            <span className="text-xs opacity-60">{p.theme[uiLang] ?? p.theme.en}</span>
          </CardButton>
        ))}
      </div>
    );
  }

  if (browsePath[1] === "puzzle" && browsePath.length === 3) {
    const p = PUZZLES.find(x => x.id === browsePath[2]);
    if (!p) return <div className="px-4 text-sm">{t("notFound")}</div>;
    const idx = PUZZLES.findIndex(x => x.id === p.id);
    const next = PUZZLES[idx + 1];
    return <ChessPuzzleView puzzle={p} onSolved={next ? () => setBrowsePath([...browsePath.slice(0, -1), next.id]) : undefined} />;
  }

  if (browsePath[1] === "lesson" && browsePath.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        {chessLevels.map(lvl => (
          <CardButton
            key={lvl.id}
            onClick={() => pushBrowse(lvl.id)}
            className="min-h-[64px] py-3 flex items-center justify-center text-center"
          >
            <span className="font-semibold text-sm">{cName(lvl.name, uiLang)}</span>
          </CardButton>
        ))}
      </div>
    );
  }

  if (browsePath[1] === "lesson" && browsePath.length === 3) {
    const lvl = chessLevels.find(l => l.id === browsePath[2]);
    if (!lvl) return <div className="px-4 text-sm">{t("notFound")}</div>;
    if (lvl.groups.length === 0) return <EmptyState uiLang={uiLang} kind="groups" />;
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        {lvl.groups.map(g => (
          <CardButton
            key={g.id}
            onClick={() => pushBrowse(g.id)}
            className="min-h-[64px] py-3 flex items-center justify-center text-center"
          >
            <span className="font-semibold text-sm">{cName(g.name, uiLang)}</span>
          </CardButton>
        ))}
      </div>
    );
  }

  if (browsePath[1] === "lesson" && browsePath.length === 4) {
    const lvl = chessLevels.find(l => l.id === browsePath[2]);
    const grp = lvl?.groups.find(g => g.id === browsePath[3]);
    if (!grp) return <div className="px-4 text-sm">{t("notFound")}</div>;
    if (grp.lessons.length === 0) return <EmptyState uiLang={uiLang} kind="lessons" />;
    return (
      <div className="grid grid-cols-2 gap-3 w-full px-4">
        {grp.lessons.map(ls => (
          <CardButton
            key={ls.id}
            onClick={() => pushBrowse(ls.id)}
            className="min-h-[80px] flex items-center justify-center text-center"
          >
            <span className="font-semibold text-sm">{cName(ls.name, uiLang)}</span>
          </CardButton>
        ))}
      </div>
    );
  }

  if (browsePath[1] === "lesson" && browsePath.length === 5) {
    const lvl = chessLevels.find(l => l.id === browsePath[2]);
    const grp = lvl?.groups.find(g => g.id === browsePath[3]);
    const lesson = grp?.lessons.find(ls => ls.id === browsePath[4]);
    if (!lesson) return <div className="px-4 text-sm">{t("notFound")}</div>;
    const idx = grp!.lessons.findIndex(l => l.id === lesson.id);
    const next = grp!.lessons[idx + 1];
    const onNext = next
      ? () => setBrowsePath([...browsePath.slice(0, -1), next.id])
      : undefined;
    return <ChessLessonView lesson={lesson} onNext={onNext} />;
  }

  return <div className="px-4 text-sm">{t("notFound")}</div>;
}

