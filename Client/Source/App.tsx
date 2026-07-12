import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/Component/UI/sonner";
import { Toaster } from "@/Component/UI/toaster";
import { TooltipProvider } from "@/Component/UI/tooltip";
import { AppProvider } from "@/Context/App";
import { Layout } from "@/Component/Layout/Index";

// Pages
import AuthPage from "@/Page/Authorization";
import SettingsPage from "@/Page/Settings";
import FlashcardsPage from "@/Page/Flashcard";
import NotFound from "@/Page/NotFound";

// Modularized Views
import RootPicker from "@/Page/Root";
import ChessIndex from "@/Page/Chess/Index";
import LanguageRoot from "@/Page/Language/Root";
import LanguageIndex from "@/Page/Language/Index";
import LessonPage from "@/Page/Lesson";
import DictionaryRoot from "@/Page/Language/Dictionary/Root";
import DictionaryCategory from "@/Page/Language/Dictionary/Category";
import DictionarySubcategory from "@/Page/Language/Dictionary/Subcategory";
import DictionaryWord from "@/Page/Language/Dictionary/Word";

const queryClient = new QueryClient();

const RouteLayout = () => (
  <Layout>
    <Outlet />
  </Layout>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/Sign" element={<AuthPage />} />
              <Route path="/Settings" element={<SettingsPage />} />
              <Route path="/Recall" element={<FlashcardsPage />} />
              
              {/* Legacy lowercase aliases */}
              <Route path="/sign" element={<AuthPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/recall" element={<FlashcardsPage />} />

              {/* Layout-wrapped application paths */}
              <Route element={<RouteLayout />}>
                <Route path="/" element={<RootPicker />} />
                <Route path="/Chess" element={<ChessIndex />} />

                {/* Strictly Capitalized Navigation Trees */}
                <Route path="/Language">
                  <Route index element={<LanguageRoot />} />
                  <Route path=":langName">
                    <Route index element={<LanguageIndex />} />
                    <Route path="Lessons" element={<LessonPage />} />
                    
                    <Route path="Dictionary">
                      <Route index element={<DictionaryRoot />} />
                      <Route path="Vocabulary">
                        <Route index element={<DictionaryCategory />} />
                        <Route path=":categoryId" element={<DictionarySubcategory />} />
                        <Route path=":categoryId/:subcategoryId" element={<DictionaryWord />} />
                      </Route>
                    </Route>
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}