import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { CardButton } from "@/Component/UI/card-button";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { SETTINGS_CATEGORIES, getSubcategories } from "../constants";
import { settingsStore } from "../store";
import type { SettingsCategoryId } from "../types";

interface Props {
  activeCategory: SettingsCategoryId;
  activeSubcategory: string | null;
  onCategoryChange: (id: SettingsCategoryId) => void;
  onSubcategoryChange: (id: string | null) => void;
  children: React.ReactNode;
}

type View = "categories" | "subcategories" | "content";

/** Mobile drill-down: categories → (subcategories) → content. Top bar handled via store. */
export function MobileSettings({
  activeCategory,
  activeSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  children,
}: Props) {
  const { t } = useCourseLanguage();
  const [view, setView] = useState<View>("categories");
  const [drillCat, setDrillCat] = useState<SettingsCategoryId | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Subscribe to search query from the global topbar input
  useEffect(() => {
    const unsub = settingsStore.subscribe(() => {
      setSearchQuery(settingsStore.getState().searchQuery);
    });
    return () => { unsub(); };
  }, []);

  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const out: { catId: SettingsCategoryId; subId?: string; label: string }[] = [];
    for (const cat of SETTINGS_CATEGORIES) {
      const label = t(cat.labelKey) || cat.fallback;
      if (label.toLowerCase().includes(q)) out.push({ catId: cat.id, label });
      if (cat.hasSubcategories) {
        for (const sub of getSubcategories(cat.id)) {
          const subLabel = t(sub.labelKey) || sub.fallback;
          if (subLabel.toLowerCase().includes(q)) out.push({ catId: cat.id, subId: sub.id, label: subLabel });
        }
      }
    }
    return out;
  }, [searchQuery, t]);

  // Sync title + back behavior into the global mobile top bar
  useEffect(() => {
    if (searchQuery.trim()) {
      settingsStore.setTopbar(t("searchSettings"), true, () => settingsStore.setSearchQuery(""));
      return;
    }
    if (view === "categories") {
      settingsStore.setTopbar(t("settings"), false, null);
    } else if (view === "subcategories" && drillCat) {
      const cat = SETTINGS_CATEGORIES.find(c => c.id === drillCat);
      settingsStore.setTopbar(t(cat?.labelKey || "") || cat?.fallback || "", true, () => {
        setView("categories");
        setDrillCat(null);
      });
    } else if (view === "content") {
      let title = "";
      if (activeSubcategory) {
        const sub = getSubcategories(activeCategory).find(s => s.id === activeSubcategory);
        title = sub ? (t(sub.labelKey) || sub.fallback) : "";
      }
      if (!title) {
        const cat = SETTINGS_CATEGORIES.find(c => c.id === activeCategory);
        title = cat ? (t(cat.labelKey) || cat.fallback) : t("settings");
      }
      settingsStore.setTopbar(title, true, () => {
        const cat = SETTINGS_CATEGORIES.find(c => c.id === activeCategory);
        if (cat?.hasSubcategories) {
          setView("subcategories");
          setDrillCat(activeCategory);
        } else {
          setView("categories");
          setDrillCat(null);
        }
      });
    }
  }, [view, drillCat, activeCategory, activeSubcategory, searchQuery, t]);

  // Search results view
  if (searchQuery.trim()) {
    return (
      <div className="px-6 space-y-2">
        {filteredResults.length === 0 && (
          <p className="text-sm opacity-60">{t("noResults")}</p>
        )}
        {filteredResults.map((r, i) => (
          <CardButton
            key={i}
            onClick={() => {
              onCategoryChange(r.catId);
              onSubcategoryChange(r.subId ?? null);
              settingsStore.setSearchQuery("");
              setView("content");
            }}
          >
            <div className="flex items-center justify-between">
              <span>{r.label}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </CardButton>
        ))}
      </div>
    );
  }

  if (view === "categories") {
    return (
      <div className="px-6 space-y-2">
        {SETTINGS_CATEGORIES.map(cat => {
          const Icon = cat.icon;
          return (
            <CardButton
              key={cat.id}
              onClick={() => {
                if (cat.hasSubcategories) {
                  setDrillCat(cat.id);
                  setView("subcategories");
                } else {
                  onCategoryChange(cat.id);
                  onSubcategoryChange(null);
                  setView("content");
                }
              }}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {t(cat.labelKey) || cat.fallback}
                </span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </CardButton>
          );
        })}
      </div>
    );
  }

  if (view === "subcategories" && drillCat) {
    return (
      <div className="px-6 space-y-2">
        {getSubcategories(drillCat).map(sub => {
          const Icon = sub.icon;
          return (
            <CardButton
              key={sub.id}
              onClick={() => {
                onCategoryChange(drillCat);
                onSubcategoryChange(sub.id);
                setView("content");
              }}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {t(sub.labelKey) || sub.fallback}
                </span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </CardButton>
          );
        })}
      </div>
    );
  }

  // content view
  return <div className="px-6">{children}</div>;
}
