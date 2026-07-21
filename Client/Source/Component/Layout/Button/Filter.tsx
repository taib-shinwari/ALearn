// @/Component/Header/Filter.tsx
import { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Filter, Star, Bookmark, Settings, Eye } from "lucide-react";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useApp } from "@/Context/App";
import { NavigatorLayout } from "@/Component/Layout/Utility";
import { Button } from "@/Component/UI/Button"; 
import { Container } from "@/Component/UI/container";

type FilterType = "all" | "marked" | "favorites" | "custom";

export function FilterButton() {
  const location = useLocation();
  const { t } = useCourseLanguage();
  const { filter = "all", setFilter } = useApp(); // Reads active state from global context

  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Guard: Only show filter dropdown inside /Language routes
  if (!location.pathname.toLowerCase().startsWith("/language")) {
    return null;
  }

  const filterOptions = [
    { value: "all" as FilterType, label: "All Words", icon: <Eye className="h-4 w-4" /> },
    { value: "marked" as FilterType, label: "Marked Items", icon: <Bookmark className="h-4 w-4" /> },
    { value: "favorites" as FilterType, label: "Favorites", icon: <Star className="h-4 w-4" /> },
    { value: "custom" as FilterType, label: "My Custom Words", icon: <Settings className="h-4 w-4" /> },
  ];

  const handlePickFilter = (selectedVal: FilterType) => {
    if (typeof setFilter === "function") {
      setFilter(selectedVal); // Updates global app state
    } else {
      console.warn("setFilter is not a function in AppContext! Check your AppProvider setup.");
    }
    setIsOpen(false); // Closes the dropdown upon click
  };

  const renderHeader = () => {
    return (
      <Container className="flex items-center justify-center h-7 w-9 rounded-full bg-muted border border-border/40 text-muted-foreground/80 !py-0 !px-0">
        <Filter className="h-4 w-4 stroke-[2.5]" />
      </Container>
    );
  };

  const renderTriggerIcon = () => {
    return <Filter className="h-5 w-5" />;
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
      closedIcon={renderTriggerIcon()} // Connects directly to the closed state custom icon slot
    >
      <div className="flex flex-col gap-1.5 px-3 pt-2 sm:p-2 w-full relative">
        {filterOptions.map((opt) => {
          const isActive = filter === opt.value; // Highlights based directly on global context
          return (
            <Button
              key={opt.value}
              type="button"
              variant={isActive ? "default" : "outline"}
              className="justify-start gap-3 text-left w-full h-9 px-4 rounded-full text-sm font-medium transition-colors border border-border/50"
              onClick={() => handlePickFilter(opt.value)}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </Button>
          );
        })}
      </div>
    </NavigatorLayout>
  );
}