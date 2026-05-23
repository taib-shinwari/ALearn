import { useMemo, useRef, useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TitleBar } from "@/components/ui/title-bar";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { SETTINGS_CATEGORIES, getSubcategories } from "../constants";
import type { SettingsCategoryId } from "../types";

interface Props {
  activeCategory: SettingsCategoryId;
  activeSubcategory: string | null;
  onCategoryChange: (id: SettingsCategoryId) => void;
  onSubcategoryChange: (id: string | null) => void;
  children: React.ReactNode;
}

/** Desktop two-column settings layout: sidebar + content. */
export function DesktopSettings({
  activeCategory,
  activeSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  children,
}: Props) {
  const { t } = useCourseLanguage();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SETTINGS_CATEGORIES.map(cat => {
      const label = t(cat.labelKey) || cat.fallback;
      const subs = cat.hasSubcategories
        ? getSubcategories(cat.id).map(s => ({ ...s, label: t(s.labelKey) || s.fallback }))
        : [];
      const filteredSubs = q ? subs.filter(s => s.label.toLowerCase().includes(q)) : subs;
      const match = !q || label.toLowerCase().includes(q) || filteredSubs.length > 0;
      return { ...cat, label, subs: filteredSubs, match };
    }).filter(c => c.match);
  }, [query, t]);

  // Auto-jump to top result when searching
  useEffect(() => {
    if (!query.trim() || filtered.length === 0) return;
    const top = filtered[0];
    if (top.id !== activeCategory) onCategoryChange(top.id);
    const topSub = top.subs[0]?.id ?? null;
    if (top.subs.length > 0 && topSub !== activeSubcategory) onSubcategoryChange(topSub);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="px-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-[260px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60 pointer-events-none" />
            <Input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t("searchSettings")}
              className="pl-9 pr-9 rounded-full border-2 border-foreground"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label="Clear"
              >
                <X className="h-4 w-4 opacity-60" />
              </button>
            )}
          </div>

          {filtered.length === 0 && (
            <p className="text-sm opacity-60 px-2">{t("noResults")}</p>
          )}

          {filtered.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <div key={cat.id} className="space-y-1">
                <Button
                  fullWidth
                  onClick={() => {
                    onCategoryChange(cat.id);
                    onSubcategoryChange(cat.subs[0]?.id ?? null);
                  }}
                  className={cn(
                    "justify-start gap-2",
                    isActive && "bg-foreground text-background border-background hover:bg-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {cat.label}
                </Button>

                {isActive && cat.subs.length > 0 && (
                  <div className="pl-4 space-y-1">
                    {cat.subs.map(sub => {
                      const SubIcon = sub.icon;
                      const subActive = activeSubcategory === sub.id;
                      return (
                        <Button
                          key={sub.id}
                          fullWidth
                          onClick={() => onSubcategoryChange(sub.id)}
                          className={cn(
                            "justify-start gap-2 text-sm",
                            subActive && "bg-foreground text-background border-background hover:bg-foreground"
                          )}
                        >
                          <SubIcon className="h-3.5 w-3.5" />
                          {sub.label}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        {/* Content */}
        <main className="space-y-4">
          <TitleBar className="font-semibold">{t("settings")}</TitleBar>
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
