import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TitleBar } from "@/components/ui/title-bar";
import { ArrowLeft, Settings, Search, LogIn } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { categories, localizedName } from "@/data/courseData";
import { HeaderSearch } from "@/components/search/HeaderSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { settingsStore } from "@/components/settings/store";
import { SettingsMobileBar } from "@/components/settings/SettingsMobileBar";
import { RecallQueueButton } from "@/components/RecallQueueButton";
import { AICallButton } from "@/components/AICallButton";
import { ALPHABET_SEGMENT } from "@/lib/navigation";
import { useTopDialog } from "@/lib/dialog-stack";
import { useChessSettings } from "@/lib/chessSettings";

const langLabels: Record<string, string> = {
  nl: "Nederlands",
  en: "English",
  ar: "العربية",
};

import { chessLevels, cName } from "@/data/chessData";


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


  const isSettings = location.pathname.startsWith("/settings");
  const isRecall = location.pathname.startsWith("/recall");
  const isSign = location.pathname.startsWith("/sign");
  const isHomeRoute = location.pathname === "/";
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

  const crumbs: { label: string; idx: number }[] = [];
  if (isHomeRoute && browsePath.length > 0 && browsePath[0] === "language") {
    crumbs.push({ label: t("language") || "Language", idx: 0 });
    if (browsePath.length >= 2) {
      const lang = browsePath[1];
      crumbs.push({ label: langLabels[lang] || lang, idx: 1 });
    }
    if (browsePath.length >= 3) {
      const seg = browsePath[2];
      if (seg === ALPHABET_SEGMENT) {
        crumbs.push({ label: uiLang === "nl" ? "Alfabet" : uiLang === "ar" ? "الحروف" : "Alphabet", idx: 2 });
      } else if (seg === "lessons") {
        crumbs.push({ label: uiLang === "nl" ? "Lessen" : uiLang === "ar" ? "دروس" : "Lessons", idx: 2 });
        if (browsePath.length >= 4) {
          // section
          const secLabels: Record<string, string> = { "sec-0": "Beginner", "sec-1": "Intermediate", "sec-2": "Advanced" };
          crumbs.push({ label: secLabels[browsePath[3]] || browsePath[3], idx: 3 });
        }
        if (browsePath.length >= 5) {
          crumbs.push({ label: "Lesson", idx: 4 });
        }
      } else {
        const cat = categories.find(c => c.id === seg);
        if (cat) crumbs.push({ label: localizedName(cat.name, uiLang), idx: 2 });
      }
    }
    if (browsePath.length >= 4 && browsePath[2] !== "lessons" && browsePath[2] !== ALPHABET_SEGMENT) {
      const cat = categories.find(c => c.id === browsePath[2]);
      const sub = cat?.subcategories.find(s => s.id === browsePath[3]);
      if (cat && sub) crumbs.push({ label: localizedName(sub.name, uiLang), idx: 3 });
    }
    if (browsePath.length >= 5 && browsePath[2] !== "lessons" && browsePath[2] !== ALPHABET_SEGMENT) {
      const cat = categories.find(c => c.id === browsePath[2]);
      const sub = cat?.subcategories.find(s => s.id === browsePath[3]);
      const word = sub?.words.find(w => w.id === browsePath[4]);
      if (word) crumbs.push({ label: word[uiLang === "ar" ? "en" : uiLang].word, idx: 4 });
    }
  } else if (isHomeRoute && browsePath.length > 0 && browsePath[0] === "chess") {
    crumbs.push({ label: uiLang === "nl" ? "Schaken" : uiLang === "ar" ? "الشطرنج" : "Chess", idx: 0 });
    const chessSection: Record<string, string> = {
      lesson: uiLang === "nl" ? "Les" : uiLang === "ar" ? "درس" : "Lesson",
      puzzle: uiLang === "nl" ? "Puzzel" : uiLang === "ar" ? "لغز" : "Puzzle",
      play: uiLang === "nl" ? "Spelen" : uiLang === "ar" ? "العب" : "Play",
    };
    if (browsePath.length >= 2) {
      crumbs.push({ label: chessSection[browsePath[1]] || browsePath[1], idx: 1 });
    }
    if (browsePath[1] === "lesson") {
      const lvl = browsePath[2] ? chessLevels.find(l => l.id === browsePath[2]) : undefined;
      if (lvl) crumbs.push({ label: cName(lvl.name, uiLang), idx: 2 });
      const grp = lvl && browsePath[3] ? lvl.groups.find(g => g.id === browsePath[3]) : undefined;
      if (grp) crumbs.push({ label: cName(grp.name, uiLang), idx: 3 });
      const ls = grp && browsePath[4] ? grp.lessons.find(x => x.id === browsePath[4]) : undefined;
      if (ls) crumbs.push({ label: cName(ls.name, uiLang), idx: 4 });
    }
  }

  const topDialog = useTopDialog();
  const [chessSettings] = useChessSettings();
  const inChess = isHomeRoute && browsePath[0] === "chess";
  const focusMode = inChess && chessSettings.focusMode;

  const showBack = !isSign && (!!topDialog || !isHomeRoute || browsePath.length > 0);

  // When in a language folder, show Call in the header.
  const showCall = isHomeRoute && browsePath[0] === "language" && browsePath.length >= 2;

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

  const showCrumbs = isHomeRoute && browsePath.length > 0 && !searchOpen && !topDialog && !focusMode;

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
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <Button size="icon" onClick={handleBack} aria-label={t("back")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {!searchOpen && topDialog?.title && (
            <TitleBar className="font-semibold">{topDialog.title}</TitleBar>
          )}
          {!searchOpen && !topDialog && isSettings && (
            <TitleBar className="font-semibold">{t("settings") || "Settings"}</TitleBar>
          )}
          {!searchOpen && !topDialog && isRecall && (
            <TitleBar className="font-semibold">{t("recall") || "Recall"}</TitleBar>
          )}
          {!searchOpen && !topDialog && isSign && (
            <TitleBar className="font-semibold">Sign</TitleBar>
          )}
        </div>

        {searchOpen ? (
          <HeaderSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
        ) : (
          <div className="flex items-center gap-2">
            {showCall && <AICallButton />}
            <RecallQueueButton />
            <Button size="icon" aria-label={t("search")} onClick={() => setSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>
            <Button size="icon" aria-label={t("settings")} onClick={() => navigate("/settings")}>
              <Settings className="h-5 w-5" />
            </Button>
            {!isAuthenticated && !isSign && (
              <Button
                size="icon"
                aria-label="Sign in"
                onClick={() => navigate("/sign")}
              >
                <LogIn className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}
      </div>
      )}

      {showCrumbs && (
        <nav aria-label="breadcrumb" className="px-4 mt-1 mb-4">
          <TitleBar>
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <button onClick={() => resetBrowse()} className="hover:underline">
                  {t("root") || "Home"}
                </button>
                <span className="px-1">&gt;</span>
              </li>
              {crumbs.map((c, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                  <li key={c.idx} className="flex items-center gap-1">
                    {isLast ? (
                      <span className="font-medium">{c.label}</span>
                    ) : (
                      <button
                        onClick={() => setBrowsePath(browsePath.slice(0, c.idx + 1))}
                        className="hover:underline"
                      >
                        {c.label}
                      </button>
                    )}
                    {!isLast && <span className="px-1">&gt;</span>}
                  </li>
                );
              })}
            </ol>
          </TitleBar>
        </nav>
      )}

      <div>{children}</div>
    </div>
  );
}
