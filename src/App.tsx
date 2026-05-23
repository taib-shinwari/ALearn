import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import Layout from "@/components/Layout";
import AuthPage from "./pages/AuthPage";

import ConceptSelectPage from "./pages/ConceptSelectPage";
import HomePage from "./pages/HomePage";
import CoursesPage from "./pages/CoursesPage";
import SettingsPage from "./pages/SettingsPage";
import IntroductionPage from "./pages/IntroductionPage";
import CategoryPage from "./pages/CategoryPage";
import SubcategoryPage from "./pages/SubcategoryPage";
import WordDetailPage from "./pages/WordDetailPage";
import PracticePage from "./pages/PracticePage";
import SearchPage from "./pages/SearchPage";
import NotFound from "./pages/NotFound";
import ChessHomePage from "./pages/chess/ChessHomePage";
import ChessLessonPage from "./pages/chess/ChessLessonPage";
import ChessPuzzlePage from "./pages/chess/ChessPuzzlePage";
import { ReactNode } from "react";

const queryClient = new QueryClient();

const withLayout = (el: ReactNode) => <Layout>{el}</Layout>;

function AppRoutes() {
  const { isAuthenticated, selectedConcept, introductionCompleted } = useApp();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
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

  if (!introductionCompleted) {
    return (
      <Routes>
        <Route path="/introduction" element={<IntroductionPage />} />
        <Route path="*" element={<Navigate to="/introduction" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Practice flow has no top bar */}
      <Route path="/practice" element={<PracticePage />} />
      <Route path="/introduction" element={<IntroductionPage />} />

      {/* Pages with the global layout (top bar everywhere except practice) */}
      <Route path="/settings" element={withLayout(<SettingsPage />)} />
      <Route path="/courses" element={withLayout(<CoursesPage />)} />
      <Route path="/search" element={withLayout(<SearchPage />)} />
      <Route path="/home" element={withLayout(<HomePage />)} />
      <Route path="/:concept" element={withLayout(<HomePage />)} />
      <Route path="/:concept/:category" element={withLayout(<CategoryPage />)} />
      <Route path="/:concept/:category/:subcategory" element={withLayout(<SubcategoryPage />)} />
      <Route path="/:concept/:category/:subcategory/:word" element={withLayout(<WordDetailPage />)} />

      <Route path="/" element={<Navigate to={`/${selectedConcept}`} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
