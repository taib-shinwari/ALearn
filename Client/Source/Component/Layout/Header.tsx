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
import { DeleteLanguage } from "./Delete";

interface HeaderProps {
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  lessonState: LessonProgressState | null;
  onLayoutChange?: (isSplit: boolean) => void;
}

function getPageTitle(pathname: string, t: (k: string) => string, hasActiveLanguages: boolean): string {
  const lower = pathname.toLowerCase();
  if (lower.startsWith("/settings")) return t("Settings") || "Settings";
  if (lower.startsWith("/recall")) return t("Recall") || "Recall";
  if (lower.startsWith("/sign")) return "Sign In";
  
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "";
  
  // Custom baseline check for empty language track configuration
  if ((lower === "/language" || lower === "/language/") && !hasActiveLanguages) {
    return "Add Language";
  }
  
  return segments[segments.length - 1]
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const Header = memo(function Header({ 
  searchOpen, 
  setSearchOpen, 
  lessonState,
  onLayoutChange 
}: HeaderProps) {
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
    inactiveLanguages,
    activeLanguages = [],
  } = useApp();

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [isSplitLayout, setIsSplitLayout] = useState(false);
  const [isDeleteExpanded, setIsDeleteExpanded] = useState(false);
  
  const headerRef = useRef<HTMLHeadingElement>(null);
  const leftGroupRef = useRef<HTMLDivElement>(null);
  const rightGroupRef = useRef<HTMLDivElement>(null);

  const lowerPath = location.pathname.toLowerCase();
  const isSettings = lowerPath.startsWith("/settings");
  const isRecall = lowerPath.startsWith("/recall");
  const isSign = lowerPath.startsWith("/sign");
  const isRootHome = location.pathname === "/";
  const isLanguageTree = lowerPath.startsWith("/language");
  const isLanguageRootOnly = lowerPath === "/language" || lowerPath === "/language/"; 

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const isDirectLanguageChild = isLanguageTree && pathSegments.length === 2; 

  const hasActiveLanguages = activeLanguages.length > 0;
  const inLesson = !!(lessonState && 'current' in lessonState && 'total' in lessonState);
  const showBack = !isSign && !isRootHome;
  const showCall = isLanguageTree && browsePath[0] === "Language" && browsePath.length >= 2 && !inLesson;
  const isRtl = uiLang === "ar";

  const customBtnSize = { width: "40px", height: "40px" };

  const effectiveSplit = isSplitLayout || isDeleteExpanded;

  useEffect(() => {
    if (onLayoutChange) {
      onLayoutChange(effectiveSplit);
    }
  }, [effectiveSplit, onLayoutChange]);

  const checkLayoutCapacity = useCallback(() => {
    const header = headerRef.current;
    if (!header || searchOpen || inLesson) return;

    const leftEl = leftGroupRef.current;
    const rightEl = rightGroupRef.current;
    if (!leftEl || !rightEl) return;

    let actualLeftWidth = 0;
    Array.from(leftEl.children).forEach((child) => {
      if (child.classList.contains("absolute") && !child.classList.contains("md:absolute")) {
        const titleText = child.querySelector("span, h1, div");
        actualLeftWidth += titleText ? titleText.clientWidth : 0;
      } else {
        actualLeftWidth += (child as HTMLElement).offsetWidth;
      }
    });

    let actualRightWidth = 0;
    Array.from(rightEl.children).forEach((child) => {
      actualRightWidth += (child as HTMLElement).offsetWidth;
    });

    const availableWidth = header.clientWidth;
    const paddingBuffer = window.innerWidth >= 768 ? 100 : 64;

    if (actualLeftWidth + actualRightWidth + paddingBuffer >= availableWidth) {
      setIsSplitLayout(true);
    } else {
      setIsSplitLayout(false);
    }
  }, [searchOpen, inLesson]);

  const handleDeleteStateChange = useCallback((isExpanded: boolean) => {
    setIsDeleteExpanded(isExpanded);
    requestAnimationFrame(() => {
      checkLayoutCapacity();
    });
  }, [checkLayoutCapacity]);

  useEffect(() => {
    setIsSplitLayout(false);
    setIsDeleteExpanded(false);

    const rafId = requestAnimationFrame(() => {
      checkLayoutCapacity();
    });

    return () => cancelAnimationFrame(rafId);
  }, [location.pathname, checkLayoutCapacity]);

  useEffect(() => {
    checkLayoutCapacity();
    window.addEventListener("resize", checkLayoutCapacity);
    return () => window.removeEventListener("resize", checkLayoutCapacity);
  }, [checkLayoutCapacity, inactiveLanguages.length, showCall, showBack, isAuthenticated]);

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
      ref={headerRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 bg-transparent isolate select-none px-4 md:px-6 py-2 flex",
        effectiveSplit ? "flex-col items-start gap-y-3 h-auto" : "flex-row items-center h-16 gap-x-2",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* ROW 1: BACK BUTTON, TITLE CONTAINER */}
      <div 
        ref={leftGroupRef}
        className={cn(
          "flex items-center h-[40px] relative w-full",
          !effectiveSplit && "w-auto shrink-0 gap-2"
        )}
      >
        {showBack && (
          <Button size="icon" onClick={handleBack} aria-label={t("Back") || "Back"} className="shrink-0 p-0" style={customBtnSize}>
            <ArrowLeft className={cn("h-5 w-5", isRtl && "rotate-180")} />
          </Button>
        )}
        
        {inLesson && lessonState && (
          <div className="w-32 h-3 bg-muted rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${(lessonState.current / Math.max(1, lessonState.total)) * 100}%` }}
            />
          </div>
        )}

        {!inLesson && !searchOpen && !isRootHome && (
          <div 
            className={cn(
              "flex items-center h-[40px]",
              effectiveSplit 
                ? "absolute left-1/2 -translate-x-1/2 w-auto max-w-[50%] justify-center" 
                : "min-w-0 gap-2 max-w-full"
            )}
          >
            <TitleBar className="font-semibold text-lg truncate h-[40px] flex items-center leading-none">
              {getPageTitle(location.pathname, t, hasActiveLanguages)}
            </TitleBar>
          </div>
        )}

        {!inLesson && !searchOpen && isDirectLanguageChild && (
          <div 
            className={cn(
              "flex items-center h-[40px]",
              isDeleteExpanded 
                ? "absolute top-[52px] left-1/2 -translate-x-1/2 z-50" 
                : cn("shrink-0", effectiveSplit ? (isRtl ? "mr-auto" : "ml-auto") : "ml-2")
            )}
          >
            <DeleteLanguage 
              languageName={pathSegments[pathSegments.length - 1] || ""} 
              onStateChange={handleDeleteStateChange}
            />
          </div>
        )}

        {/* Dynamic configuration visibility checker for top utility triggers */}
        {!inLesson && !searchOpen && !isRootHome && isLanguageRootOnly && inactiveLanguages.length > 0 && hasActiveLanguages && (
          <div className={cn("flex items-center gap-2 shrink-0 h-[40px]", effectiveSplit ? (isRtl ? "mr-auto" : "ml-auto") : "")}>
            <Add />
          </div>
        )}
      </div>

      {/* SEARCH OVERLAY BLOCK */}
      {!inLesson && searchOpen && (
        <div className={cn("transition-all duration-300 ease-out", isMobile ? "w-[140px]" : "w-[260px]", isRtl ? "mr-auto" : "ml-auto")}>
          <HeaderSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
        </div>
      )}

      {/* ROW 2 / UTILITIES */}
      {!inLesson && !searchOpen && (
        <div 
          ref={rightGroupRef}
          className={cn(
            "flex items-center h-[40px] gap-2 w-full justify-between",
            !effectiveSplit && cn("w-auto shrink-0", isRtl ? "mr-auto" : "ml-auto")
          )}
        >
          <div className="flex items-center shrink-0 h-[40px]">
            {isLanguageTree && <RecallQueueButton />}
          </div>

          <div className={cn("flex items-center gap-2 shrink-0 h-[40px]", effectiveSplit && (isRtl ? "mr-auto" : "ml-auto"))}>
            {showCall && <AICallButton />}
            
            <Button size="icon" aria-label={t("Search") || "Search"} onClick={() => setSearchOpen(true)} className="p-0" style={customBtnSize}>
              <Search className="h-5 w-5" />
            </Button>
            
            <Button size="icon" aria-label={t("Settings") || "Settings"} onClick={() => navigate("/Settings")} className="p-0" style={customBtnSize}>
              <Settings className="h-5 w-5" />
            </Button>
            
            {isRootHome && !isAuthenticated && !isSign && (
              <Button size="icon" aria-label="Sign in" onClick={() => navigate("/Sign")} className="p-0" style={customBtnSize}>
                <LogIn className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
});