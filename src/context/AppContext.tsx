import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  currentLesson: string | null;
  courses: Course[];
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => boolean;
  signup: (firstName: string, email: string, password: string) => boolean;
  logout: () => void;
  setInterfaceLanguage: (lang: string) => void;
  setSelectedConcept: (concept: string) => void;
  setLearningLanguage: (lang: string) => void;
  completeIntroduction: () => void;
  setCurrentLesson: (lesson: string | null) => void;
  addCourse: (course: Course) => boolean;
  setActiveCourse: (course: Course) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem("appState");
    if (saved) {
      const parsed = JSON.parse(saved);
      // migrate old state
      if (!parsed.courses) parsed.courses = [];
      return parsed;
    }
    return {
      isAuthenticated: false,
      user: null,
      interfaceLanguage: null,
      selectedConcept: null,
      learningLanguage: null,
      introductionCompleted: false,
      currentLesson: null,
      courses: [],
    };
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
    setState({
      isAuthenticated: false,
      user: null,
      interfaceLanguage: null,
      selectedConcept: null,
      learningLanguage: null,
      introductionCompleted: false,
      currentLesson: null,
      courses: [],
    });
  };

  const setInterfaceLanguage = (lang: string) => setState(s => ({ ...s, interfaceLanguage: lang }));
  const setSelectedConcept = (concept: string) => {
    setState(s => {
      const newCourse: Course = { fromLang: s.interfaceLanguage!, concept, toLang: "" };
      // toLang set later via setLearningLanguage
      return { ...s, selectedConcept: concept };
    });
  };
  const setLearningLanguage = (lang: string) => {
    setState(s => {
      const course: Course = { fromLang: s.interfaceLanguage!, concept: s.selectedConcept!, toLang: lang };
      const exists = s.courses.some(c => c.fromLang === course.fromLang && c.concept === course.concept && c.toLang === course.toLang);
      const courses = exists ? s.courses : [...s.courses, course];
      return { ...s, learningLanguage: lang, courses };
    });
  };
  const completeIntroduction = () => setState(s => ({ ...s, introductionCompleted: true }));
  const setCurrentLesson = (lesson: string | null) => setState(s => ({ ...s, currentLesson: lesson }));

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

  return (
    <AppContext.Provider value={{ ...state, login, signup, logout, setInterfaceLanguage, setSelectedConcept, setLearningLanguage, completeIntroduction, setCurrentLesson, addCourse, setActiveCourse }}>
      {children}
    </AppContext.Provider>
  );
}
