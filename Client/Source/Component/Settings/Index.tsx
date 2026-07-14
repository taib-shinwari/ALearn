// @/Component/Settings/SettingsSidebar.tsx
import { useState } from "react";
import { useApp } from "@/Context/App";
import { useIsMobile } from "@/Hook/Use-Mobile";
import { Desktop } from "./Layout/Desktop";
import { Mobile } from "./Layout/Mobile"; 
import { ProfileSection } from "./Section/ProfileSection";
import { LanguageSection } from "./Section/LanguageSection";
import { ChessSection } from "./Section/ChessSection"; 
import { ThemeSection } from "./Section/ThemeSection";
import { AccessibilitySection } from "./Section/AccessibilitySection";
import type { SettingsCategoryId } from "./types";

export function SettingsSidebar() {
  const { isSettingsSidebarOpen, setSettingsSidebarOpen } = useApp();
  const isMobile = useIsMobile();

  const [activeCategory, setActiveCategory] = useState<SettingsCategoryId>("profile");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>("account");

  const handleClose = () => {
    setSettingsSidebarOpen(false);
    setActiveCategory("profile");
    setActiveSubcategory("account");
  };

  const handleCategoryChange = (category: SettingsCategoryId) => {
    setActiveCategory(category);
    if (category === "profile") {
      setActiveSubcategory("account");
    } else {
      setActiveSubcategory(null);
    }
  };

  const handleSubcategoryChange = (subcategory: string | null) => {
    setActiveSubcategory(subcategory);
  };

  const renderContent = () => {
    switch (activeCategory) {
      case "profile":
        return (
          <ProfileSection 
            activeSubcategory={activeSubcategory || "account"} 
          />
        );
      case "language":
        return <LanguageSection onSelect={() => {}} />;
      case "chess":
        return <ChessSection />;
      case "theme":
        return <ThemeSection />;
      case "accessibility":
        return <AccessibilitySection />;
      default:
        return null;
    }
  };

  if (!isSettingsSidebarOpen) return null;

  if (isMobile) {
    return (
      <Mobile
        activeCategory={activeCategory}
        activeSubcategory={activeSubcategory}
        onCategoryChange={handleCategoryChange}
        onSubcategoryChange={handleSubcategoryChange}
        onClose={handleClose}
      >
        {renderContent()}
      </Mobile>
    );
  }

  return (
    <Desktop
      activeCategory={activeCategory}
      activeSubcategory={activeSubcategory}
      onCategoryChange={handleCategoryChange}
      onSubcategoryChange={handleSubcategoryChange}
    >
      {renderContent()}
    </Desktop>
  );
}