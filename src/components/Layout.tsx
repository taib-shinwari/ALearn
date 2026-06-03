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

const langLabels: Record<string, string> = {
  nl: "Nederlands",
  en: "English",
  ar: "العربية",
};

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
  if (isHomeRoute && browsePath.length > 0) {
    crumbs.push({ label: t("language") || "Language", idx: 0 });
    if (browsePath.length >= 2) {
      const lang = browsePath[1];
      crumbs.push({ label: langLabels[lang] || lang, idx: 1 });
    }
    if (browsePath.length >= 3) {
      const seg = browsePath[2];
      if (seg === ALPHABET_SEGMENT) {
        crumbs.push({ label: uiLang === "nl" ? "Alfabet" : uiLang === "ar" ? "الحروف" : "Alphabet", idx: 2 });
      } else {
        const cat = categories.find(c => c.id === seg);
        if (cat) crumbs.push({ label: localizedName(cat.name, uiLang), idx: 2 });
      }
    }
    if (browsePath.length >= 4) {
      const cat = categories.find(c => c.id === browsePath[2]);
      const sub = cat?.subcategories.find(s => s.id === browsePath[3]);
      if (cat && sub) crumbs.push({ label: localizedName(sub.name, uiLang), idx: 3 });
    }
    if (browsePath.length >= 5) {
      const cat = categories.find(c => c.id === browsePath[2]);
      const sub = cat?.subcategories.find(s => s.id === browsePath[3]);
      const word = sub?.words.find(w => w.id === browsePath[4]);
      if (word) crumbs.push({ label: word[uiLang === "ar" ? "en" : uiLang].word, idx: 4 });
    }
  }

  const showBack = !isHomeRoute || browsePath.length > 0;

  // When in a language folder, show Call in the header.
  const showCall = isHomeRoute && browsePath[0] === "language" && browsePath.length >= 2;

  const restoreFromRecall = () => {
    if (recallReturnPath) {
      setBrowsePath(recallReturnPath);
      setRecallReturnPath(null);
    }
  };

  const handleBack = () => {
    if (isRecall) { restoreFromRecall(); navigate("/"); return; }
    if (isSettings) { navigate("/"); return; }
    if (browsePath.length > 0) popBrowse();
  };

  const showCrumbs = isHomeRoute && browsePath.length > 0 && !searchOpen;

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
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <Button size="icon" onClick={handleBack} aria-label={t("back")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {!searchOpen && isSettings && (
            <TitleBar className="font-semibold">{t("settings") || "Settings"}</TitleBar>
          )}
          {!searchOpen && isRecall && (
            <TitleBar className="font-semibold">{t("recall") || "Recall"}</TitleBar>
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
            {!isAuthenticated && (
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
