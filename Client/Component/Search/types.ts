export type SearchCategory = "all" | "categories" | "subcategories" | "words";

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  secondary?: string; // e.g. translation in other lang
  path: string;
  type: "Category" | "Subcategory" | "Word";
}

export interface SearchCategoryConfig {
  id: SearchCategory;
  label: string;
  placeholder: string;
}
