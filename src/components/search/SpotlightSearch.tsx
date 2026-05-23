import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, X, ChevronDown, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORIES, searchByCategory, getResultTypeLabel } from "./utility";
import type { SearchCategory, SearchResult } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpotlightSearch({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { selectedConcept } = useApp();
  const { uiLang, courseLang } = useCourseLanguage();
  const conceptSlug = selectedConcept || "home";

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+K toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Compute results
  useEffect(() => {
    if (!query) { setResults([]); setSelectedIndex(0); return; }
    setResults(searchByCategory(query, category, { uiLang, courseLang, conceptSlug }));
    setSelectedIndex(0);
  }, [query, category, uiLang, courseLang, conceptSlug]);

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
    setCategory("all");
  }, [onOpenChange]);

  const goToSearchPage = useCallback(() => {
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}&category=${category}`);
    close();
  }, [query, category, navigate, close]);

  const onResult = useCallback((path: string) => {
    navigate(path);
    close();
  }, [navigate, close]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(p => Math.min(p + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(p => Math.max(p - 1, 0));
    } else if (e.key === "Enter") {
      if (results.length > 0) onResult(results[selectedIndex].path);
      else goToSearchPage();
    } else if (e.key === "Escape") {
      close();
    }
  };

  if (!open) return null;
  const currentCategory = CATEGORIES.find(c => c.id === category)!;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/40" onClick={close} />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
        <div
          className="w-full max-w-2xl bg-background border-2 border-foreground rounded-[20px] shadow-xl overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Input row */}
          <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-foreground">
            <SearchIcon className="h-5 w-5 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={currentCategory.placeholder}
              className="flex-1 bg-transparent outline-none text-base placeholder:text-foreground/50"
              aria-label="Search"
            />

            {!query && (
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full border-2 border-foreground bg-background text-foreground hover:bg-foreground hover:text-background transition-colors"
                  >
                    {currentCategory.label}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {CATEGORIES.map((cat) => (
                    <DropdownMenuItem
                      key={cat.id}
                      onClick={() => {
                        setCategory(cat.id);
                        setDropdownOpen(false);
                        inputRef.current?.focus();
                      }}
                      className={cn("cursor-pointer flex items-center gap-2", category === cat.id && "font-semibold")}
                    >
                      {cat.label}
                      {category === cat.id && <Check className="h-3 w-3 ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                aria-label="Clear"
                className="p-1 rounded-md hover:bg-foreground hover:text-background transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results */}
          {query && (
            <div className="max-h-[50vh] overflow-y-auto">
              {results.length > 0 ? (
                <div className="p-2">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
                      {getResultTypeLabel(category)}
                    </span>
                    <button
                      onClick={goToSearchPage}
                      className="text-xs font-medium hover:underline"
                    >
                      See all →
                    </button>
                  </div>
                  {results.map((result, i) => {
                    const active = selectedIndex === i;
                    return (
                      <button
                        key={result.id}
                        onClick={() => onResult(result.path)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group",
                          active ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-foreground hover:text-background"
                        )}
                      >
                        <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border-2 border-current">
                          {result.type.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium truncate">{result.title}</span>
                            {result.secondary && (
                              <span className="text-xs truncate opacity-70">
                                {result.secondary}
                              </span>
                            )}
                          </div>
                          {result.subtitle && (
                            <div className="text-xs truncate opacity-70">
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-foreground/60">
                  <SearchIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  No results for "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
