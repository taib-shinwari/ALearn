// @/Component/Header.tsx
import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Search, LogIn } from "lucide-react";
import { useApp } from "@/Context/App";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useIsMobile } from "@/Hook/Use-Mobile";
import { type LessonProgressState } from "@/Library/lessonProgress";
import { cn } from "@/Library/utils";
import { Button } from "@/Component/UI/Button";
import { TitleBar } from "@/Component/UI/title-bar";
import { HeaderSearch } from "@/Component/Search/HeaderSearch";
import { RecallQueueButton } from "./Button/AR";
import { RecallButton } from "./Button/Recall";
import { FilterButton } from "./Button/Filter";
import { Add } from "./Button/Add";
import { AddWord } from "./Button/AddWord";
import { SelectButton } from "./Button/Select";
import { AICallButton } from "@/Component/AICallButton";
import { mobileSettingsStore } from "@/Component/Settings/mobileSettingsStore";
import { MobileSettingsHeader } from "@/Component/Layout/MobileSettings";

// 🚀 IMPORT THE 4 WORD ACTION BUTTONS
import { SpeakButton } from "./Button/Speak";
import { MarkButton } from "./Button/Mark";
import { FavoriteButton } from "./Button/Favorite";
import { EditButton } from "./Button/Edit";

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

  if ((lower === "/language" || lower === "/language/") && !hasActiveLanguages) {
    return "Add Language";
  }

  // If we are looking at a specific word detail, use the decoded wordId as the title
  const isWordDetail =
    segments[0]?.toLowerCase() === "language" &&
    segments[2]?.toLowerCase() === "dictionary" &&
    segments[3]?.toLowerCase() === "vocabulary" &&
    segments.length === 7;

  if (isWordDetail && segments[6]) {
    return decodeURIComponent(segments[6]);
  }

  return segments[segments.length - 1]
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const customBtnSize = { width: "40px", height: "40px" };

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

  const appContext = useApp();

  const {
    browsePath = [],
    isAuthenticated,
    recallReturnPath,
    setRecallReturnPath,
    setBrowsePath,
    inactiveLanguages,
    activeLanguages = [],
    recallQueue = [],
    isSettingsSidebarOpen,
    setSettingsSidebarOpen,
  } = appContext;

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [isSplitLayout, setIsSplitLayout] = useState(false);

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

  const hasActiveLanguages = activeLanguages.length > 0;
  const inLesson = !!(lessonState && 'current' in lessonState && 'total' in lessonState);
  const isMobileSettingsOpen = isMobile && !!isSettingsSidebarOpen;
  const isDesktopSettingsOpen = !isMobile && !!isSettingsSidebarOpen;
  const showBack = (!isSign && !isRootHome) || isDesktopSettingsOpen;
  const showCall = isLanguageTree && browsePath[0] === "Language" && browsePath.length >= 2 && !inLesson;
  const isRtl = uiLang === "ar";

  // Parse path segments once for dynamic checks
  const pathSegments = useMemo(() => location.pathname.split("/").filter(Boolean), [location.pathname]);

  // --- Dynamic Adjective/Vocabulary Route Validator ---
  const showRecallButton = useMemo(() => {
    const isUnderAdjectiveVocab =
      pathSegments[0]?.toLowerCase() === "language" &&
      pathSegments[2]?.toLowerCase() === "dictionary" &&
      pathSegments[3]?.toLowerCase() === "vocabulary" &&
      pathSegments[4]?.toLowerCase() === "adjective";

    return isUnderAdjectiveVocab && pathSegments.length >= 6;
  }, [pathSegments]);

  // --- Strict Subcategory "Filter" Validator ---
  const showFilterButton = useMemo(() => {
    return (
      pathSegments[0]?.toLowerCase() === "language" &&
      pathSegments[2]?.toLowerCase() === "dictionary" &&
      pathSegments[3]?.toLowerCase() === "vocabulary" &&
      pathSegments.length === 6
    );
  }, [pathSegments]);

  // --- Strict Subcategory "AddWord" & "Select" Validator ---
  const showSubcategoryControls = useMemo(() => {
    return (
      pathSegments[0]?.toLowerCase() === "language" &&
      pathSegments[2]?.toLowerCase() === "dictionary" &&
      pathSegments[3]?.toLowerCase() === "vocabulary" &&
      pathSegments.length === 6
    );
  }, [pathSegments]);

  // --- 🚀 Word Detail Action Buttons Validator (Exact 7 segments) ---
  const wordDetailContext = useMemo(() => {
    const isDetail =
      pathSegments[0]?.toLowerCase() === "language" &&
      pathSegments[2]?.toLowerCase() === "dictionary" &&
      pathSegments[3]?.toLowerCase() === "vocabulary" &&
      pathSegments.length === 7;

    return {
      show: isDetail,
      wordId: isDetail && pathSegments[6] ? decodeURIComponent(pathSegments[6]) : "",
    };
  }, [pathSegments]);

  useEffect(() => {
    if (onLayoutChange) {
      onLayoutChange(isSplitLayout);
    }
  }, [isSplitLayout, onLayoutChange]);

  const checkLayoutCapacity = useCallback(() => {
    const header = headerRef.current;
    if (!header || searchOpen || inLesson || isMobileSettingsOpen) return;

    const leftEl = leftGroupRef.current;
    const rightEl = rightGroupRef.current;
    if (!leftEl || !rightEl) return;

    let actualLeftWidth = 0;
    Array.from(leftEl.children).forEach((child) => {
      if (child.className.includes("absolute") && !child.className.includes("md:absolute")) {
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
  }, [searchOpen, inLesson, isMobileSettingsOpen]);

  useEffect(() => {
    setIsSplitLayout(false);
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
    // 1. Close settings panel if open
    if (isDesktopSettingsOpen) {
      setSettingsSidebarOpen(false);
      return;
    }
    
    // 2. Close active header search bar if open
    if (searchOpen) { 
      setSearchOpen(false); 
      return; 
    }
    
    // 3. Close and clean up active recall environments
    if (isRecall) { 
      restoreFromRecall(); 
      navigate("/"); 
      return; 
    }
    if (isSettings) { 
      navigate("/"); 
      return; 
    }

    // 4. Hierarchical category routing logic (prevents loops)
    if (isLanguageTree) {
      const segments = location.pathname.split("/").filter(Boolean);
      
      // If we are exactly at "/Language" or "/Language/", go back to Root Picker ("/")
      if (segments.length === 1 && segments[0].toLowerCase() === "language") {
        navigate("/");
        return;
      }

      // If we are deeper than "/Language", safely pop back one level
      if (segments.length > 1) {
        // Preserves exact original casing of your segments (e.g. /Language/English)
        const parentPath = "/" + segments.slice(0, -1).join("/");
        navigate(parentPath);
        return;
      }
    }

    // Fallback default back state
    navigate(-1);
  }, [
    searchOpen,
    isRecall,
    isSettings,
    isLanguageTree,
    location.pathname,
    navigate,
    restoreFromRecall,
    isDesktopSettingsOpen,
    setSettingsSidebarOpen,
    setSearchOpen
  ]);

  // Dispatch custom event to trigger the edit modal inside WordDetailView
  const handleEditClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent("word:edit-trigger"));
  }, []);

  if (isMobileSettingsOpen) {
    return (
      <MobileSettingsHeader
        isVisible={isVisible}
        isRtl={isRtl}
        t={t}
        onBack={() => mobileSettingsStore.goBack()}
        isSettingsSidebarOpen={!!isSettingsSidebarOpen}
      />
    );
  }

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 bg-transparent isolate select-none px-4 md:px-6 py-2 flex",
        isSplitLayout ? "flex-col items-start gap-y-3 h-auto" : "flex-row items-center h-16 gap-x-2",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* ROW 1: BACK BUTTON, TITLE, ADD, ADDWORD & INLINE CONTROLS */}
      <div
        ref={leftGroupRef}
        className={cn(
          "flex items-center h-[40px] relative w-full",
          !isSplitLayout && "w-auto shrink-0 gap-2"
        )}
      >
        {showBack && (
          <Button
            size="icon"
            onClick={handleBack}
            aria-label={isDesktopSettingsOpen ? (t("Close") || "Close") : (t("Back") || "Back")}
            className="shrink-0 p-0"
            style={customBtnSize}
          >
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

        {!inLesson && !searchOpen && (!isRootHome || isDesktopSettingsOpen) && (
          <div
            className={cn(
              "flex items-center h-[40px]",
              isSplitLayout
                ? "absolute left-1/2 -translate-x-1/2 w-auto max-w-[50%] justify-center"
                : "min-w-0 gap-2 max-w-full"
            )}
          >
            <TitleBar className="font-semibold text-lg truncate h-[40px] flex items-center leading-none">
              {isDesktopSettingsOpen
                ? (t("Settings") || "Settings")
                : getPageTitle(location.pathname, t, hasActiveLanguages)}
            </TitleBar>
          </div>
        )}

        {/* Global Track Language Add Button */}
        {!inLesson && !searchOpen && !isDesktopSettingsOpen && !isRootHome && isLanguageRootOnly && (
          <div className={cn("flex items-center gap-2 shrink-0 h-[40px]", isSplitLayout ? (isRtl ? "mr-auto" : "ml-auto") : "")}>
            <Add />
          </div>
        )}

        {/* Word Creation Dropdown Trigger */}
        {!inLesson && !searchOpen && !isDesktopSettingsOpen && !isRootHome && showSubcategoryControls && (
          <div className={cn("flex items-center gap-2 shrink-0 h-[40px]", isSplitLayout ? (isRtl ? "mr-auto" : "ml-auto") : "")}>
            <AddWord />
          </div>
        )}

        {/* Inline Select, Filter & Recall Buttons (Unified Row 1 inline layout) */}
        {!isSplitLayout && showSubcategoryControls && (
          <div className="flex items-center gap-2 shrink-0 h-[40px]">
            <SelectButton />
            {showFilterButton && <FilterButton />}
            {showRecallButton && <RecallButton />}
          </div>
        )}

        {/* 🚀 Inline Word Action Buttons (Desktop / Non-Split View) */}
        {!isSplitLayout && wordDetailContext.show && (
          <div className="flex items-center gap-2 shrink-0 h-[40px]">
            <SpeakButton targetText={wordDetailContext.wordId} />
            <MarkButton wordId={wordDetailContext.wordId} />
            <FavoriteButton wordId={wordDetailContext.wordId} />
            <EditButton onClick={handleEditClick} />
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
      {!inLesson && !searchOpen && !isDesktopSettingsOpen && (
        <div
          ref={rightGroupRef}
          className={cn(
            "flex items-center h-[40px] gap-2 w-full justify-between",
            !isSplitLayout && cn("w-auto shrink-0", isRtl ? "mr-auto" : "ml-auto")
          )}
        >
          {/* Split Row 2 left: AR queue, Select Button, Filter, & Split-positioned RecallButton */}
          <div className="flex items-center shrink-0 h-[40px] gap-2">
            {isLanguageTree && recallQueue.length > 0 && <RecallQueueButton />}
            {isSplitLayout && showSubcategoryControls && (
              <>
                <SelectButton />
                {showFilterButton && <FilterButton />}
                {showRecallButton && <RecallButton />}
              </>
            )}

            {/* 🚀 Split Layout Word Action Buttons (Mobile / Split View bottom bar) */}
            {isSplitLayout && wordDetailContext.show && (
              <>
                <SpeakButton targetText={wordDetailContext.wordId} />
                <MarkButton wordId={wordDetailContext.wordId} />
                <FavoriteButton wordId={wordDetailContext.wordId} />
                <EditButton onClick={handleEditClick} />
              </>
            )}
          </div>

          <div className={cn("flex items-center gap-2 shrink-0 h-[40px]", isSplitLayout && (isRtl ? "mr-auto" : "ml-auto"))}>
            {showCall && <AICallButton />}

            <Button size="icon" aria-label={t("Search") || "Search"} onClick={() => setSearchOpen(true)} className="p-0" style={customBtnSize}>
              <Search className="h-5 w-5" />
            </Button>

            <Button
              size="icon"
              aria-label={t("Settings") || "Settings"}
              onClick={() => {
                if (typeof setSettingsSidebarOpen === "function") {
                  setSettingsSidebarOpen(true);
                } else {
                  console.error("[SETTINGS ERROR] setSettingsSidebarOpen is not available as a valid context function.");
                }
              }}
              className="p-0"
              style={customBtnSize}
            >
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