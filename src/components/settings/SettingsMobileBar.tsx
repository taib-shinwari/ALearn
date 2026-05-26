import { ReactNode, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TitleBar } from "@/components/ui/title-bar";
import { Input } from "@/components/ui/input";
import { settingsStore } from "./store";

interface State {
  active: boolean;
  title: string;
  showBack: boolean;
  goBack: (() => void) | null;
  searchQuery: string;
}

interface Props {
  settingsBar: State;
  conceptPrefix: string;
  navigate: (to: string) => void;
  t: (k: string) => string;
  uiLang: string;
  children: ReactNode;
}

/** Mobile top bar swap when on /settings.
 *  Title is in a content-sized TitleBar.
 *  Search starts collapsed as a button; clicking expands it inline.
 *  When the title isn't meaningful (root settings home with no back), it hides. */
export function SettingsMobileBar({
  settingsBar, conceptPrefix, navigate, t, uiLang, children,
}: Props) {
  const [searchExpanded, setSearchExpanded] = useState(false);

  const showTitleBar = settingsBar.showBack; // hide on root settings view

  return (
    <div className="min-h-screen pb-8" dir={uiLang === "ar" ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 p-4">
        <Button
          size="icon"
          onClick={() => settingsBar.showBack ? settingsBar.goBack?.() : navigate(conceptPrefix)}
          aria-label={t("back")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {showTitleBar && !searchExpanded && (
          <TitleBar className="font-semibold">{settingsBar.title}</TitleBar>
        )}

        <div className="flex-1" />

        {searchExpanded ? (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60 pointer-events-none" />
            <Input
              autoFocus
              value={settingsBar.searchQuery}
              onChange={e => settingsStore.setSearchQuery(e.target.value)}
              onBlur={() => { if (!settingsBar.searchQuery) setSearchExpanded(false); }}
              placeholder={t("searchSettings")}
              className="pl-9 pr-9 rounded-full border-2 border-border w-full"
            />
            <button
              onClick={() => { settingsStore.setSearchQuery(""); setSearchExpanded(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="Clear"
            >
              <X className="h-4 w-4 opacity-60" />
            </button>
          </div>
        ) : (
          <Button size="icon" aria-label={t("search")} onClick={() => setSearchExpanded(true)}>
            <Search className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div>{children}</div>
    </div>
  );
}
