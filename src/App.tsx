import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import Layout from "@/components/Layout";
import AuthPage from "./pages/AuthPage";

import HomePage from "./pages/HomePage";
import AlphabetPage from "./pages/AlphabetPage";
import SettingsPage from "./pages/SettingsPage";
import IntroductionPage from "./pages/IntroductionPage";
import CategoryPage from "./pages/CategoryPage";
import SubcategoryPage from "./pages/SubcategoryPage";
import WordDetailPage from "./pages/WordDetailPage";
import PracticePage from "./pages/PracticePage";
import SearchPage from "./pages/SearchPage";
import NotFound from "./pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient();

const withLayout = (el: ReactNode) => <Layout>{el}</Layout>;

function AppRoutes() {
  const { isAuthenticated, introductionCompleted } = useApp();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
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
      <Route path="/practice" element={<PracticePage />} />
      <Route path="/introduction" element={<IntroductionPage />} />

      <Route path="/settings" element={withLayout(<SettingsPage />)} />
      <Route path="/alphabet" element={withLayout(<AlphabetPage />)} />
      <Route path="/languages" element={<Navigate to="/settings" replace />} />
      <Route path="/courses" element={<Navigate to="/settings" replace />} />
      <Route path="/search" element={withLayout(<SearchPage />)} />
      <Route path="/home" element={withLayout(<HomePage />)} />

      <Route path="/language" element={withLayout(<HomePage />)} />
      <Route path="/language/:category" element={withLayout(<CategoryPage />)} />
      <Route path="/language/:category/:subcategory" element={withLayout(<SubcategoryPage />)} />
      <Route path="/language/:category/:subcategory/:word" element={withLayout(<WordDetailPage />)} />

      <Route path="/" element={<Navigate to="/language" replace />} />
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
