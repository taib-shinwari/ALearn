import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ReviewState, createReviewState, updateReview } from "@/lib/spacedRepetition";

export interface Course {
  fromLang: string;
  concept: string;
  toLang: string;
}

interface AppState {
  isAuthenticated: boolean;
  user: { firstName: string; email: string } | null;
  interfaceLanguage: string | null;
  selectedConcept: string | null;
  learningLanguage: string | null;
  introductionCompleted: boolean;
  courses: Course[];
  reviews: ReviewState[];
  practiceScope: { type: "global" | "category" | "subcategory" | "word"; id?: string } | null;
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
  interfaceLanguage: null,
  selectedConcept: null,
  learningLanguage: null,
  introductionCompleted: false,
  courses: [],
  reviews: [],
  practiceScope: null,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem("appState");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Strip out any legacy streak/xp fields
      const { streak, xp, lastPracticeDate, ...clean } = parsed;
      return { ...defaultState, ...clean };
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem("appState", JSON.stringify(state));
  }, [state]);

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
    setState(defaultState);
  };

  const setInterfaceLanguage = (lang: string) => setState(s => ({ ...s, interfaceLanguage: lang }));
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
    // Migrate older shapes that miss new fields
    return {
      ease: 2.5,
      reps: existing.learned ? 1 : 0,
      lapses: 0,
      ...existing,
    };
  };

  const recordReview = (wordId: string, correct: boolean) => {
    setState(s => {
      const existing = s.reviews.find(r => r.wordId === wordId);
      const current = existing || createReviewState(wordId);
      const updated = updateReview(current, correct);
      const reviews = existing
        ? s.reviews.map(r => r.wordId === wordId ? updated : r)
        : [...s.reviews, updated];
      return { ...s, reviews };
    });
  };

  const setPracticeScope = (scope: AppState["practiceScope"]) => {
    setState(s => ({ ...s, practiceScope: scope }));
  };

  return (
    <AppContext.Provider value={{
      ...state, login, signup, logout, setInterfaceLanguage, setSelectedConcept,
      setLearningLanguage, completeIntroduction, addCourse, setActiveCourse,
      getReview, recordReview, setPracticeScope,
    }}>
      {children}
    </AppContext.Provider>
  );
}
