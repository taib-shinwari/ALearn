import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TitleBar } from "@/components/ui/title-bar";
import { ArrowLeft, Settings, Search, Play, ChevronDown } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { categories, localizedName } from "@/data/courseData";
import { HeaderSearch } from "@/components/search/HeaderSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { settingsStore } from "@/components/settings/store";
import { SettingsMobileBar } from "@/components/settings/SettingsMobileBar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const langLabels: Record<string, string> = {
  nl: "Nederlands",
  en: "English",
  ar: "العربية",
};

interface LayoutProps {
  children: ReactNode;
}

function LanguagesDropdown() {
  const navigate = useNavigate();
  const { courses, learningLanguage, setActiveCourse } = useApp();
  const { t } = useCourseLanguage();
  const label =
    (learningLanguage && langLabels[learningLanguage]) || t("language");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="truncate gap-1">
          {label}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        {courses.length === 0 ? (
          <DropdownMenuItem disabled>{t("noCourses")}</DropdownMenuItem>
        ) : (
          courses.map((c, i) => {
            const active = c.toLang === learningLanguage;
            return (
              <DropdownMenuItem
                key={i}
                onSelect={() => {
                  setActiveCourse(c);
                  navigate("/language");
                }}
                className={active ? "font-semibold" : ""}
              >
                {(langLabels[c.toLang] || c.toLang)}
                {active && " ✓"}
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/languages")}>
          {t("manageCourses")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { setPracticeScope } = useApp();
  const { uiLang, t } = useCourseLanguage();

  const isSettings = location.pathname.startsWith("/settings");
  const isCourses = location.pathname.startsWith("/languages") || location.pathname.startsWith("/courses");
  const isSearch = location.pathname.startsWith("/search");
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

  const rawSegments = location.pathname.split("/").filter(Boolean);
  const isHome =
    rawSegments.length === 0 ||
    rawSegments[0] === "home" ||
    (rawSegments.length === 1 && rawSegments[0] === "language");
  const contentSegs = !isHome && rawSegments[0] === "language"
    ? rawSegments.slice(1)
    : (isHome ? [] : rawSegments);

  const conceptPrefix = "/language";

  const crumbs: { label: string; to: string }[] = [{ label: t("root"), to: conceptPrefix }];
  if (contentSegs.length >= 1) {
    const cat = categories.find(c => c.id === contentSegs[0]);
    if (cat) crumbs.push({ label: localizedName(cat.name, uiLang), to: `${conceptPrefix}/${cat.id}` });
  }
  if (contentSegs.length >= 2) {
    const cat = categories.find(c => c.id === contentSegs[0]);
    const sub = cat?.subcategories.find(s => s.id === contentSegs[1]);
    if (cat && sub) crumbs.push({ label: localizedName(sub.name, uiLang), to: `${conceptPrefix}/${cat.id}/${sub.id}` });
  }
  if (contentSegs.length >= 3) {
    const cat = categories.find(c => c.id === contentSegs[0]);
    const sub = cat?.subcategories.find(s => s.id === contentSegs[1]);
    const word = sub?.words.find(w => w.id === contentSegs[2]);
    if (word) crumbs.push({ label: word[uiLang === "ar" ? "en" : uiLang].word, to: location.pathname });
  }

  const showBack = !isHome;

  const handleBack = () => {
    if (isSettings || isCourses) { navigate(conceptPrefix); return; }
    if (isHome) return;
    if (contentSegs.length <= 1) navigate(conceptPrefix);
    else navigate(conceptPrefix + "/" + contentSegs.slice(0, -1).join("/"));
  };

  const handlePractice = () => {
    if (contentSegs.length === 0) setPracticeScope({ type: "global" });
    else if (contentSegs.length === 1) setPracticeScope({ type: "category", id: contentSegs[0] });
    else if (contentSegs.length === 2) setPracticeScope({ type: "subcategory", id: contentSegs[1] });
    else setPracticeScope({ type: "word", id: contentSegs[2] });
    navigate("/practice");
  };

  const showPracticeAndCrumbs = !isSettings && !isCourses && !isSearch && !isHome;

  if (useSettingsBar) {
    return (
      <SettingsMobileBar
        settingsBar={settingsBar}
        conceptPrefix={conceptPrefix}
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
          {!searchOpen && isSearch && (
            <TitleBar className="font-semibold">{t("search")}</TitleBar>
          )}
          {!searchOpen && isCourses && (
            <TitleBar className="font-semibold">{t("yourCourses")}</TitleBar>
          )}
          {!searchOpen && !isSearch && !isCourses && (
            <LanguagesDropdown />
          )}
        </div>

        {searchOpen ? (
          <HeaderSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
        ) : (
          <div className="flex items-center gap-2">
            <Button size="icon" aria-label={t("search")} onClick={() => setSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>
            <Button size="icon" aria-label={t("settings")} onClick={() => navigate("/settings")}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {showPracticeAndCrumbs && (
        <>
          <div className="px-6 flex items-center gap-2">
            <Button onClick={handlePractice} fullWidth className="gap-2">
              <Play className="h-4 w-4" /> {t("practice")}
            </Button>
          </div>

          <nav aria-label="breadcrumb" className="px-6 mt-3 mb-4">
            <TitleBar>
              <ol className="flex flex-wrap items-center gap-1">
                {crumbs.map((c, i) => {
                  const isLast = i === crumbs.length - 1;
                  return (
                    <li key={c.to + i} className="flex items-center gap-1">
                      {isLast ? (
                        <span className="font-medium">{c.label}</span>
                      ) : (
                        <Link to={c.to} className="hover:underline">{c.label}</Link>
                      )}
                      {!isLast && <span className="px-1">/</span>}
                    </li>
                  );
                })}
              </ol>
            </TitleBar>
          </nav>
        </>
      )}

      <div>{children}</div>
    </div>
  );
}
