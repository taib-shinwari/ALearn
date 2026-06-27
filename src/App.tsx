import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import Layout from "@/components/Layout";
import AuthPage from "./pages/AuthPage";

import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import NotFound from "./pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient();

const withLayout = (el: ReactNode) => <Layout>{el}</Layout>;

function AppRoutes() {
  return (
    <Routes>
      <Route path="/Sign" element={withLayout(<AuthPage />)} />
      <Route path="/Settings" element={withLayout(<SettingsPage />)} />
      <Route path="/Recall" element={withLayout(<FlashcardsPage />)} />
      {/* Legacy lowercase aliases */}
      <Route path="/sign" element={withLayout(<AuthPage />)} />
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
