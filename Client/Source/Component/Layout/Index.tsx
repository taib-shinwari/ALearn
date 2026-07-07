import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useIsMobile } from "@/Hook/use-mobile";
import { settingsStore } from "@/Component/Settings/store";
import { SettingsMobileBar } from "@/Component/Settings/SettingsMobileBar";
import { lessonProgress, type LessonProgressState } from "@/Library/lessonProgress";
import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { uiLang, t } = useCourseLanguage();

  const lowerPath = location.pathname.toLowerCase();
  const isSettings = lowerPath.startsWith("/settings");
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

  const [lessonState, setLessonState] = useState<LessonProgressState>(lessonProgress.get());
  useEffect(() => lessonProgress.subscribe(() => setLessonState(lessonProgress.get())), []);

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
      <Header searchOpen={searchOpen} setSearchOpen={setSearchOpen} lessonState={lessonState} />
      <div className="px-2 sm:px-4 pb-4">{children}</div>
    </div>
  );
}