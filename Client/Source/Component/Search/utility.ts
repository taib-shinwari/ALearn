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
  uiLang: string;          // Selected UI language code (e.g. "nl", "ar", "en")
  courseLang: string;      // The current learning language track variable (e.g. "nl", "en")
  conceptSlug: string;     // First segment path route token prefix (e.g., "language")
  cachedCategories: any[];    // Dynamically provided collection from getCategories() API
  cachedSubcategories: any[]; // Dynamically provided collection from getSubcategories() API
}

export function searchByCategory(query: string, category: SearchCategory, opts: SearchOpts): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  
  const { uiLang, courseLang, conceptSlug, cachedCategories, cachedSubcategories } = opts;
  const otherLang = courseLang === "en" ? "nl" : "en";

  const catResults: SearchResult[] = [];
  const subResults: SearchResult[] = [];
  const wordResults: SearchResult[] = [];

  // 1. Process Cached Categories
  for (const cat of cachedCategories) {
    const catName = cat.name?.[uiLang] || cat.name?.en || cat.id;
    const catEn = (cat.name?.en || "").toLowerCase();
    
    // Check if subcategories are nested or belong via reference filter
    const relatedSubs = cachedSubcategories.filter(s => s.catId === cat.id || s.categoryId === cat.id);

    if (catName.toLowerCase().includes(q) || catEn.includes(q)) {
      catResults.push({
        id: `cat-${cat.id}`,
        title: catName,
        subtitle: `${relatedSubs.length} subcategories`,
        path: `/${conceptSlug}/${cat.id}`,
        type: "Category",
      });
    }
  }

  // 2. Process Cached Subcategories and Inner Words Flat Matrix Strings
  for (const sub of cachedSubcategories) {
    const parentCatId = sub.catId || sub.categoryId;
    const parentCat = cachedCategories.find(c => c.id === parentCatId);
    const catName = parentCat?.name?.[uiLang] || parentCat?.name?.en || parentCatId || "";

    const subName = sub.name?.[uiLang] || sub.name?.en || sub.id;
    const subEn = (sub.name?.en || "").toLowerCase();
    const wordsList = sub.words || [];

    if (subName.toLowerCase().includes(q) || subEn.includes(q)) {
      subResults.push({
        id: `sub-${parentCatId}-${sub.id}`,
        title: subName,
        subtitle: `${catName} • ${wordsList.length} words`,
        path: `/${conceptSlug}/${parentCatId}/${sub.id}`,
        type: "Subcategory",
      });
    }

    // 3. Drill-down into inner language tokens inside subcategory payloads
    for (const word of wordsList) {
      // Safely resolve learning words based on target track criteria
      const wTarget = word.text || (courseLang === "ar" ? word.ar?.word : word[courseLang]?.word) || word.en?.word || word.id;
      const wOther = word[otherLang]?.word || word.word || "";
      
      if (
        wTarget.toLowerCase().includes(q) ||
        wOther.toLowerCase().includes(q)
      ) {
        wordResults.push({
          id: `word-${word.id}`,
          title: wTarget,
          secondary: wOther !== wTarget ? wOther : undefined,
          subtitle: `${catName} › ${subName}`,
          path: `/${conceptSlug}/${parentCatId}/${sub.id}/${word.id}`,
          type: "Word",
        });
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