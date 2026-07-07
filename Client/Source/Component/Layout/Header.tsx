import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/Component/UI/button";
import { TitleBar } from "@/Component/UI/title-bar";
import { ArrowLeft, Settings, Search, LogIn } from "lucide-react";
import { useApp } from "@/Context/App";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { HeaderSearch } from "@/Component/Search/HeaderSearch";
import { RecallQueueButton } from "@/Component/RecallQueueButton";
import { AICallButton } from "@/Component/AICallButton";
import { useTopDialog } from "@/Library/dialog-stack";
import { useChessSettings } from "@/Library/chessSettings";
import type { LessonProgressState } from "@/Library/lessonProgress";

interface HeaderProps {
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  lessonState: LessonProgressState;
}

export function Header({ searchOpen, setSearchOpen, lessonState }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { uiLang, t } = useCourseLanguage();
  const {
    browsePath, popBrowse,
    isAuthenticated,
    recallReturnPath, setRecallReturnPath, setBrowsePath,
  } = useApp();

  const lowerPath = location.pathname.toLowerCase();
  const isSettings = lowerPath.startsWith("/settings");
  const isRecall = lowerPath.startsWith("/recall");
  const isSign = lowerPath.startsWith("/sign");
  const isHomeRoute = location.pathname === "/" || lowerPath.startsWith("/language") || lowerPath.startsWith("/chess");

  const topDialog = useTopDialog();
  const [chessSettings] = useChessSettings();
  const inChess = isHomeRoute && browsePath[0] === "chess";
  const focusMode = inChess && chessSettings.focusMode;

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

  if (focusMode) return null;

  return (
    <div className="flex items-center justify-between gap-2 p-4">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {showBack && (
          <Button size="icon" onClick={handleBack} aria-label={t("back") || "Back"}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        {inLesson && lessonState && (
          <div
            className="flex-1 h-3 bg-muted rounded-full overflow-hidden mx-2 border border-border"
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
            <Button size="icon" aria-label="Sign in" onClick={() => navigate("/Sign")}>
              <LogIn className="h-5 w-5" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}