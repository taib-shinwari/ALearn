// @/Component/Language/Add.tsx
import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useApp } from "@/Context/App";
import { NavigatorLayout } from "@/Component/Layout/Utility";
import { Button } from "@/Component/UI/button"; 

export function Add() {
  const navigate = useNavigate();
  const location = useLocation();
  const { uiLang } = useCourseLanguage();
  const { setLearningLanguage, inactiveLanguages } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!location.pathname.toLowerCase().startsWith("/language")) {
    return null;
  }

  const handlePick = (name: string) => {
    setLearningLanguage(name);
    setIsOpen(false);
    setIsSearching(false);
    setSearchQuery("");
    navigate(`/Language/${name}`);
  };

  const titleText = 
    uiLang === "nl" ? "Voeg taal toe:" : 
    uiLang === "ar" ? "اختر لغة إضافية:" : 
    "Add Language";

  // Filter using your contextual master list of current inactive options
  const filteredLanguages = inactiveLanguages.filter((lang) =>
    !searchQuery || lang.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const renderHeaderLeft = () => (
    <span className="text-xs font-medium text-muted-foreground px-1">
      {titleText}
    </span>
  );

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
      renderMobileHeaderLeft={renderHeaderLeft}
      renderDesktopHeaderLeft={renderHeaderLeft}
      showGoBack={false}
      customTrigger={<Plus className="h-5 w-5" />}
    >
      <div className="flex flex-col gap-1.5 px-3 pt-2 sm:p-2 w-full relative">
        {filteredLanguages.map((lang) => (
          <Button
            key={lang}
            type="button"
            variant="default"
            className="justify-between text-left w-full"
            onClick={() => handlePick(lang)}
          >
            <span>{lang}</span>
            {/* If Pashto acts as a specialized placeholder track, we render a preview chip */}
            {lang.toLowerCase() === "pashto" && (
              <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-background border border-border text-muted-foreground">
                Preview
              </span>
            )}
          </Button>
        ))}

        {filteredLanguages.length === 0 && (
          <p className="text-xs text-muted-foreground p-4 text-center">
            No items found match query
          </p>
        )}
      </div>
    </NavigatorLayout>
  );
}