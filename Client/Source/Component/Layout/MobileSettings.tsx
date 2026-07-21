// @/Component/Header/MobileSettingsHeader.tsx
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { cn } from "@/Library/utils";
import { Button } from "@/Component/UI/Button";
import { Input } from "@/Component/UI/Input";
import { TitleBar } from "@/Component/UI/title-bar";
import { mobileSettingsStore } from "@/Component/Settings/mobileSettingsStore";

interface MobileSettingsHeaderProps {
  isVisible: boolean;
  isRtl: boolean;
  t: (k: string) => string;
  onBack: () => void;
  isSettingsSidebarOpen: boolean;
}

const customBtnSize = { width: "40px", height: "40px" };

export function MobileSettingsHeader({
  isVisible,
  isRtl,
  t,
  onBack,
  isSettingsSidebarOpen,
}: MobileSettingsHeaderProps) {
  const [mSettings, setMSettings] = useState(() => mobileSettingsStore.getState());
  const [settingsSearchActive, setSettingsSearchActive] = useState(false);
  const [settingsSearchValue, setSettingsSearchValue] = useState("");
  const settingsSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribeMode = mobileSettingsStore.subscribe(() => {
      const state = mobileSettingsStore.getState();
      setMSettings(state);
      setSettingsSearchActive(state.isSearchMode);
    });
    const unsubscribeSearch = mobileSettingsStore.subscribeSearch(() => {
      setSettingsSearchValue(mobileSettingsStore.getSearchQuery());
    });
    return () => {
      unsubscribeMode();
      unsubscribeSearch();
    };
  }, []);

  useEffect(() => {
    if (settingsSearchActive && settingsSearchInputRef.current) {
      settingsSearchInputRef.current.focus();
    }
    if (!settingsSearchActive) setSettingsSearchValue("");
  }, [settingsSearchActive]);

  useEffect(() => {
    if (!isSettingsSidebarOpen && settingsSearchActive) {
      mobileSettingsStore.exitSearchMode();
    }
  }, [isSettingsSidebarOpen, settingsSearchActive]);

  const handleSettingsSearchChange = (v: string) => {
    setSettingsSearchValue(v);
    mobileSettingsStore.setSearchQuery(v);
  };

  const exitSettingsSearch = () => {
    mobileSettingsStore.exitSearchMode();
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 bg-transparent isolate select-none px-4 md:px-6 py-2 flex flex-row items-center h-16 gap-x-2",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex items-center h-[40px] w-full gap-2">
        {settingsSearchActive ? (
          <>
            <Button
              size="icon"
              onClick={exitSettingsSearch}
              aria-label={t("Back") || "Back"}
              className="shrink-0 p-0"
              style={customBtnSize}
            >
              <ArrowLeft className={cn("h-5 w-5", isRtl && "rotate-180")} />
            </Button>
            <div className="flex-1 min-w-0">
              <Input
                ref={settingsSearchInputRef}
                placeholder="Search settings"
                value={settingsSearchValue}
                onChange={(e) => handleSettingsSearchChange(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </>
        ) : (
          <>
            <Button
              size="icon"
              onClick={onBack}
              aria-label={mSettings.showBack ? (t("Back") || "Back") : (t("Close") || "Close")}
              className="shrink-0 p-0"
              style={customBtnSize}
            >
              {mSettings.showBack ? (
                <ArrowLeft className={cn("h-5 w-5", isRtl && "rotate-180")} />
              ) : (
                <X className="h-5 w-5" />
              )}
            </Button>
            <TitleBar className="font-semibold text-lg truncate h-[40px] flex items-center leading-none">
              {mSettings.title}
            </TitleBar>
            <Button
              size="icon"
              aria-label={t("Search") || "Search"}
              onClick={() => {
                mobileSettingsStore.enterSearchMode(() => {
                  setSettingsSearchValue("");
                });
              }}
              className="ml-auto p-0 shrink-0"
              style={customBtnSize}
            >
              <Search className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}