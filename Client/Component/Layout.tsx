import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "Client/Component/UI/button";
import { TitleBar } from "Client/Component/UI/title-bar";
import { ArrowLeft, Settings, Search, LogIn } from "lucide-react";
import { useApp } from "Client/Context/App";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { HeaderSearch } from "Client/Component/Search/HeaderSearch";
import { useIsMobile } from "Client/Hook/use-mobile";
import { settingsStore } from "Client/Component/Settings/store";
import { SettingsMobileBar } from "Client/Component/Settings/SettingsMobileBar";
import { RecallQueueButton } from "Client/Component/RecallQueueButton";
import { AICallButton } from "Client/Component/AICallButton";
import { useTopDialog } from "Client/Library/dialog-stack";
import { useChessSettings } from "Client/Library/chessSettings";
import { lessonProgress, type LessonProgressState } from "Client/Library/lessonProgress";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { uiLang, t } = useCourseLanguage();
  const {
    browsePath, popBrowse, resetBrowse, setBrowsePath,
    isAuthenticated,
    recallReturnPath, setRecallReturnPath,
  } = useApp();

  const lowerPath = location.pathname.toLowerCase();
  const isSettings = lowerPath.startsWith("/settings");
  const isRecall = lowerPath.startsWith("/recall");
  const isSign = lowerPath.startsWith("/sign");
  const isHomeRoute = location.pathname === "/" || lowerPath.startsWith("/language") || lowerPath.startsWith("/chess");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const [settingsBar, setSettingsBar] = useState(settingsStore.getState());
  useEffect(() => {
    const unsub = settingsStore.subscribe(() => setSettingsBar(settingsStore.getState()));
    return () => { unsub(); };
  }, []);

  const useSettingsBar = isMobile && isSettings && settingsBar.active;

  const topDialog = useTopDialog();
  const [chessSettings] = useChessSettings();
  const inChess = isHomeRoute && browsePath[0] === "chess";
  const focusMode = inChess && chessSettings.focusMode;

  const [lessonState, setLessonState] = useState<LessonProgressState>(lessonProgress.get());
  useEffect(() => lessonProgress.subscribe(() => setLessonState(lessonProgress.get())), []);
  const inLesson = !!lessonState;

  const showBack = !isSign && (!!topDialog || !isHomeRoute || browsePath.length > 0);
  const showCall = isHomeRoute && browsePath[0] === "language" && browsePath.length >= 2 && !inLesson;

  const restoreFromRecall = () => {
    if (recallReturnPath) {
      setBrowsePath(recallReturnPath);
      setRecallReturnPath(null);
    }
  };

  const handleBack = () => {
    if (topDialog) { topDialog.close(); return; }
    if (isRecall) { restoreFromRecall(); navigate("/"); return; }
    if (isSettings) { navigate("/"); return; }
    if (browsePath.length > 0) popBrowse();
  };

  if (useSettingsBar) {
    return (
      <SettingsMobileBar
        settingsBar={settingsBar}
        conceptPrefix="/"
        navigate={navigate}
        t={t}
        uiLang={uiLang}
      >
        {children}
      </SettingsMobileBar>
    );
  }

  return (
    <div className="min-h-screen pb-8" dir={uiLang === "ar" ? "rtl" : "ltr"}>
      {!focusMode && (
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showBack && (
            <Button size="icon" onClick={handleBack} aria-label={t("back") || "Back"}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {inLesson && lessonState && (
            <div
              className="flex-1 h-3 bg-muted rounded-full overflow-hidden mx-2 min-w-[200px] max-w-[640px] border border-border"
              aria-label="Lesson progress"
            >
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${(lessonState.current / Math.max(1, lessonState.total)) * 100}%` }}
              />
            </div>
          )}
          {!inLesson && !searchOpen && topDialog?.title && (
            <TitleBar className="font-semibold">{topDialog.title}</TitleBar>
          )}
          {!inLesson && !searchOpen && !topDialog && isSettings && (
            <TitleBar className="font-semibold">{t("settings") || "Settings"}</TitleBar>
          )}
          {!inLesson && !searchOpen && !topDialog && isRecall && (
            <TitleBar className="font-semibold">{t("recall") || "Recall"}</TitleBar>
          )}
          {!inLesson && !searchOpen && !topDialog && isSign && (
            <TitleBar className="font-semibold">Sign</TitleBar>
          )}
        </div>

        {!inLesson && (searchOpen ? (
          <HeaderSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
        ) : (
          <div className="flex items-center gap-2">
            {showCall && <AICallButton />}
            <RecallQueueButton />
            <Button size="icon" aria-label={t("search") || "Search"} onClick={() => setSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>
            <Button size="icon" aria-label={t("settings") || "Settings"} onClick={() => navigate("/Settings")}>
              <Settings className="h-5 w-5" />
            </Button>
            {!isAuthenticated && !isSign && (
              <Button
                size="icon"
                aria-label="Sign in"
                onClick={() => navigate("/Sign")}
              >
                <LogIn className="h-5 w-5" />
              </Button>
            )}
          </div>
        ))}
      </div>
      )}

      <div>{children}</div>
    </div>
  );
}