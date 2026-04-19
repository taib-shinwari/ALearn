import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { settingsStore } from "@/components/settings/store";
import { DesktopSettings } from "@/components/settings/layout/DesktopSettings";
import { MobileSettings } from "@/components/settings/layout/MobileSettings";
import { ProfileSection } from "@/components/settings/sections/ProfileSection";
import { LanguageSection } from "@/components/settings/sections/LanguageSection";
import { CourseSection } from "@/components/settings/sections/CourseSection";
import { AboutSection } from "@/components/settings/sections/AboutSection";
import { getSubcategories } from "@/components/settings/constants";
import type { SettingsCategoryId } from "@/components/settings/types";

export default function SettingsPage() {
  const isMobile = useIsMobile();
  const [activeCategory, setActiveCategory] = useState<SettingsCategoryId>("profile");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>("account");

  // Toggle the global "settings is active" flag so the mobile top bar swaps
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
    switch (activeCategory) {
      case "profile":  return <ProfileSection activeSubcategory={activeSubcategory ?? "account"} />;
      case "language": return <LanguageSection />;
      case "course":   return <CourseSection />;
      case "about":    return <AboutSection />;
      default: return null;
    }
  };

  if (isMobile) {
    return (
      <MobileSettings
        activeCategory={activeCategory}
        activeSubcategory={activeSubcategory}
        onCategoryChange={handleCategoryChange}
        onSubcategoryChange={setActiveSubcategory}
      >
        {renderContent()}
      </MobileSettings>
    );
  }

  return (
    <DesktopSettings
      activeCategory={activeCategory}
      activeSubcategory={activeSubcategory}
      onCategoryChange={handleCategoryChange}
      onSubcategoryChange={setActiveSubcategory}
    >
      {renderContent()}
    </DesktopSettings>
  );
}
