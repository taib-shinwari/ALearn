// @/Component/Layout.tsx (or wherever your layout file resides) COPYCAT
import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { lessonProgress, type LessonProgressState } from "@/Library/lessonProgress";
import { cn } from "@/Library/utils";
import { Header } from "./Header";
import { SettingsSidebar } from "@/Component/Settings/Index"; // Imported matching your updated file path

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { uiLang } = useCourseLanguage();
  const [searchOpen, setSearchOpen] = useState(false);
  const [lessonState, setLessonState] = useState<LessonProgressState | null>(null);
  
  // Track the split layout state here to apply dynamic padding
  const [isHeaderSplit, setIsHeaderSplit] = useState(false);
  
  useEffect(() => {
    const checkProgress = () => {
      const currentProgress = lessonProgress.get();
      if (currentProgress && typeof currentProgress === 'object' && 'current' in currentProgress) {
        setLessonState(currentProgress);
      } else {
        setLessonState(null);
      }
    };
    checkProgress();
    return lessonProgress.subscribe(checkProgress);
  }, [location.pathname]);

  return (
    <div 
      className="min-h-screen w-full flex flex-col bg-background relative" 
      dir={uiLang === "ar" ? "rtl" : "ltr"}
    >
      <Header 
        searchOpen={searchOpen} 
        setSearchOpen={setSearchOpen} 
        lessonState={lessonState} 
        // Pass down the state setter callback
        onLayoutChange={setIsHeaderSplit}
      />
      
      <main 
        className={cn(
          "flex-1 w-full flex flex-col md:overflow-hidden",
          // Conditionally apply pt-28 or pt-16, and adjust calculated height variable accordingly
          isHeaderSplit 
            ? "pt-28 md:h-[calc(100vh-112px)]" 
            : "pt-16 md:h-[calc(100vh-64px)]"
        )}
      >
        {children}
      </main>

      {/* FIXED: Placed Sidebar element directly inside the DOM tree layout hook just like the original */}
      <SettingsSidebar />
    </div>
  );
}