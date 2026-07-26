// @/Context/App.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ReviewState, createReviewState, updateReview } from "@/Library/spacedRepetition";
import type { RecallItem, RecallScope } from "@/Library/recall";
import { browsePathToUrl, sameBrowsePath, urlToBrowsePath } from "@/Library/navigation";

export const ALL_LANGUAGES = ["English", "Nederlands", "Arabic", "Pashto"];

export interface Course {
  fromLang: string;
  concept: string;
  toLang: string;
}

export type ThemeChoice = "light" | "dark" | "system";
export type TextSize = "sm" | "md" | "lg";
export type FilterType = "all" | "marked" | "favorites" | "custom";

export interface ActiveRecall {
  scope: RecallScope;
  categoryId: string;
  subcategoryId: string;
  wordId?: string;
  wordIds?: string[];
}

interface AppState {
  isAuthenticated: boolean;
  user: { firstName: string; email: string } | null;
  interfaceLanguage: string;
  selectedConcept: string | null;
  learningLanguage: string | null;
  introductionCompleted: boolean;
  courses: Course[];
  reviews: ReviewState[];
  theme: ThemeChoice;
  textSize: TextSize;
  highContrast: boolean;
  recallQueue: RecallItem[];
  browsePath: string[];
  activeRecall: ActiveRecall | null;
  recallReturnPath: string[] | null;
  isSettingsSidebarOpen: boolean; 
}

interface AppContextType extends AppState {
  availableLearningLanguages: string[];
  activeLanguages: string[];
  inactiveLanguages: string[];
  
  login: (email: string, password: string) => boolean;
  signup: (firstName: string, email: string, password: string) => boolean;
  logout: () => void;
  setInterfaceLanguage: (lang: string) => void;
  setSelectedConcept: (concept: string) => void;
  setLearningLanguage: (lang: string) => void;
  completeIntroduction: () => void;
  addCourse: (course: Course) => boolean;
  setActiveCourse: (course: Course) => void;
  getReview: (wordId: string) => ReviewState;
  recordReview: (wordId: string, correct: boolean) => void;
  setTheme: (t: ThemeChoice) => void;
  setTextSize: (t: TextSize) => void;
  setHighContrast: (v: boolean) => void;
  addRecallItem: (item: RecallItem) => void;
  removeRecallItem: (id: string) => void;
  setBrowsePath: (path: string[]) => void;
  pushBrowse: (segment: string) => void;
  popBrowse: () => void;
  resetBrowse: () => void;
  setActiveRecall: (r: ActiveRecall | null) => void;
  setRecallReturnPath: (p: string[] | null) => void;
  removeCourse: (courseName: string) => void;
  setSettingsSidebarOpen: (open: boolean) => void; 
  selectMode: boolean;
  setSelectMode: React.Dispatch<React.SetStateAction<boolean>>;
  selected: Set<string>;
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  
  // Filter System Props
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  selectedFilter: FilterType; 
  setSelectedFilter: (filter: FilterType) => void;
  
  // Aliases added to support both naming systems flawlessly
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}

const defaultState: AppState = {
  isAuthenticated: false,
  user: null,
  interfaceLanguage: "English",
  selectedConcept: "language",
  learningLanguage: null,
  introductionCompleted: false,
  courses: [],
  reviews: [],
  theme: "system",
  textSize: "md",
  highContrast: false,
  recallQueue: [],
  browsePath: [],
  activeRecall: null,
  recallReturnPath: null,
  isSettingsSidebarOpen: false, 
};

