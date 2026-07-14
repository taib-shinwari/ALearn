import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Minus } from "lucide-react";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useApp } from "@/Context/App";
import { NavigatorLayout } from "@/Component/Layout/Utility";
import { Button } from "@/Component/UI/Button"; 
import { Container } from "@/Component/UI/container";
import { SlidingPill } from "@/Component/UI/Sliding-Pill";

type ModeType = "add" | "delete";

export function Add() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useCourseLanguage();
  const { 
    setLearningLanguage, 
    removeCourse, 
    inactiveLanguages = [], 
    activeLanguages = [] 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState<ModeType>("add");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (inactiveLanguages.length > 0) {
        setMode("add");
      } else if (activeLanguages.length > 0) {
        setMode("delete");
      }
    }
  }, [isOpen, inactiveLanguages.length, activeLanguages.length]);

  if (!location.pathname.toLowerCase().startsWith("/language")) {
    return null;
  }

  const hasActive = activeLanguages.length > 0;
  const hasInactive = inactiveLanguages.length > 0;
  const currentList = mode === "add" ? inactiveLanguages : activeLanguages;

  const filteredLanguages = currentList.filter((lang) =>
    !searchQuery || lang.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handlePick = (name: string) => {
    setIsOpen(false);
    setIsSearching(false);
    setSearchQuery("");

    if (mode === "add") {
      setLearningLanguage(name);
      navigate(`/Language/${name}`);
    } else {
      removeCourse(name);
      navigate("/Language");
    }
  };

  const pillOptions = [
    { value: "add" as ModeType, label: "", icon: <Plus className="h-4 w-4 stroke-[2.5]" /> },
    { value: "delete" as ModeType, label: "", icon: <Minus className="h-4 w-4 stroke-[2.5]" /> }
  ];

  const renderHeader = () => {
    // Shared container styling that aligns directly with the layout size of your SlidingPill
    const containerClasses = "flex items-center justify-center h-7 w-9 rounded-full bg-muted border border-border/40 text-muted-foreground/80 !py-0 !px-0";

    if (!hasActive) {
      return (
        <Container className={containerClasses}>
          <Plus className="h-4 w-4 stroke-[2.5]" />
        </Container>
      );
    }
    if (!hasInactive) {
      return (
        <Container className={containerClasses}>
          <Minus className="h-4 w-4 stroke-[2.5]" />
        </Container>
      );
    }
    return (
      <SlidingPill
        options={pillOptions}
        selectedValue={mode}
        onChange={setMode}
        width="w-20"
        height="h-7"
      />
    );
  };

  const renderTriggerIcon = () => {
    if (!hasInactive) {
      return <Minus className="h-5 w-5" />;
    }
    return <Plus className="h-5 w-5" />;
  };

  return (
    <NavigatorLayout
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      isSearching={isSearching}
      setIsSearching={setIsSearching}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      inputRef={inputRef}
      buttonLabel="" 
      renderMobileHeaderLeft={renderHeader}
      renderDesktopHeaderLeft={renderHeader}
      showGoBack={false}
      disableHeaderContainer={true}
      customTrigger={renderTriggerIcon()}

    >
      <div className="flex flex-col gap-1.5 px-3 pt-2 sm:p-2 w-full relative">
        {filteredLanguages.map((lang) => (
          <Button
            key={lang}
            type="button"
            variant={mode === "add" ? "default" : "destructive"}
            className="justify-between text-left w-full h-9 px-4 rounded-full text-sm font-medium transition-colors"
            onClick={() => handlePick(lang)}
          >
            <span>{lang}</span>
            {mode === "add" && lang.toLowerCase() === "pashto" && (
              <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-background border border-border text-muted-foreground">
                Preview
              </span>
            )}
          </Button>
        ))}

        {filteredLanguages.length === 0 && (
          <p className="text-xs text-muted-foreground p-6 text-center">
            {mode === "add" 
              ? (t("noInactive") || "No remaining tracks to add.") 
              : (t("noActive") || "No active courses found.")}
          </p>
        )}
      </div>
    </NavigatorLayout>
  );
}