import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AppState {
  isAuthenticated: boolean;
  user: { firstName: string; email: string } | null;
  interfaceLanguage: string | null;
  selectedConcept: string | null;
  learningLanguage: string | null;
  introductionCompleted: boolean; // global, cross-language
  currentLesson: string | null;
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
    if (saved) return JSON.parse(saved);
    return {
      isAuthenticated: false,
      user: null,
      interfaceLanguage: null,
      selectedConcept: null,
      learningLanguage: null,
      introductionCompleted: false,
      currentLesson: null,
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
    });
  };

  const setInterfaceLanguage = (lang: string) => setState(s => ({ ...s, interfaceLanguage: lang }));
  const setSelectedConcept = (concept: string) => setState(s => ({ ...s, selectedConcept: concept }));
  const setLearningLanguage = (lang: string) => setState(s => ({ ...s, learningLanguage: lang }));
  const completeIntroduction = () => setState(s => ({ ...s, introductionCompleted: true }));
  const setCurrentLesson = (lesson: string | null) => setState(s => ({ ...s, currentLesson: lesson }));

  return (
    <AppContext.Provider value={{ ...state, login, signup, logout, setInterfaceLanguage, setSelectedConcept, setLearningLanguage, completeIntroduction, setCurrentLesson }}>
      {children}
    </AppContext.Provider>
  );
}
