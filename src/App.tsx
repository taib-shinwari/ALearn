import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import Layout from "@/components/Layout";
import AuthPage from "./pages/AuthPage";
import LanguageSelectPage from "./pages/LanguageSelectPage";
import ConceptSelectPage from "./pages/ConceptSelectPage";
import HomePage from "./pages/HomePage";
import CoursesPage from "./pages/CoursesPage";
import SettingsPage from "./pages/SettingsPage";
import IntroductionPage from "./pages/IntroductionPage";
import CategoryPage from "./pages/CategoryPage";
import SubcategoryPage from "./pages/SubcategoryPage";
import WordDetailPage from "./pages/WordDetailPage";
import PracticePage from "./pages/PracticePage";
import NotFound from "./pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient();

const withLayout = (el: ReactNode) => <Layout>{el}</Layout>;

function AppRoutes() {
  const { isAuthenticated, interfaceLanguage, selectedConcept, introductionCompleted } = useApp();

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
      {/* Pages without the global layout */}
      <Route path="/practice" element={<PracticePage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/introduction" element={<IntroductionPage />} />

      {/* Pages with the global layout (top bar + practice + breadcrumbs) */}
      <Route path="/home" element={withLayout(<HomePage />)} />
      <Route path="/settings" element={withLayout(<SettingsPage />)} />
      <Route path="/:category" element={withLayout(<CategoryPage />)} />
      <Route path="/:category/:subcategory" element={withLayout(<SubcategoryPage />)} />
      <Route path="/:category/:subcategory/:word" element={withLayout(<WordDetailPage />)} />

      <Route path="/" element={<Navigate to="/home" replace />} />
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
