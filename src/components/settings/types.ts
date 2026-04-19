import { LucideIcon } from "lucide-react";

export type SettingsCategoryId = "profile" | "language" | "course" | "about";
export type ProfileSubId = "account" | "signout";
export type SubId = ProfileSubId | string;

export interface SettingsCategoryConfig {
  id: SettingsCategoryId;
  labelKey: string; // key into uiLabels OR raw fallback
  fallback: string;
  icon: LucideIcon;
  hasSubcategories: boolean;
}

export interface SettingsSubcategoryConfig {
  id: string;
  labelKey: string;
  fallback: string;
  icon: LucideIcon;
}
