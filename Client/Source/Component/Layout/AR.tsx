import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Clock, Play, Trash2, Layers } from "lucide-react";
import { useApp } from "@/Context/App";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { NavigatorLayout } from "@/Component/Layout/Utility";
import { Button } from "@/Component/UI/Button";
import { Container } from "@/Component/UI/container";
import { SlidingPill } from "@/Component/UI/Sliding-Pill";

type TabMode = "active" | "recall";

export function RecallQueueButton() {
  const navigate = useNavigate();
  const { t } = useCourseLanguage();
  const { 
    recallQueue = [], 
    removeRecallItem, 
    setActiveRecall, 
    browsePath, 
    setRecallReturnPath 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState<TabMode>("recall");
  const [hasSeenNotification, setHasSeenNotification] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [isOpen]);

  const now = Date.now();
  
  const isReadyItem = (item: any) => {
    if (typeof item.readyAt !== "number") return false;
    return now >= item.readyAt;
  };

  const activeItems = recallQueue.filter((i) => !isReadyItem(i)).sort((a, b) => a.readyAt - b.readyAt);
  const readyItems = recallQueue.filter((i) => isReadyItem(i)).sort((a, b) => a.readyAt - b.readyAt);
  const hasReady = readyItems.length > 0;
  const hasActive = activeItems.length > 0;

  // Set notification as seen when the layout panel gets opened
  useEffect(() => {
    if (isOpen) {
      setHasSeenNotification(true);
    }
  }, [isOpen]);

  // If the user clears their queue, reset tracking so future items trigger a new notification
  useEffect(() => {
    if (!hasReady) {
      setHasSeenNotification(false);
    }
  }, [hasReady]);

  useEffect(() => {
    if (isOpen) {
      if (readyItems.length > 0) {
        setMode("recall");
      } else if (activeItems.length > 0) {
        setMode("active");
      }
    }
  }, [isOpen, readyItems.length, activeItems.length]);

  const targetSource = mode === "active" ? activeItems : readyItems;

  const filteredItems = targetSource.filter((item) =>
    !searchQuery || item.title?.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleOpenItem = (item: any) => {
    setIsOpen(false);
    setIsSearching(false);
    setSearchQuery("");
    setRecallReturnPath(browsePath);
    setActiveRecall({
      scope: item.scope,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId,
      wordId: item.wordId,
    });
    navigate("/Recall");
  };

  const formatCountdown = (targetTime: number) => {
    const diff = targetTime - Date.now();
    if (diff <= 0) return "Ready";
    const mins = Math.ceil(diff / 60_000);
    if (mins < 60) return `${mins}m left`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h left`;
    return `${Math.floor(hrs / 24)}d left`;
  };

  const pillOptions = [
    { value: "active" as TabMode, label: "", icon: <Clock className="h-4 w-4 stroke-[2.5]" /> },
    { value: "recall" as TabMode, label: "", icon: <Brain className="h-4 w-4 stroke-[2.5]" /> }
  ];

  const renderSlidingPill = () => {
    const containerClasses = "flex items-center justify-center h-7 w-9 rounded-full bg-muted border border-border/40 text-muted-foreground/80 !py-0 !px-0";

    if (!hasActive) {
      return (
        <Container className={containerClasses}>
          <Brain className="h-4 w-4 stroke-[2.5]" />
        </Container>
      );
    }
    if (!hasReady) {
      return (
        <Container className={containerClasses}>
          <Clock className="h-4 w-4 stroke-[2.5]" />
        </Container>
      );
    }
    return (
      <SlidingPill
        options={pillOptions}
        selectedValue={mode}
        onChange={setMode}
        width="w-20"
        height="h-7"
      />
    );
  };

  const showNotificationBadge = hasReady && !hasSeenNotification;

  return (
    <NavigatorLayout
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      isSearching={isSearching}
      setIsSearching={setIsSearching}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      inputRef={inputRef}
      buttonLabel=""
      renderMobileHeaderLeft={renderSlidingPill}
      renderDesktopHeaderLeft={renderSlidingPill}
      showGoBack={false}
      disableHeaderContainer={true}
      customTrigger={
        <div className="relative flex items-center justify-center h-full w-full">
          <Layers className="h-5 w-5" />
          {showNotificationBadge && (
  <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-foreground text-background flex items-center justify-center ring-2 ring-background">
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round" 
      className="h-2.5 w-2.5"
    >
      <line x1="12" y1="5" x2="12" y2="14" />
      <line x1="12" y1="19" x2="12" y2="19" />
    </svg>
  </span>
)}
        </div>
      }
    >
      <div className="flex flex-col gap-1.5 px-3 pt-2 sm:p-2 w-full relative">
        {filteredItems.map((item) => (
          <div 
            key={item.id} 
            className="flex items-center justify-between gap-2 p-2 pl-4 pr-3 rounded-full hover:bg-muted/40 border border-transparent transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Clock className="h-3 w-3 opacity-70" />
                <span>{mode === "recall" ? "Ready" : formatCountdown(item.readyAt)}</span>
                <span className="opacity-40">·</span>
                <span className="opacity-80">★ {item.lastRating ?? 0}</span>
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {mode === "recall" && (
                <Button 
                  size="icon" 
                  variant="secondary"
                  className="h-8 w-8 rounded-full bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => handleOpenItem(item)}
                  aria-label={t("startRecall") || "Start recall"}
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                </Button>
              )}
              <Button 
                size="icon" 
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                onClick={() => removeRecallItem(item.id)}
                aria-label={t("deleteItem") || "Delete"}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <p className="text-xs text-muted-foreground p-8 text-center">
            {mode === "active" 
              ? (t("noActive") || "Nothing cooling down.") 
              : (t("noReady") || "Nothing to recall yet.")}
          </p>
        )}
      </div>
    </NavigatorLayout>
  );
}