import { useEffect, useState } from "react";
import { settingsStore } from "@/components/settings/store";
import { MobileSettings } from "@/components/settings/layout/MobileSettings";
import { ProfileSection } from "@/components/settings/sections/ProfileSection";
import { LanguageSection } from "@/components/settings/sections/LanguageSection";
import { DictionarySection } from "@/components/settings/sections/DictionarySection";
import { ThemeSection } from "@/components/settings/sections/ThemeSection";
import { ChessSection } from "@/components/settings/sections/ChessSection";

import { AccessibilitySection } from "@/components/settings/sections/AccessibilitySection";
import { getSubcategories } from "@/components/settings/constants";
import type { SettingsCategoryId } from "@/components/settings/types";

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
