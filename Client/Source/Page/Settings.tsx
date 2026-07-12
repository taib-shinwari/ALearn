import { useEffect, useState } from "react";
import { settingsStore } from "@/Component/Settings/store";
import { MobileSettings } from "@/Component/Settings/Layout/MobileSettings";
import { ProfileSection } from "@/Component/Settings/Section/ProfileSection";
import { LanguageSection } from "@/Component/Settings/Section/LanguageSection";
import { DictionarySection } from "@/Component/Settings/Section/DictionarySection";
import { ThemeSection } from "@/Component/Settings/Section/ThemeSection";
import { ChessSection } from "@/Component/Settings/Section/ChessSection";

import { AccessibilitySection } from "@/Component/Settings/Section/AccessibilitySection";
import { getSubcategories } from "@/Component/Settings/constants";
import type { SettingsCategoryId } from "@/Component/Settings/types";

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState<SettingsCategoryId>("profile");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>("account");

  useEffect(() => {
    settingsStore.setActive(true);
    return () => { settingsStore.setActive(false); };
  }, []);

  const handleCategoryChange = (cat: SettingsCategoryId) => {
    setActiveCategory(cat);
    const subs = getSubcategories(cat);
    setActiveSubcategory(subs[0]?.id ?? null);
  };

  const renderContent = () => {
    if (activeCategory === "profile" && activeSubcategory === "dictionary") {
      return <DictionarySection />;
    }
    switch (activeCategory) {
      case "profile":       return <ProfileSection activeSubcategory={activeSubcategory ?? "account"} />;
      case "language":      return <LanguageSection />;
      case "chess":         return <ChessSection />;
      case "theme":         return <ThemeSection />;

      case "accessibility": return <AccessibilitySection />;
      default: return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <MobileSettings
        activeCategory={activeCategory}
        activeSubcategory={activeSubcategory}
        onCategoryChange={handleCategoryChange}
        onSubcategoryChange={setActiveSubcategory}
      >
        {renderContent()}
      </MobileSettings>
    </div>
  );
}
