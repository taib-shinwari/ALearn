import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ReviewState, createReviewState, updateReview } from "@/lib/spacedRepetition";

export interface Course {
  fromLang: string;
  concept: string;
  toLang: string;
}

export type ThemeChoice = "light" | "dark" | "system";
export type TextSize = "sm" | "md" | "lg";

export type LessonProgressEntry = {
  stars: 0 | 1 | 2 | 3;
  completedAt?: number;
  attempts: number;
};

interface AppState {
  isAuthenticated: boolean;
  user: { firstName: string; email: string } | null;
  interfaceLanguage: string | null;
  selectedConcept: string | null;
  learningLanguage: string | null;
  introductionCompleted: boolean;
  courses: Course[];
  reviews: ReviewState[];
  practiceScope: { type: "global" | "category" | "subcategory" | "word" | "lesson"; id?: string; lessonId?: string } | null;
  theme: ThemeChoice;
  textSize: TextSize;
  highContrast: boolean;
  pathProgress: Record<string, LessonProgressEntry>;
}

interface AppContextType extends AppState {
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
  setPracticeScope: (scope: AppState["practiceScope"]) => void;
  markLessonComplete: (lessonId: string, stars?: 0 | 1 | 2 | 3) => void;
  setTheme: (t: ThemeChoice) => void;
  setTextSize: (t: TextSize) => void;
  setHighContrast: (v: boolean) => void;
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
  interfaceLanguage: "en",
  selectedConcept: "language",
  learningLanguage: null,
  introductionCompleted: false,
  courses: [],
  reviews: [],
  practiceScope: null,
  theme: "system",
  textSize: "md",
  highContrast: false,
  pathProgress: {},
};

function applyAppearance(theme: ThemeChoice, textSize: TextSize, hc: boolean) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", isDark);
  root.classList.toggle("hc", hc);
  root.classList.remove("text-sm", "text-md", "text-lg");
  root.classList.add(`text-${textSize}`);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem("appState");
    if (saved) {
      const parsed = JSON.parse(saved);
      const { streak, xp, lastPracticeDate, ...clean } = parsed;
      const merged = { ...defaultState, ...clean, selectedConcept: "language" };
      // Drop any non-language courses (chess removed)
      merged.courses = (merged.courses ?? []).filter((c: Course) => c.concept === "language");
      return merged;
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem("appState", JSON.stringify(state));
  }, [state]);

  // Apply theme/HC/text-size whenever they change
  useEffect(() => {
    applyAppearance(state.theme, state.textSize, state.highContrast);
  }, [state.theme, state.textSize, state.highContrast]);

  // React to system theme changes when in "system" mode
  useEffect(() => {
    if (state.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyAppearance(state.theme, state.textSize, state.highContrast);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [state.theme, state.textSize, state.highContrast]);

  const login = (email: string, password: string) => {
    if (email === "a@mail.com" && password === "A") {
      setState(s => ({ ...s, isAuthenticated: true, user: { firstName: "Demo", email } }));
      return true;
    }
    return false;
  };

  const signup = (firstName: string, email: string, _password: string) => {
    setState(s => ({ ...s, isAuthenticated: true, user: { firstName, email } }));
    return true;
  };

  const logout = () => {
    setState(s => ({ ...defaultState, theme: s.theme, textSize: s.textSize, highContrast: s.highContrast }));
  };

  const setInterfaceLanguage = (lang: string) => setState(s => {
    // If the user just made their interface language the same as what they
    // were learning, swap the learning target to something else.
    let learningLanguage = s.learningLanguage;
    if (learningLanguage === lang) {
      const fallback = ["en", "nl", "ar"].find(l => l !== lang) ?? null;
      learningLanguage = fallback;
    }
    return { ...s, interfaceLanguage: lang, learningLanguage };
  });
  const setSelectedConcept = (concept: string) => setState(s => ({ ...s, selectedConcept: concept }));
  const setLearningLanguage = (lang: string) => {
    setState(s => {
      const course: Course = { fromLang: s.interfaceLanguage!, concept: s.selectedConcept!, toLang: lang };
      const exists = s.courses.some(c => c.fromLang === course.fromLang && c.concept === course.concept && c.toLang === course.toLang);
      const courses = exists ? s.courses : [...s.courses, course];
      return { ...s, learningLanguage: lang, courses };
    });
  };
  const completeIntroduction = () => setState(s => ({ ...s, introductionCompleted: true }));

  const addCourse = (course: Course): boolean => {
    const exists = state.courses.some(c => c.fromLang === course.fromLang && c.concept === course.concept && c.toLang === course.toLang);
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

  const setPracticeScope = (scope: AppState["practiceScope"]) => setState(s => ({ ...s, practiceScope: scope }));
  const markLessonComplete = (lessonId: string, stars: 0 | 1 | 2 | 3 = 3) => {
    setState(s => {
      const prev = s.pathProgress[lessonId];
      const next: LessonProgressEntry = {
        stars: Math.max(prev?.stars ?? 0, stars) as 0 | 1 | 2 | 3,
        completedAt: Date.now(),
        attempts: (prev?.attempts ?? 0) + 1,
      };
      return { ...s, pathProgress: { ...s.pathProgress, [lessonId]: next } };
    });
  };
  const setTheme = (theme: ThemeChoice) => setState(s => ({ ...s, theme }));
  const setTextSize = (textSize: TextSize) => setState(s => ({ ...s, textSize }));
  const setHighContrast = (highContrast: boolean) => setState(s => ({ ...s, highContrast }));

  return (
    <AppContext.Provider value={{
      ...state, login, signup, logout, setInterfaceLanguage, setSelectedConcept,
      setLearningLanguage, completeIntroduction, addCourse, setActiveCourse,
      getReview, recordReview, setPracticeScope, markLessonComplete,
      setTheme, setTextSize, setHighContrast,
    }}>
      {children}
    </AppContext.Provider>
  );
}
