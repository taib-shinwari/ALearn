import { ReactNode } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Search, Play } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { categories, localizedName } from "@/data/courseData";

const langLabels: Record<string, string> = {
  nl: "Nederlands",
  en: "English",
  ar: "العربية",
};

interface LayoutProps {
  children: ReactNode;
}

/**
 * Global layout wrapping pages that share the top bar.
 * Hidden entirely on /settings and during practice/exercise flows.
 */
export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { learningLanguage, selectedConcept, setPracticeScope } = useApp();
  const { uiLang, t } = useCourseLanguage();

  // Hide top bar entirely on settings page
  const isSettings = location.pathname.startsWith("/settings");
  const isCourses = location.pathname.startsWith("/courses");

  // Path: /:concept/:category/:subcategory/:word OR /home
  const rawSegments = location.pathname.split("/").filter(Boolean);
  const isHome = rawSegments.length === 0 || rawSegments[0] === "home";
  // Strip the concept prefix for breadcrumb building
  const contentSegs = !isHome && rawSegments[0] === selectedConcept
    ? rawSegments.slice(1)
    : (isHome ? [] : rawSegments);

  const conceptPrefix = selectedConcept ? `/${selectedConcept}` : "/home";

  // Build breadcrumbs (root + category + subcategory + word)
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
    if (isHome) return;
    if (contentSegs.length <= 1) navigate(conceptPrefix);
    else navigate(conceptPrefix + "/" + contentSegs.slice(0, -1).join("/"));
  };

  // Practice scope inferred from URL (segments without concept prefix)
  const handlePractice = () => {
    if (contentSegs.length === 0) {
      setPracticeScope({ type: "global" });
    } else if (contentSegs.length === 1) {
      setPracticeScope({ type: "category", id: contentSegs[0] });
    } else if (contentSegs.length === 2) {
      setPracticeScope({ type: "subcategory", id: contentSegs[1] });
    } else {
      setPracticeScope({ type: "word", id: contentSegs[2] });
    }
    navigate("/practice");
  };

  if (isSettings) {
    return <div className="min-h-screen pb-8">{children}</div>;
  }

  // Courses page: only show top bar (no practice button, no breadcrumbs)
  return (
    <div className="min-h-screen pb-8" dir={uiLang === "ar" ? "rtl" : "ltr"}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <Button size="icon" onClick={handleBack} aria-label={t("back")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Button onClick={() => navigate("/courses")} className="truncate">
            {(learningLanguage && langLabels[learningLanguage]) || t("courses")} ›
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" aria-label={t("search")} onClick={() => { /* search not implemented */ }}>
            <Search className="h-5 w-5" />
          </Button>
          <Button size="icon" aria-label={t("settings")} onClick={() => navigate("/settings")}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {!isCourses && (
        <>
          {/* Practice button */}
          <div className="px-6">
            <Button onClick={handlePractice} fullWidth className="gap-2">
              <Play className="h-4 w-4" /> {t("practice")}
            </Button>
          </div>

          {/* Breadcrumbs */}
          <nav aria-label="breadcrumb" className="px-6 mt-3 mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-black">
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
          </nav>
        </>
      )}

      <div>{children}</div>
    </div>
  );
}
