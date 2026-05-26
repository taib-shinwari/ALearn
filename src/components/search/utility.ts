import { categories, localizedName, Lang, WordLang } from "@/data/courseData";
import type { SearchCategory, SearchResult, SearchCategoryConfig } from "./types";

export const CATEGORIES: SearchCategoryConfig[] = [
  { id: "all", label: "All", placeholder: "Search categories, subcategories, words…" },
  { id: "categories", label: "Categories", placeholder: "Search categories…" },
  { id: "subcategories", label: "Subcategories", placeholder: "Search subcategories…" },
  { id: "words", label: "Words", placeholder: "Search words…" },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c])) as Record<SearchCategory, SearchCategoryConfig>;

export function getResultTypeLabel(category: SearchCategory): string {
  switch (category) {
    case "categories": return "Categories";
    case "subcategories": return "Subcategories";
    case "words": return "Words";
    default: return "Results";
  }
}

interface SearchOpts {
  uiLang: Lang;
  courseLang: WordLang;
  conceptSlug: string; // e.g. "language" — first segment in routes
}

export function searchByCategory(query: string, category: SearchCategory, opts: SearchOpts): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const { uiLang, courseLang, conceptSlug } = opts;
  const otherLang: WordLang = courseLang === "en" ? "nl" : "en";

  const catResults: SearchResult[] = [];
  const subResults: SearchResult[] = [];
  const wordResults: SearchResult[] = [];

  for (const cat of categories) {
    const catName = localizedName(cat.name, uiLang);
    const catEn = localizedName(cat.name, "en").toLowerCase();
    if (catName.toLowerCase().includes(q) || catEn.includes(q)) {
      catResults.push({
        id: `cat-${cat.id}`,
        title: catName,
        subtitle: `${cat.subcategories.length} subcategories`,
        path: `/${conceptSlug}/${cat.id}`,
        type: "Category",
      });
    }

    for (const sub of cat.subcategories) {
      const subName = localizedName(sub.name, uiLang);
      const subEn = localizedName(sub.name, "en").toLowerCase();
      if (subName.toLowerCase().includes(q) || subEn.includes(q)) {
        subResults.push({
          id: `sub-${cat.id}-${sub.id}`,
          title: subName,
          subtitle: `${catName} • ${sub.words.length} words`,
          path: `/${conceptSlug}/${cat.id}/${sub.id}`,
          type: "Subcategory",
        });
      }

      for (const word of sub.words) {
        const wTarget = word[courseLang]?.word || "";
        const wOther = word[otherLang]?.word || "";
        if (
          wTarget.toLowerCase().includes(q) ||
          wOther.toLowerCase().includes(q)
        ) {
          wordResults.push({
            id: `word-${word.id}`,
            title: wTarget,
            secondary: wOther,
            subtitle: `${catName} › ${subName}`,
            path: `/${conceptSlug}/${cat.id}/${sub.id}/${word.id}`,
            type: "Word",
          });
        }
      }
    }
  }

  let combined: SearchResult[] = [];
  switch (category) {
    case "categories": combined = catResults; break;
    case "subcategories": combined = subResults; break;
    case "words": combined = wordResults; break;
    default: combined = [...catResults, ...subResults, ...wordResults];
  }
  return combined.slice(0, 12);
}