function applyAppearance(theme: ThemeChoice, textSize: TextSize, hc: boolean) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", isDark);
  root.classList.toggle("hc", hc);
  root.classList.toggle("high-contrast", hc);
  root.classList.remove("text-sm", "text-md", "text-lg");
  root.classList.add(`text-${textSize}`);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem("appState");
    if (saved) {
      const parsed = JSON.parse(saved);
      const urlPath = typeof window !== "undefined" ? urlToBrowsePath(window.location.pathname) : null;
      const {
        streak, xp, lastPracticeDate,
        practiceScope, pathProgress, exerciseStats,
        ...clean
      } = parsed;
      const merged: AppState = { ...defaultState, ...clean, selectedConcept: "language" };
      merged.courses = (merged.courses ?? []).filter((c: Course) => c.concept === "language");
      merged.recallQueue = Array.isArray(merged.recallQueue) ? merged.recallQueue : [];
      merged.browsePath = urlPath ?? (Array.isArray(merged.browsePath) ? merged.browsePath : []);
      merged.activeRecall = merged.activeRecall ?? null;
      merged.recallReturnPath = merged.recallReturnPath ?? null;
      merged.isSettingsSidebarOpen = false; 
      return merged;
    }
    const urlPath = typeof window !== "undefined" ? urlToBrowsePath(window.location.pathname) : null;
    return urlPath ? { ...defaultState, browsePath: urlPath } : defaultState;
  });

  const [isSettingsSidebarOpen, setSettingsSidebarOpen] = useState(false);

  const currentInterface = state.interfaceLanguage;

  const availableLearningLanguages = ALL_LANGUAGES.filter(
    (lang) => lang.toLowerCase() !== currentInterface.toLowerCase()
  );

  const activeLanguages = ALL_LANGUAGES.filter((lang) =>
    state.courses.some((course) => course.toLang.toLowerCase() === lang.toLowerCase())
  );

  const inactiveLanguages = ALL_LANGUAGES.filter(
    (lang) => !activeLanguages.some(al => al.toLowerCase() === lang.toLowerCase()) && lang.toLowerCase() !== currentInterface.toLowerCase()
  );

  useEffect(() => {
    const { isSettingsSidebarOpen, ...stateToSave } = state;
    localStorage.setItem("appState", JSON.stringify(stateToSave));
  }, [state]);

  useEffect(() => {
    const current = window.location.pathname.toLowerCase();
    const isBrowseRoute = current === "/" || current.startsWith("/language") || current.startsWith("/chess");
    if (!isBrowseRoute) return;

    const nextUrl = browsePathToUrl(state.browsePath);
    if (window.location.pathname !== nextUrl) {
      window.history.pushState(null, "", nextUrl);
    }
  }, [state.browsePath]);

  useEffect(() => {
    const handlePopState = () => {
      const next = urlToBrowsePath(window.location.pathname);
      if (!next) return;
      setState(s => sameBrowsePath(s.browsePath, next) ? s : { ...s, browsePath: next });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    applyAppearance(state.theme, state.textSize, state.highContrast);
  }, [state.theme, state.textSize, state.highContrast]);

  useEffect(() => {
    if (state.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyAppearance(state.theme, state.textSize, state.highContrast);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [state.theme, state.textSize, state.highContrast]);

  const ensureCourse = (s: AppState, fromLang: string): AppState => {
    const toLang = s.learningLanguage && s.learningLanguage.toLowerCase() !== fromLang.toLowerCase()
      ? s.learningLanguage
      : (ALL_LANGUAGES.find(l => l.toLowerCase() !== fromLang.toLowerCase()) ?? "English");
    const course: Course = { fromLang, concept: "language", toLang };
    const exists = s.courses.some(c => c.fromLang.toLowerCase() === fromLang.toLowerCase() && c.concept === "language" && c.toLang.toLowerCase() === toLang.toLowerCase());
    return {
      ...s,
      learningLanguage: toLang,
      courses: exists ? s.courses : [...s.courses, course],
    };
  };

  const login = (email: string, password: string) => {
    if (email === "a@mail.com" && password === "A") {
      setState(s => ensureCourse({ ...s, isAuthenticated: true, user: { firstName: "Demo", email } }, s.interfaceLanguage ?? "English"));
      return true;
    }
    return false;
  };

  const signup = (firstName: string, email: string, _password: string) => {
    setState(s => ensureCourse({ ...s, isAuthenticated: true, user: { firstName, email } }, s.interfaceLanguage ?? "English"));
    return true;
  };

  const logout = () => {
    setState(s => ({ ...defaultState, theme: s.theme, textSize: s.textSize, highContrast: s.highContrast }));
  };

  const setInterfaceLanguage = (lang: string) => setState(s => {
    let learningLanguage = s.learningLanguage;
    if (learningLanguage?.toLowerCase() === lang.toLowerCase()) {
      const fallback = ALL_LANGUAGES.find(l => l.toLowerCase() !== lang.toLowerCase()) ?? null;
      learningLanguage = fallback;
    }
    return { ...s, interfaceLanguage: lang, learningLanguage };
  });

  const setSelectedConcept = (concept: string) => setState(s => ({ ...s, selectedConcept: concept }));
  
  const setLearningLanguage = (lang: string) => {
    setState(s => {
      const course: Course = { fromLang: s.interfaceLanguage, concept: s.selectedConcept!, toLang: lang };
      const exists = s.courses.some(c => c.fromLang.toLowerCase() === course.fromLang.toLowerCase() && c.concept === course.concept && c.toLang.toLowerCase() === course.toLang.toLowerCase());
      const courses = exists ? s.courses : [...s.courses, course];
      return { ...s, learningLanguage: lang, courses };
    });
  };

  const completeIntroduction = () => setState(s => ({ ...s, introductionCompleted: true }));

  const addCourse = (course: Course): boolean => {
    const exists = state.courses.some(c => c.fromLang.toLowerCase() === course.fromLang.toLowerCase() && c.concept === course.concept && c.toLang.toLowerCase() === course.toLang.toLowerCase());
    if (exists) return false;
    setState(s => ({
      ...s,
      courses: [...s.courses, course],
      interfaceLanguage: course.fromLang,
      selectedConcept: course.concept,
      learningLanguage: course.toLang,
    }));
    return true;
  };

  const setActiveCourse = (course: Course) => {
    setState(s => ({
      ...s,
      interfaceLanguage: course.fromLang,
      selectedConcept: course.concept,
      learningLanguage: course.toLang,
    }));
  };

  const getReview = (wordId: string): ReviewState => {
    const existing = state.reviews.find(r => r.wordId === wordId);
    if (!existing) return createReviewState(wordId);
    return { ease: 2.5, reps: existing.learned ? 1 : 0, lapses: 0, ...existing };
  };

  const recordReview = (wordId: string, correct: boolean) => {
    setState(s => {
      const existing = s.reviews.find(r => r.wordId === wordId);
      const current: ReviewState = existing
        ? { ease: 2.5, reps: existing.learned ? 1 : 0, lapses: 0, ...existing }
        : createReviewState(wordId);
      const updated = updateReview(current, correct);
      const reviews = existing
        ? s.reviews.map(r => r.wordId === wordId ? updated : r)
        : [...s.reviews, updated];
      return { ...s, reviews };
    });
  };

  const removeCourse = (courseName: string) => {
    setState(s => {
      const updatedCourses = s.courses.filter(
        c => c.concept !== "language" || c.toLang.toLowerCase() !== courseName.toLowerCase()
      );

      let learningLanguage = s.learningLanguage;
      if (learningLanguage?.toLowerCase() === courseName.toLowerCase()) {
        const remaining = updatedCourses.find(c => c.concept === "language");
        learningLanguage = remaining ? remaining.toLang : null;
      }

      return {
        ...s,
        courses: updatedCourses,
        learningLanguage
      };
    });
  };

  const setTheme = (theme: ThemeChoice) => setState(s => ({ ...s, theme }));
  const setTextSize = (textSize: TextSize) => setState(s => ({ ...s, textSize }));
  const setHighContrast = (highContrast: boolean) => setState(s => ({ ...s, highContrast }));

  const addRecallItem = (item: RecallItem) => setState(s => {
    const others = s.recallQueue.filter(r => r.id !== item.id);
    return { ...s, recallQueue: [...others, item] };
  });
  const removeRecallItem = (id: string) => setState(s => ({
    ...s, recallQueue: s.recallQueue.filter(r => r.id !== id),
  }));

  const setBrowsePath = (browsePath: string[]) => setState(s => ({ ...s, browsePath }));
  const pushBrowse = (segment: string) => setState(s => ({ ...s, browsePath: [...s.browsePath, segment] }));
  const popBrowse = () => setState(s => ({ ...s, browsePath: s.browsePath.slice(0, -1) }));
  const resetBrowse = () => setState(s => ({ ...s, browsePath: [] }));
  const setActiveRecall = (activeRecall: ActiveRecall | null) => setState(s => ({ ...s, activeRecall }));
  const setRecallReturnPath = (recallReturnPath: string[] | null) => setState(s => ({ ...s, recallReturnPath }));
  
  const [selectMode, setSelectMode] = useState<boolean>(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  
  // States for filter mechanism
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");

  return (
    <AppContext.Provider value={{
      ...state, 
      isSettingsSidebarOpen, 
      setSettingsSidebarOpen, 
      availableLearningLanguages,
      activeLanguages,
      inactiveLanguages,
      selectMode,
      setSelectMode,
      selected,
      setSelected,
      login, signup, logout, setInterfaceLanguage, setSelectedConcept,
      setLearningLanguage, completeIntroduction, addCourse, setActiveCourse,
      getReview, recordReview, removeCourse,
      setTheme, setTextSize, setHighContrast,
      addRecallItem, removeRecallItem,
      setBrowsePath, pushBrowse, popBrowse, resetBrowse, setActiveRecall, setRecallReturnPath,
      filterOpen,
      setFilterOpen,
      selectedFilter,
      setSelectedFilter,
      
      // EXPOSING ALIASES
      filter: selectedFilter,
      setFilter: setSelectedFilter,
    }}>
      {children}
    </AppContext.Provider>
  );
}