import { User, Globe, Languages, LogOut, Trash2, BookMarked, Palette, Accessibility } from "lucide-react";
import type { SettingsCategoryConfig, SettingsSubcategoryConfig } from "./types";

export const SETTINGS_CATEGORIES: SettingsCategoryConfig[] = [
  { id: "profile",       labelKey: "account",            fallback: "Account",            icon: User,           hasSubcategories: true },
  { id: "course",        labelKey: "language",           fallback: "Language",           icon: Languages,      hasSubcategories: false },
  { id: "language",      labelKey: "interfaceLanguage",  fallback: "Interface Language", icon: Globe,          hasSubcategories: false },
  { id: "theme",         labelKey: "theme",              fallback: "Theme",              icon: Palette,        hasSubcategories: false },
  { id: "accessibility", labelKey: "accessibility",      fallback: "Accessibility",      icon: Accessibility,  hasSubcategories: false },
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
