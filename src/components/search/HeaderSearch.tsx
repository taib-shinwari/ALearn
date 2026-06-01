import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, ChevronDown, Check, ArrowRight, X } from "lucide-react";
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
import { pathToBrowse } from "@/lib/navigation";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Inline header search. Picks a result → sets browsePath and navigates to "/".
 */
export function HeaderSearch({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { setBrowsePath, learningLanguage } = useApp();
  const { uiLang, courseLang } = useCourseLanguage();
  const conceptSlug = "language";

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else { setQuery(""); setCategory("all"); }
  }, [open]);

  useEffect(() => {
    if (!query) { setResults([]); setSelectedIndex(0); return; }
    setResults(searchByCategory(query, category, { uiLang, courseLang, conceptSlug }));
    setSelectedIndex(0);
  }, [query, category, uiLang, courseLang]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (containerRef.current?.contains(t)) return;
      const inPortal = (t as HTMLElement)?.closest?.("[data-radix-popper-content-wrapper]");
      if (inPortal) return;
      onClose();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onClose]);

  const onResult = useCallback((path: string) => {
    const targetLang = learningLanguage || "nl";
    setBrowsePath(pathToBrowse(path, targetLang));
    navigate("/");
    onClose();
  }, [learningLanguage, navigate, onClose, setBrowsePath]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(p => Math.min(p + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(p => Math.max(p - 1, 0));
    } else if (e.key === "Enter") {
      if (results.length > 0) onResult(results[selectedIndex].path);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;
  const currentCategory = CATEGORIES.find(c => c.id === category)!;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xl">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-background border-2 border-border rounded-full">
        <SearchIcon className="h-4 w-4 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={currentCategory.placeholder}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-foreground/50 min-w-0"
          aria-label="Search"
        />

        {!query && (
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border-2 border-border bg-background text-foreground hover:bg-foreground hover:text-background transition-colors"
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
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {query && (
        <div className="absolute left-0 right-0 mt-2 bg-background border-2 border-border rounded-[20px] shadow-xl overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
          {results.length > 0 ? (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
                  {getResultTypeLabel(category)}
                </span>
              </div>
              {results.map((r, i) => {
                const active = selectedIndex === i;
                return (
                  <button
                    key={r.id}
                    onClick={() => onResult(r.path)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group",
                      active ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-foreground hover:text-background"
                    )}
                  >
                    <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border-2 border-current shrink-0">
                      {r.type.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium truncate">{r.title}</span>
                        {r.secondary && <span className="text-xs truncate opacity-70">{r.secondary}</span>}
                      </div>
                      {r.subtitle && <div className="text-xs truncate opacity-70">{r.subtitle}</div>}
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-foreground/60">
              <SearchIcon className="h-5 w-5 mx-auto mb-2 opacity-50" />
              No results for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
