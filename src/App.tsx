import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import AuthPage from "./pages/AuthPage";
import LanguageSelectPage from "./pages/LanguageSelectPage";
import ConceptSelectPage from "./pages/ConceptSelectPage";
import HomePage from "./pages/HomePage";
import CoursesPage from "./pages/CoursesPage";
import SettingsPage from "./pages/SettingsPage";
import IntroductionPage from "./pages/IntroductionPage";
import LessonPage from "./pages/LessonPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated, interfaceLanguage, selectedConcept } = useApp();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
      </Routes>
    );
  }

  if (!interfaceLanguage) {
    return (
      <Routes>
        <Route path="/language-select" element={<LanguageSelectPage />} />
        <Route path="*" element={<Navigate to="/language-select" />} />
      </Routes>
    );
  }

  if (!selectedConcept) {
    return (
      <Routes>
        <Route path="/concept-select" element={<ConceptSelectPage />} />
        <Route path="*" element={<Navigate to="/concept-select" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/home" element={<HomePage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/introduction" element={<IntroductionPage />} />
      <Route path="/lesson/:lessonId" element={<LessonPage />} />
      <Route path="*" element={<Navigate to="/home" />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
