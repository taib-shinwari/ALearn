import { useState, useEffect, useRef, memo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Search, LogIn } from "lucide-react";
import { useApp } from "@/Context/App";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useIsMobile } from "@/Hook/use-mobile";
import { type LessonProgressState } from "@/Library/lessonProgress";
import { cn } from "@/Library/utils";
import { Button } from "@/Component/UI/button";
import { TitleBar } from "@/Component/UI/title-bar";
import { HeaderSearch } from "@/Component/Search/HeaderSearch";
import { RecallQueueButton } from "@/Component/RecallQueueButton";
import { AICallButton } from "@/Component/AICallButton";
import { Add } from "./Add";

interface HeaderProps {
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  lessonState: LessonProgressState | null;
}

function getPageTitle(pathname: string, t: (k: string) => string): string {
  const lower = pathname.toLowerCase();
  if (lower.startsWith("/settings")) return t("Settings") || "Settings";
  if (lower.startsWith("/recall")) return t("Recall") || "Recall";
  if (lower.startsWith("/sign")) return "Sign In";
  
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Chess Arena";
  
  return segments[segments.length - 1]
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const Header = memo(function Header({ searchOpen, setSearchOpen, lessonState }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { uiLang, t } = useCourseLanguage();
  
  const {
    browsePath = [],
    isAuthenticated,
    recallReturnPath,
    setRecallReturnPath,
    setBrowsePath,
  } = useApp();

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  const lowerPath = location.pathname.toLowerCase();
  const isSettings = lowerPath.startsWith("/settings");
  const isRecall = lowerPath.startsWith("/recall");
  const isSign = lowerPath.startsWith("/sign");
  const isRootHome = location.pathname === "/";

  const isLanguageTree = lowerPath.startsWith("/language");
  const isLanguageRootOnly = lowerPath === "/language" || lowerPath === "/language/"; 

  const inLesson = !!(lessonState && 'current' in lessonState && 'total' in lessonState);
  const showBack = !isSign && !isRootHome;
  const showCall = isLanguageTree && browsePath[0] === "Language" && browsePath.length >= 2 && !inLesson;
  const isRtl = uiLang === "ar";

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const forceHide = () => setIsVisible(false);
    const forceShow = () => setIsVisible(true);

    window.addEventListener("header:hide", forceHide);
    window.addEventListener("header:show", forceShow);

    return () => {
      window.removeEventListener("header:hide", forceHide);
      window.removeEventListener("header:show", forceShow);
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [searchOpen, setSearchOpen]);

  const restoreFromRecall = useCallback(() => {
    if (recallReturnPath) {
      setBrowsePath(recallReturnPath);
      setRecallReturnPath(null);
    }
  }, [recallReturnPath, setBrowsePath, setRecallReturnPath]);

  const handleBack = useCallback(() => {
    if (searchOpen) { setSearchOpen(false); return; }
    if (isRecall) { restoreFromRecall(); navigate("/"); return; }
    if (isSettings) { navigate("/"); return; }
    
    navigate(-1);
  }, [searchOpen, isRecall, isSettings, navigate, restoreFromRecall]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 min-h-16 h-auto py-2 z-50 transition-transform duration-300 flex flex-wrap items-center px-4 md:px-6 bg-transparent isolate select-none gap-x-2 gap-y-2",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* 1. GO BACK BUTTON */}
      {showBack && (
        <Button size="icon" onClick={handleBack} aria-label={t("Back") || "Back"} className="shrink-0 h-9 w-9 order-1">
          <ArrowLeft className={cn("h-5 w-5", isRtl && "rotate-180")} />
        </Button>
      )}
      
      {inLesson && lessonState && (
        <div className="w-32 h-3 bg-muted rounded-full overflow-hidden border border-border order-1">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${(lessonState.current / Math.max(1, lessonState.total)) * 100}%` }}
          />
        </div>
      )}

      {/* 2. TITLE CONTAINER */}
      {!inLesson && !searchOpen && !isRootHome && (
        <div className="order-2 min-w-0 h-9 flex items-center max-w-full">
          <TitleBar className="font-semibold text-lg truncate h-full flex items-center">
            {getPageTitle(location.pathname, t)}
          </TitleBar>
        </div>
      )}

      {/* 3. ADD BUTTON */}
      {!inLesson && !searchOpen && !isRootHome && isLanguageRootOnly && (
        <div className="order-3 shrink-0 h-9 flex items-center">
          <Add />
        </div>
      )}

      {/* 4. RECALL QUEUE BUTTON */}
      {!inLesson && !searchOpen && isLanguageTree && (
        <div className="order-4 shrink-0 h-9 flex items-center">
          <RecallQueueButton />
        </div>
      )}

      {/* 5. SEARCH INPUT OVERLAY */}
      {!inLesson && searchOpen && (
        <div className={cn("order-5 transition-all duration-300 ease-out", isMobile ? "w-[140px]" : "w-[260px]")}>
          <HeaderSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
        </div>
      )}

      {/* 6. RIGHT ACTIONS ENDBLOCK */}
      {!inLesson && !searchOpen && (
        <div className={cn("h-9 flex items-center gap-2 order-5 shrink-0", isRtl ? "mr-auto" : "ml-auto")}>
          {showCall && <AICallButton />}
          
          <Button size="icon" aria-label={t("Search") || "Search"} onClick={() => setSearchOpen(true)} className="h-9 w-9">
            <Search className="h-5 w-5" />
          </Button>
          
          <Button size="icon" aria-label={t("Settings") || "Settings"} onClick={() => navigate("/Settings")} className="h-9 w-9">
            <Settings className="h-5 w-5" />
          </Button>
          
          {!isAuthenticated && !isSign && (
            <Button size="icon" aria-label="Sign in" onClick={() => navigate("/Sign")} className="h-9 w-9">
              <LogIn className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}
    </header>
  );
});