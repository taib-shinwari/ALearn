import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/Component/UI/sonner";
import { Toaster } from "@/Component/UI/toaster";
import { TooltipProvider } from "@/Component/UI/tooltip";
import { AppProvider } from "@/Context/App";
import { Layout } from "@/Component/Layout/Index";

// Main Pages
import AuthPage from "@/Page/Authorization";
import NotFound from "@/Page/NotFound";
import RootPicker from "@/Page/Root";

// Chess Modular Views
import ChessIndex from "@/Page/Chess/Index";
import { ChessPlayView } from "@/Page/Chess/Play";
import { ChessLessonView } from "@/Page/Chess/Lesson";

// Language Modular Views
import LanguageRoot from "@/Page/Language/Root";
import LanguageIndex from "@/Page/Language/Index";
import LessonPage from "@/Page/Lesson";
import DictionaryRoot from "@/Page/Language/Dictionary/Root";
import DictionaryCategory from "@/Page/Language/Dictionary/Category";
import DictionarySubcategory from "@/Page/Language/Dictionary/Subcategory";
import DictionaryWord from "@/Page/Language/Dictionary/Word";
import WordDetailView from "@/Page/Language/Dictionary/Detail";

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

              {/* Layout-wrapped application paths */}
              <Route element={<RouteLayout />}>
                <Route path="/" element={<RootPicker />} />

                {/* Explicit Navigation Tree for Chess */}
                <Route path="/Chess">
                  <Route index element={<ChessIndex />} />
                  <Route path="Play" element={<ChessPlayView />} />
                  <Route path="Puzzle" element={<ChessIndex />} />

                  {/* Lessons Navigation Routes mapped to ChessLessonView */}
                  <Route path="Lesson">
                    <Route index element={<ChessLessonView />} />
                    <Route path=":category">
                      <Route index element={<ChessLessonView />} />
                      <Route path=":subcategory">
                        <Route index element={<ChessLessonView />} />
                        <Route path=":lessonId" element={<ChessLessonView />} />
                      </Route>
                    </Route>
                  </Route>
                </Route>

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
                        <Route path=":categoryId/:subcategoryId/:wordId" element={<WordDetailView />} />
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