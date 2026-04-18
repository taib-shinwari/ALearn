import { useSearchParams, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { TitleBar } from "@/components/ui/title-bar";
import { CardButton } from "@/components/ui/card-button";
import { Button } from "@/components/ui/button";
import { CATEGORIES, CATEGORY_MAP, searchByCategory, getResultTypeLabel } from "@/components/search/utility";
import type { SearchCategory } from "@/components/search/types";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialCat = (searchParams.get("category") || "all") as SearchCategory;

  const [query, setQuery] = useState(initialQ);
  const [category, setCategory] = useState<SearchCategory>(initialCat);

  const { selectedConcept } = useApp();
  const { uiLang, courseLang, t } = useCourseLanguage();
  const conceptSlug = selectedConcept || "home";

  // Sync URL → state
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    const c = (searchParams.get("category") || "all") as SearchCategory;
    if (CATEGORY_MAP[c]) setCategory(c);
  }, [searchParams]);

  const results = useMemo(
    () => searchByCategory(query, category, { uiLang, courseLang, conceptSlug }),
    [query, category, uiLang, courseLang, conceptSlug]
  );

  const update = (q: string, c: SearchCategory) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("category", c);
    setSearchParams(params, { replace: true });
  };

  const currentCategory = CATEGORY_MAP[category];

  const highlight = (text: string, kw: string) => {
    if (!kw) return text;
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${escaped})`, "gi");
    return text.split(re).map((p, i) =>
      re.test(p) ? <mark key={i} className="bg-black text-white px-0.5 rounded-sm">{p}</mark> : p
    );
  };

  return (
    <div className="px-6 space-y-4">
      <TitleBar className="text-center font-semibold">
        {t("search")}
      </TitleBar>

      {/* Search input */}
      <div className="rounded-[20px] bg-white border-2 border-black flex items-center gap-2 px-4 py-3">
        <SearchIcon className="h-5 w-5 shrink-0" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") update(query, category); }}
          placeholder={currentCategory.placeholder}
          className="flex-1 bg-transparent outline-none text-base placeholder:text-black/50"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); update("", category); }}
            className="text-sm font-medium px-2 py-1 rounded-md hover:bg-black hover:text-white transition-colors"
            aria-label="Clear"
          >
            ×
          </button>
        )}
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const active = category === cat.id;
          return (
            <Button
              key={cat.id}
              onClick={() => { setCategory(cat.id); update(query, cat.id); }}
              className={cn(active && "bg-black text-white border-white")}
            >
              {cat.label}
            </Button>
          );
        })}
      </div>

      {/* Results */}
      {!query ? (
        <div className="text-center py-16 text-black/60">
          <SearchIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Type to search across {currentCategory.label.toLowerCase()}.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-black/60">
          <SearchIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No results for "{query}"</p>
        </div>
      ) : (
        <>
          <div className="text-xs text-black/60 px-1">
            {results.length} result{results.length !== 1 ? "s" : ""} in {getResultTypeLabel(category)}
          </div>
          <div className="grid gap-2">
            {results.map((r) => (
              <Link key={r.id} to={r.path}>
                <CardButton className="w-full flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full border-2 border-current flex items-center justify-center text-sm font-bold shrink-0">
                    {r.type.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium truncate">{highlight(r.title, query)}</span>
                      {r.secondary && (
                        <span className="text-xs opacity-70 truncate">{r.secondary}</span>
                      )}
                    </div>
                    {r.subtitle && (
                      <div className="text-xs opacity-70 truncate">{r.subtitle}</div>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </CardButton>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
