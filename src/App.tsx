import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import Layout from "@/components/Layout";
import AuthPage from "./pages/AuthPage";

import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";
import IntroductionPage from "./pages/IntroductionPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import NotFound from "./pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient();

const withLayout = (el: ReactNode) => <Layout>{el}</Layout>;

function AppRoutes() {
  const { isAuthenticated, introductionCompleted } = useApp();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/sign" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/sign" replace />} />
      </Routes>
    );
  }

  if (!introductionCompleted) {
    return (
      <Routes>
        <Route path="/introduction" element={<IntroductionPage />} />
        <Route path="*" element={<Navigate to="/introduction" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/introduction" element={<IntroductionPage />} />
      <Route path="/sign" element={<Navigate to="/" replace />} />
      <Route path="/settings" element={withLayout(<SettingsPage />)} />
      <Route path="/recall" element={withLayout(<FlashcardsPage />)} />
      <Route path="/" element={withLayout(<HomePage />)} />
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
