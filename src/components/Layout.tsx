import { ReactNode } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Search, Play } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { categories } from "@/data/courseData";

const langLabels: Record<string, string> = {
  nl: "Nederlands",
  en: "English",
};

interface LayoutProps {
  children: ReactNode;
}

/**
 * Global layout wrapping all pages except the practice/exercise flow.
 * Provides:
 *  - Top bar (course name, settings, search, back when navigated)
 *  - Practice button
 *  - Breadcrumbs row (left aligned, below practice button)
 */
export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { learningLanguage, setPracticeScope } = useApp();
  const { uiLang, t } = useCourseLanguage();

  // Decode segments (skip "home")
  const rawSegments = location.pathname.split("/").filter(Boolean);
  const segments = rawSegments[0] === "home" ? [] : rawSegments;

  // Build breadcrumb items based on slugs in the URL
  const crumbs: { label: string; to: string }[] = [{ label: t("root"), to: "/home" }];
  if (segments.length >= 1) {
    const cat = categories.find(c => c.id === segments[0]);
    if (cat) crumbs.push({ label: cat.name[uiLang], to: `/${cat.id}` });
  }
  if (segments.length >= 2) {
    const cat = categories.find(c => c.id === segments[0]);
    const sub = cat?.subcategories.find(s => s.id === segments[1]);
    if (cat && sub) crumbs.push({ label: sub.name[uiLang], to: `/${cat.id}/${sub.id}` });
  }
  if (segments.length >= 3) {
    const cat = categories.find(c => c.id === segments[0]);
    const sub = cat?.subcategories.find(s => s.id === segments[1]);
    const word = sub?.words.find(w => w.id === segments[2]);
    if (word) crumbs.push({ label: word[uiLang].word, to: `/${segments[0]}/${segments[1]}/${segments[2]}` });
  }

  const showBack = segments.length > 0;

  const handleBack = () => {
    if (segments.length === 0) return;
    if (segments.length === 1) navigate("/home");
    else navigate("/" + segments.slice(0, -1).join("/"));
  };

  // Practice scope inferred from URL
  const handlePractice = () => {
    if (segments.length === 0) {
      setPracticeScope({ type: "global" });
    } else if (segments.length === 1) {
      setPracticeScope({ type: "category", id: segments[0] });
    } else if (segments.length === 2) {
      setPracticeScope({ type: "subcategory", id: segments[1] });
    } else {
      setPracticeScope({ type: "word", id: segments[2] });
    }
    navigate("/practice");
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label={t("back")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Button onClick={() => navigate("/courses")} className="truncate">
            {(learningLanguage && langLabels[learningLanguage]) || t("courses")} ›
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label={t("search")} onClick={() => { /* search not implemented yet */ }}>
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t("settings")} onClick={() => navigate("/settings")}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Practice button */}
      <div className="px-6">
        <Button onClick={handlePractice} fullWidth className="gap-2">
          <Play className="h-4 w-4" /> {t("practice")}
        </Button>
      </div>

      {/* Breadcrumbs (below practice button, left aligned) */}
      <nav aria-label="breadcrumb" className="px-6 mt-3 mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <li key={c.to} className="flex items-center gap-1">
                {isLast ? (
                  <span className="font-medium text-foreground">{c.label}</span>
                ) : (
                  <Link to={c.to} className="hover:text-foreground transition-colors">{c.label}</Link>
                )}
                {!isLast && <span className="px-1">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}
