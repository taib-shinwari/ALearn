import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Search, LogIn, X } from "lucide-react";
import { useApp } from "@/Context/App";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useIsMobile } from "@/Hook/Use-Mobile";
import { type LessonProgressState } from "@/Library/lessonProgress";
import { cn } from "@/Library/utils";
import { Button } from "@/Component/UI/Button";
import { Input } from "@/Component/UI/Input";
import { TitleBar } from "@/Component/UI/title-bar";
import { HeaderSearch } from "@/Component/Search/HeaderSearch";
import { RecallQueueButton } from "./AR"; 
import { RecallButton } from "./Recall"; 
import { Add } from "./Add";
import { AddWord } from "./AddWord";
import { SelectButton } from "./Select"; // Imported the new Select component
import { AICallButton } from "@/Component/AICallButton";
import { mobileSettingsStore } from "@/Component/Settings/mobileSettingsStore";

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

  // --- mobileSettingsStore wiring ---
  const [mSettings, setMSettings] = useState(() => mobileSettingsStore.getState());
  const [settingsSearchActive, setSettingsSearchActive] = useState(false);
  const [settingsSearchValue, setSettingsSearchValue] = useState("");
  const settingsSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribeMode = mobileSettingsStore.subscribe(() => {
      const state = mobileSettingsStore.getState();
      setMSettings(state);
      setSettingsSearchActive(state.isSearchMode);
    });
    const unsubscribeSearch = mobileSettingsStore.subscribeSearch(() => {
      setSettingsSearchValue(mobileSettingsStore.getSearchQuery());
    });
    return () => {
      unsubscribeMode();
      unsubscribeSearch();
    };
  }, []);

  useEffect(() => {
    if (settingsSearchActive && settingsSearchInputRef.current) {
      settingsSearchInputRef.current.focus();
    }
    if (!settingsSearchActive) setSettingsSearchValue("");
  }, [settingsSearchActive]);

  useEffect(() => {
    if (!isSettingsSidebarOpen && settingsSearchActive) {
      mobileSettingsStore.exitSearchMode();
    }
  }, [isSettingsSidebarOpen, settingsSearchActive]);

  const isMobileSettingsOpen = isMobile && !!isSettingsSidebarOpen;
  const isDesktopSettingsOpen = !isMobile && !!isSettingsSidebarOpen;

  const handleSettingsSearchChange = (v: string) => {
    setSettingsSearchValue(v);
    mobileSettingsStore.setSearchQuery(v);
  };

  const exitSettingsSearch = () => {
    mobileSettingsStore.exitSearchMode();
  };
  // --- end mobileSettingsStore wiring ---

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
  const showBack = (!isSign && !isRootHome) || isDesktopSettingsOpen;
  const showCall = isLanguageTree && browsePath[0] === "Language" && browsePath.length >= 2 && !inLesson;
  const isRtl = uiLang === "ar";

  const customBtnSize = { width: "40px", height: "40px" };

  // --- Dynamic Adjective/Vocabulary Route Validator ---
  const showRecallButton = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const isUnderAdjectiveVocab =
      segments[0]?.toLowerCase() === "language" &&
      segments[2]?.toLowerCase() === "dictionary" &&
      segments[3]?.toLowerCase() === "vocabulary" &&
      segments[4]?.toLowerCase() === "adjective";

    return isUnderAdjectiveVocab && segments.length >= 6;
  }, [location.pathname]);

  // --- Strict Subcategory "AddWord" & "Select" Validator ---
  const showSubcategoryControls = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    return (
      segments[0]?.toLowerCase() === "language" &&
      segments[2]?.toLowerCase() === "dictionary" &&
      segments[3]?.toLowerCase() === "vocabulary" &&
      segments.length === 6
    );
  }, [location.pathname]);

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
    if (isMobileSettingsOpen && settingsSearchActive) {
      mobileSettingsStore.exitSearchMode();
      return;
    }
    if (isMobileSettingsOpen) {
      mobileSettingsStore.goBack();
      return;
    }
    if (isDesktopSettingsOpen) {
      setSettingsSidebarOpen(false);
      return;
    }
    if (searchOpen) { setSearchOpen(false); return; }
    if (isRecall) { restoreFromRecall(); navigate("/"); return; }
    if (isSettings) { navigate("/"); return; }
    navigate(-1);
  }, [
    searchOpen,
    isRecall,
    isSettings,
    navigate,
    restoreFromRecall,
    isMobileSettingsOpen,
    settingsSearchActive,
    isDesktopSettingsOpen,
    setSettingsSidebarOpen,
  ]);

  if (isMobileSettingsOpen) {
    return (
      <header
        ref={headerRef}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 bg-transparent isolate select-none px-4 md:px-6 py-2 flex flex-row items-center h-16 gap-x-2",
          isVisible ? "translate-y-0" : "-translate-y-full"
        )}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="flex items-center h-[40px] w-full gap-2">
          {settingsSearchActive ? (
            <>
              <Button size="icon" onClick={exitSettingsSearch} aria-label={t("Back") || "Back"} className="shrink-0 p-0" style={customBtnSize}>
                <ArrowLeft className={cn("h-5 w-5", isRtl && "rotate-180")} />
              </Button>
              <div className="flex-1 min-w-0">
                <Input
                  ref={settingsSearchInputRef}
                  placeholder="Search settings"
                  value={settingsSearchValue}
                  onChange={(e) => handleSettingsSearchChange(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <Button size="icon" onClick={handleBack} aria-label={mSettings.showBack ? (t("Back") || "Back") : (t("Close") || "Close")} className="shrink-0 p-0" style={customBtnSize}>
                {mSettings.showBack ? (
                  <ArrowLeft className={cn("h-5 w-5", isRtl && "rotate-180")} />
                ) : (
                  <X className="h-5 w-5" />
                )}
              </Button>
              <TitleBar className="font-semibold text-lg truncate h-[40px] flex items-center leading-none">
                {mSettings.title}
              </TitleBar>
              <Button
                size="icon"
                aria-label={t("Search") || "Search"}
                onClick={() => {
                  mobileSettingsStore.enterSearchMode(() => {
                    setSettingsSearchValue("");
                  });
                }}
                className="ml-auto p-0 shrink-0"
                style={customBtnSize}
              >
                <Search className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </header>
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

        {/* Inline Select & Recall Buttons (Row 1 inline sibling layout) */}
        {!isSplitLayout && showSubcategoryControls && (
          <div className="flex items-center gap-2 shrink-0 h-[40px]">
            <SelectButton />
            {showRecallButton && <RecallButton />}
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
          {/* Split Row 2 left: AR queue, Select Button, & Split-positioned RecallButton */}
          <div className="flex items-center shrink-0 h-[40px] gap-2">
            {isLanguageTree && recallQueue.length > 0 && <RecallQueueButton />}
            {isSplitLayout && showSubcategoryControls && (
              <>
                <SelectButton />
                {showRecallButton && <RecallButton />}
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