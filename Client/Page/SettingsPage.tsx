import { useEffect, useState } from "react";
import { settingsStore } from "Client/Component/Settings/store";
import { MobileSettings } from "Client/Component/Settings/Layout/MobileSettings";
import { ProfileSection } from "Client/Component/Settings/Section/ProfileSection";
import { LanguageSection } from "Client/Component/Settings/Section/LanguageSection";
import { DictionarySection } from "Client/Component/Settings/Section/DictionarySection";
import { ThemeSection } from "Client/Component/Settings/Section/ThemeSection";
import { ChessSection } from "Client/Component/Settings/Section/ChessSection";

import { AccessibilitySection } from "Client/Component/Settings/Section/AccessibilitySection";
import { getSubcategories } from "Client/Component/Settings/constants";
import type { SettingsCategoryId } from "Client/Component/Settings/types";

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
