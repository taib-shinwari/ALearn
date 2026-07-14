import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Brain, CheckSquare, Clock, Filter, Plus, Square, X } from "lucide-react";
import { useApp } from "@/Context/App";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useMarkedWords } from "@/Hook/useMarkedWords";
import { useFavoriteWords } from "@/Hook/useFavoriteWords";
import { useCustomWords } from "@/Hook/useCustomWords";
import { Button } from "@/Component/UI/Button";
import { CardButton } from "@/Component/UI/card-button";
import { WordEditDialog } from "@/Component/Word/WordEditDialog";
import { cn } from "@/Library/utils";
import { BACKEND_BASE_URL, DEFAULT_SECTION, wordDetailFromApi, SupportedLang } from "@/Library/Language";

export default function DictionaryWord() {
  const { langName, categoryId, subcategoryId } = useParams<{ langName: string; categoryId: string; subcategoryId: string }>();
  const navigate = useNavigate();
  
  const activeLangName = (langName || "English") as SupportedLang;
  const { t, courseLang } = useCourseLanguage();
  const { recallQueue, setActiveRecall, setRecallReturnPath } = useApp();
  const { customWords, addCustomWord, applyOverride } = useCustomWords(categoryId || "", subcategoryId || "");
  const { isMarked } = useMarkedWords();
  const { isFavorite } = useFavoriteWords();

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "marked" | "favorites" | "custom">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [resolvedWords, setResolvedWords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!categoryId || !subcategoryId) return;

    setLoading(true);
    fetch(`${BACKEND_BASE_URL}/api/language-corpus?lang=${encodeURIComponent(activeLangName)}`)
      .then(res => res.ok ? res.json() : null)
      .then(corpus => {
        const subcategoryData = corpus?.vocabularyGrammar?.[DEFAULT_SECTION]?.[categoryId]?.[subcategoryId] || {};
        
        const compiled = Object.keys(subcategoryData).map(slug => 
          wordDetailFromApi(slug, subcategoryData[slug], activeLangName)
        );

        setResolvedWords(compiled);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to parse words data directly from corpus mapping:", err);
        setResolvedWords([]);
        setLoading(false);
      });
  }, [activeLangName, categoryId, subcategoryId]);

  const allWords = useMemo(() => [...resolvedWords, ...customWords].map(applyOverride), [resolvedWords, customWords, applyOverride]);
  const filtered = useMemo(() => {
    switch (filter) {
      case "marked":    return allWords.filter(w => isMarked(courseLang as any, w.id));
      case "favorites": return allWords.filter(w => isFavorite(courseLang as any, w.id));
      case "custom":    return allWords.filter(w => customWords.some(c => c.id === w.id));
      default:          return allWords;
    }
  }, [allWords, filter, courseLang, isMarked, isFavorite, customWords]);

  if (loading) {
    return <div className="p-4 text-sm">Loading...</div>;
  }

  const now = Date.now();
  const wordCooling = (wid: string) => {
    const item = recallQueue.find(r => r.scope === "word" && r.categoryId === categoryId && r.subcategoryId === subcategoryId && r.wordId === wid);
    return !!item && item.readyAt > now;
  };

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
        <Button onClick={() => setFilter(f => f === "all" ? "marked" : f === "marked" ? "favorites" : f === "favorites" ? "custom" : "all")} active={filter !== "all"}>
          <Filter className="h-4 w-4 mr-2" />
          {filter.toUpperCase()}
        </Button>
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />{t("addWord") || "Add"}</Button>
        <Button onClick={() => { setSelectMode(s => !s); setSelected(new Set()); }} active={selectMode}>
          {selectMode ? <X className="h-4 w-4 mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
          {selectMode ? "Cancel" : "Select"}
        </Button>
      </div>

      {selectMode && selected.size > 0 && (
        <Button active fullWidth onClick={() => {
          setRecallReturnPath([ "Language", langName || "English", "Dictionary", "Vocabulary", categoryId || "", subcategoryId || "" ]);
          setActiveRecall({ scope: "word", categoryId: categoryId || "", subcategoryId: subcategoryId || "", wordIds: Array.from(selected) });
          navigate("/Recall");
        }}>
          <Brain className="h-4 w-4 mr-2" />
          Recall selected ({selected.size})
        </Button>
      )}

      <div className="grid grid-cols-2 gap-3">
        {filtered.map(word => {
          const isSel = selected.has(word.id);
          const cooling = wordCooling(word.id);
          return (
            <CardButton
              key={word.id}
              onClick={() => {
                if (selectMode) {
                  toggle(word.id);
                } else {
                  navigate(`/Language/${activeLangName}/Dictionary/Vocabulary/${categoryId}/${subcategoryId}/${encodeURIComponent(word.id)}`);
                }
              }}
              disabled={selectMode && cooling}
              className={cn(
                "min-h-[80px] flex flex-col justify-between relative rounded-lg", 
                selectMode && isSel && "bg-foreground text-background border-foreground"
              )}
            >
              {selectMode && (
                <span className="absolute top-2 right-2">
                  {cooling ? <Clock className="h-4 w-4 opacity-60" /> : isSel ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 opacity-60" />}
                </span>
              )}
              <span className="font-semibold text-sm">{word.id}</span>
            </CardButton>
          );
        })}
      </div>
      <WordEditDialog open={addOpen} onOpenChange={setAddOpen} onSave={addCustomWord} />
    </div>
  );
}