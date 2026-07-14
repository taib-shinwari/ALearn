// @/Component/Settings/Layout/Mobile.tsx
import { useState, useEffect, useMemo } from "react";
import { ScrollArea } from "@/Component/UI/Scroll-Area";
import { Button } from "@/Component/UI/Button";
import { ChevronRight } from "lucide-react";
import { SETTINGS_CATEGORIES, getSubcategories } from "../Constants";
import { mobileSettingsStore } from "../mobileSettingsStore";
import type { SettingsCategoryId } from "../types";

interface MobileProps {
  activeCategory: SettingsCategoryId;
  activeSubcategory: string | null;
  onCategoryChange: (category: SettingsCategoryId) => void;
  onSubcategoryChange: (subcategory: string | null) => void;
  onClose: () => void;
  children: React.ReactNode;
}

export function Mobile({
  activeCategory,
  activeSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  onClose,
  children,
}: MobileProps) {
  const [view, setView] = useState<"categories" | "subcategories" | "content">("categories");
  const [selectedCategory, setSelectedCategory] = useState<SettingsCategoryId | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Track global search state streams
  useEffect(() => {
    const unsubscribeMode = mobileSettingsStore.subscribe(() => {
      const { isSearchMode } = mobileSettingsStore.getState();
      setIsSearchMode(isSearchMode);
    });
    const unsubscribeQuery = mobileSettingsStore.subscribeSearch(() => {
      setSearchQuery(mobileSettingsStore.getSearchQuery());
    });
    setIsSearchMode(mobileSettingsStore.getState().isSearchMode);
    setSearchQuery(mobileSettingsStore.getSearchQuery());
    return () => {
      unsubscribeMode();
      unsubscribeQuery();
    };
  }, []);

  // Compute search list
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: { category: SettingsCategoryId; subcategory?: string; label: string }[] = [];
    for (const cat of SETTINGS_CATEGORIES) {
      if (cat.labelKey.toLowerCase().includes(query) || cat.fallback.toLowerCase().includes(query)) {
        results.push({ category: cat.id, label: cat.fallback });
      }
      if (cat.hasSubcategories) {
        const subs = getSubcategories(cat.id);
        for (const sub of subs) {
          if (sub.labelKey.toLowerCase().includes(query) || sub.fallback.toLowerCase().includes(query)) {
            results.push({ category: cat.id, subcategory: sub.id, label: sub.fallback });
          }
        }
      }
    }
    return results;
  }, [searchQuery]);

  // Handle active selections out of search mode queries
  useEffect(() => {
    if (!isSearchMode || filteredResults.length === 0) return;
    const top = filteredResults[0];
    if (top.subcategory) {
      onCategoryChange(top.category);
      onSubcategoryChange(top.subcategory);
    } else {
      onCategoryChange(top.category);
      onSubcategoryChange(null);
    }
    setView("content");
  }, [filteredResults, isSearchMode, onCategoryChange, onSubcategoryChange]);

  // Synchronize layout metadata headers directly to store references
  useEffect(() => {
    if (isSearchMode) {
      mobileSettingsStore.setState("Search", true, () => {
        mobileSettingsStore.exitSearchMode();
      }, onClose);
      return;
    }
    
    let title = "Settings";
    let showBack = false;
    let goBackFn = () => {};

    if (view === "categories") {
      title = "Settings";
      showBack = false; // Home list level: Back action triggers full panel onClose closure
      goBackFn = () => onClose();
    } else if (view === "subcategories" && selectedCategory) {
      const cat = SETTINGS_CATEGORIES.find(c => c.id === selectedCategory);
      title = cat?.fallback || "Settings";
      showBack = true;
      goBackFn = () => {
        setView("categories");
        setSelectedCategory(null);
      };
    } else if (view === "content") {
      if (activeSubcategory) {
        const subs = getSubcategories(activeCategory);
        const sub = subs.find(s => s.id === activeSubcategory);
        title = sub?.fallback || activeCategory;
      } else {
        const cat = SETTINGS_CATEGORIES.find(c => c.id === activeCategory);
        title = cat?.fallback || "Settings";
      }
      showBack = true;
      goBackFn = () => {
        const catConfig = SETTINGS_CATEGORIES.find(c => c.id === activeCategory);
        if (catConfig?.hasSubcategories) {
          setView("subcategories");
          setSelectedCategory(activeCategory);
        } else {
          setView("categories");
          setSelectedCategory(null);
        }
      };
    }
    mobileSettingsStore.setState(title, showBack, goBackFn, onClose);
  }, [view, selectedCategory, activeCategory, activeSubcategory, onClose, isSearchMode]);

  if (isSearchMode) {
    return (
      <div className="fixed inset-0 z-40 bg-background">
        <ScrollArea className="h-full">
          <div className="pt-[60px]">
            <div className="p-4">
              {filteredResults.length > 0 ? (
                <div className="space-y-2">
                  {filteredResults.map((item, idx) => (
                    <Button
                      key={idx}
                      onClick={() => {
                        if (item.subcategory) {
                          onCategoryChange(item.category);
                          onSubcategoryChange(item.subcategory);
                        } else {
                          onCategoryChange(item.category);
                          onSubcategoryChange(null);
                        }
                        mobileSettingsStore.exitSearchMode();
                        setView("content");
                      }}
                      className="w-full flex items-center justify-between py-3 px-4 text-left font-normal"
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No results for "{searchQuery}"
                </div>
              ) : null}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  if (view === "categories") {
    return (
      <div className="fixed inset-0 z-40 bg-background">
        <ScrollArea className="h-full">
          <div className="pt-[60px]">
            <div className="p-4">
              <div className="space-y-2">
                {SETTINGS_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Button
                      key={cat.id}
                      onClick={() => {
                        if (cat.hasSubcategories) {
                          setSelectedCategory(cat.id);
                          setView("subcategories");
                        } else {
                          onCategoryChange(cat.id);
                          onSubcategoryChange(null);
                          setView("content");
                        }
                      }}
                      className="w-full flex items-center justify-between gap-3 h-auto py-4 px-4 text-left font-normal"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">{cat.fallback}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  if (view === "subcategories" && selectedCategory) {
    const subcategories = getSubcategories(selectedCategory);
    return (
      <div className="fixed inset-0 z-40 bg-background">
        <ScrollArea className="h-full">
          <div className="pt-[60px]">
            <div className="p-4">
              <div className="space-y-2">
                {subcategories.map((sub) => {
                  const SubIcon = sub.icon;
                  return (
                    <Button
                      key={sub.id}
                      onClick={() => {
                        onCategoryChange(selectedCategory);
                        onSubcategoryChange(sub.id);
                        setView("content");
                      }}
                      className="w-full flex items-center justify-between gap-3 h-auto py-4 px-4 text-left font-normal"
                    >
                      <div className="flex items-center gap-3">
                        <SubIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">{sub.fallback}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-background">
      <ScrollArea className="h-full">
        <div className="pt-[60px]">
          <div className="p-4">
            {children}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}