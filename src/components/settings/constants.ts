import { User, Globe, BookOpen, Info, LogOut, Trash2, BookMarked, Palette, Accessibility } from "lucide-react";
import type { SettingsCategoryConfig, SettingsSubcategoryConfig } from "./types";

export const SETTINGS_CATEGORIES: SettingsCategoryConfig[] = [
  { id: "profile",       labelKey: "account",            fallback: "Account",        icon: User,           hasSubcategories: true },
  { id: "theme",         labelKey: "theme",              fallback: "Theme",          icon: Palette,        hasSubcategories: false },
  { id: "accessibility", labelKey: "accessibility",      fallback: "Accessibility",  icon: Accessibility,  hasSubcategories: false },
  { id: "language",      labelKey: "interfaceLanguage",  fallback: "Language",       icon: Globe,          hasSubcategories: false },
  { id: "course",        labelKey: "courseSettings",     fallback: "Course",         icon: BookOpen,       hasSubcategories: false },
  { id: "about",         labelKey: "about",              fallback: "About",          icon: Info,           hasSubcategories: false },
];

export const PROFILE_SUBCATEGORIES: SettingsSubcategoryConfig[] = [
  { id: "account",    labelKey: "profile",       fallback: "Profile",        icon: User },
  { id: "dictionary", labelKey: "dictionary",    fallback: "Dictionary",     icon: BookMarked },
  { id: "signout",    labelKey: "signOut",       fallback: "Sign out",       icon: LogOut },
  { id: "delete",     labelKey: "deleteAccount", fallback: "Delete account", icon: Trash2 },
];

export function getSubcategories(catId: string): SettingsSubcategoryConfig[] {
  if (catId === "profile") return PROFILE_SUBCATEGORIES;
  return [];
}
