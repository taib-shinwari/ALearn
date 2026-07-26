import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckSquare, Clock, Square } from "lucide-react";
import { useApp } from "@/Context/App";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useMarkedWords } from "@/Hook/useMarkedWords";
import { useFavoriteWords } from "@/Hook/useFavoriteWords";
import { useCustomWords } from "@/Hook/useCustomWords";
import { Button } from "@/Component/UI/Button";
import { cn } from "@/Library/utils";
import { BACKEND_BASE_URL, DEFAULT_SECTION, wordDetailFromApi, SupportedLang } from "@/Library/Language";

export default function DictionaryWord() {
  const { langName, categoryId, subcategoryId } = useParams<{ langName: string; categoryId: string; subcategoryId: string }>();
  const navigate = useNavigate();
  
  const activeLangName = (langName || "English") as SupportedLang;
  const { courseLang } = useCourseLanguage();
  
  const context = useApp();
  const recallQueue = context.recallQueue || [];
  const selectMode = context.selectMode || false;
  const setSelectMode = context.setSelectMode || (() => {});
  const selected = context.selected || new Set<string>();
  const setSelected = context.setSelected || (() => {});
  
  // Global filter context variables
  const filter = context.filter || "all";

  const { customWords, applyOverride } = useCustomWords(categoryId || "", subcategoryId || "");
  const { isMarked } = useMarkedWords();
  const { isFavorite } = useFavoriteWords();

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
  
  // Filters automatically using the global context setting
  const filtered = useMemo(() => {
    switch (filter) {
      case "marked":    return allWords.filter(w => isMarked(courseLang as any, w.id));
      case "favorites": return allWords.filter(w => isFavorite(courseLang as any, w.id));
      case "custom":    return allWords.filter(w => customWords.some(c => c.id === w.id));
      default:          return allWords;
    }
  }, [allWords, filter, courseLang, isMarked, isFavorite, customWords]);

  useEffect(() => {
    return () => {
      if (typeof setSelectMode === "function") setSelectMode(false);
      if (typeof setSelected === "function") setSelected(new Set());
    };
  }, [categoryId, subcategoryId, setSelectMode, setSelected]);

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
    if (typeof setSelected === "function") {
      setSelected((prev: Set<string>) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4 px-4">
      {/* Grid automatically spans across viewports */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map(word => {
          const isSel = selectMode && selected.has(word.id);
          const cooling = wordCooling(word.id);
          
          return (
            <Button
              key={word.id}
              active={isSel}
              onClick={() => {
                if (selectMode) {
                  toggle(word.id);
                } else {
                  navigate(`/Language/${activeLangName}/Dictionary/Vocabulary/${categoryId}/${subcategoryId}/${encodeURIComponent(word.id)}`);
                }
              }}
              disabled={selectMode && cooling}
              className={cn(
                "h-12 px-4 flex items-center justify-center text-center relative",
                selectMode && "pr-8"
              )}
            >
              {selectMode && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {cooling ? (
                    <Clock className="h-4 w-4 opacity-60" />
                  ) : isSel ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4 opacity-60" />
                  )}
                </span>
              )}
              <span className="font-semibold text-sm leading-none">{word.id}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}