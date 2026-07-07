import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/Component/UI/sonner";
import { Toaster } from "@/Component/UI/toaster";
import { TooltipProvider } from "@/Component/UI/tooltip";
import { AppProvider } from "@/Context/App";
import Layout from "@/Component/Layout/Index";
import AuthPage from "@/Page/AuthPage";

import HomePage from "@/Page/Navigation";
import SettingsPage from "@/Page/SettingsPage";
import FlashcardsPage from "@/Page/FlashcardsPage";
import NotFound from "@/Page/NotFound";
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
      <Route path="/Language/*" element={withLayout(<HomePage />)} />
      <Route path="/language/*" element={withLayout(<HomePage />)} />
      <Route path="/Chess/*" element={withLayout(<HomePage />)} />
      <Route path="/chess/*" element={withLayout(<HomePage />)} />
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
