// @/Component/Layout/Utility.tsx
import { useEffect, useRef, ReactNode } from "react";
import { ChevronDown, Search, X, ArrowLeft } from "lucide-react";
import { Button } from "@/Component/UI/Button";
import { Container } from "@/Component/UI/container";
import { cn } from "@/Library/utils";

export function idFromName(name: string): string {
  return name.replace(/\s+/g, "-");
}

export function nameFromId(id: string): string {
  return id.replace(/-/g, " ");
}

interface NavigatorLayoutProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  buttonLabel: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  renderMobileHeaderLeft: () => ReactNode;
  renderDesktopHeaderLeft: () => ReactNode;
  showGoBack?: boolean;
  onGoBack?: () => void;
  children: ReactNode;
  customTrigger?: ReactNode;
  disableHeaderContainer?: boolean; // Skip the wrapping Container component
  width?: string;                    // Custom desktop width class (e.g., "sm:w-[400px]")
  height?: string;                   // Custom desktop scroll max-height class (e.g., "sm:max-h-[500px]")
}

export function NavigatorLayout({
  isOpen,
  setIsOpen,
  isSearching,
  setIsSearching,
  searchQuery,
  setSearchQuery,
  buttonLabel,
  inputRef,
  renderMobileHeaderLeft,
  renderDesktopHeaderLeft,
  showGoBack = false,
  onGoBack,
  children,
  customTrigger,
  disableHeaderContainer = false,
  width = "sm:w-72",               // Default fallback width matching the closed trigger
  height = "sm:max-h-[288px]",     // Default fallback scroll height
}: NavigatorLayoutProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeAll = () => {
    setIsOpen(false);
    setIsSearching(false);
    setSearchQuery("");
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
    } else {
      document.body.style.overflow = "";
      document.body.style.height = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth >= 640 && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeAll();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isSearching) {
      inputRef?.current?.focus();
    }
  }, [isSearching, inputRef]);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left w-full sm:w-auto">

      {/* TRIGGER BUTTON */}
      <div
        onClick={() => { if (!isOpen) setIsOpen(true); }}
        className={cn(
          "transition-all duration-200 shadow-none select-none inline-flex items-center justify-center text-foreground cursor-pointer text-sm font-medium",
          isOpen
            ? cn("max-sm:hidden px-2 cursor-default rounded-t-[40px] rounded-b-none border border-border/30 border-b-transparent z-0 justify-between bg-[#fafafa] dark:bg-zinc-900 h-8 sm:h-9", width)
            : customTrigger
              ? "rounded-[40px] bg-background border border-border hover:bg-muted/60 p-2 gap-2"
              : "w-auto max-w-[150px] sm:max-w-[250px] px-3.5 h-8 sm:h-9 rounded-[40px] bg-[#fafafa] dark:bg-zinc-900 border border-border/30 hover:bg-accent justify-between"
        )}
      >
        {customTrigger ? customTrigger : (
          <>
            <span className="truncate mr-1">{buttonLabel}</span>
            <ChevronDown className="h-5 w-5 opacity-60 shrink-0 mx-1" />
          </>
        )}
      </div>

      {isOpen && (
        // PAGE — the main container. Everything else lives inside this.
        <div className={cn(
          "max-sm:fixed max-sm:inset-0 max-sm:w-screen max-sm:h-[100dvh] max-sm:bg-background max-sm:z-[9999] max-sm:flex max-sm:flex-col sm:absolute sm:top-0 sm:left-0 sm:z-50",
          width
        )}>

          <div className="bg-background text-foreground w-full max-sm:rounded-none max-sm:border-0 max-sm:flex-1 max-sm:flex max-sm:flex-col sm:rounded-[32px] sm:border sm:border-border/30 overflow-visible relative [.high-contrast_&]:border-black">

            {/* BUTTONS GROUP — mobile. */}
            <div className="hidden max-sm:flex items-center justify-between w-full h-14 pl-4 pr-6 shrink-0 absolute top-0 left-0 z-30 opacity-100">
              {!isSearching ? (
                <>
                  <div className="flex items-center gap-2 max-w-[65%]">
                    {showGoBack && (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGoBack?.();
                        }}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    )}
                    {disableHeaderContainer ? (
                      renderMobileHeaderLeft()
                    ) : (
                      <Container className="flex items-center justify-center text-center max-w-full h-8 !py-0 px-4">
                        {renderMobileHeaderLeft()}
                      </Container>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setIsSearching(true)}
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={closeAll}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between w-full gap-2">
                  <Container className="flex items-center flex-1 h-9 px-3 min-w-0 rounded-full relative shadow-md">
                    <Search className="h-5 w-5 text-muted-foreground shrink-0 mr-2" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Search entries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-xs font-normal outline-none placeholder:text-muted-foreground/60 h-full border-none focus:ring-0 p-0 pr-6"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="absolute right-3 p-1 rounded-full shrink-0 text-muted-foreground hover:text-foreground active:scale-95 transition-all focus:outline-none"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </Container>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full shrink-0"
                    onClick={() => {
                      setIsSearching(false);
                      setSearchQuery("");
                    }}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* BUTTONS GROUP — desktop. */}
            <div className="max-sm:hidden sm:flex items-center justify-between w-full h-11 px-3 absolute top-0 left-0 z-30 opacity-100">
              {!isSearching ? (
                <>
                  <div className="flex items-center gap-1.5 max-w-[55%] ml-1">
                    {showGoBack && (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 rounded-full shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGoBack?.();
                        }}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    )}
                    {disableHeaderContainer ? (
                      renderDesktopHeaderLeft()
                    ) : (
                      <Container className="flex items-center justify-center text-center max-w-full h-7 !py-0 px-3">
                        {renderDesktopHeaderLeft()}
                      </Container>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mr-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded-full shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSearching(true);
                      }}
                    >
                      <Search className="h-4 w-4 opacity-90" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded-full shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeAll();
                      }}
                    >
                      <ChevronDown className="h-4 w-4 opacity-80 transition-transform duration-200 rotate-180" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between w-full mx-1">
                  <Container className="!py-0.5 !px-2 flex items-center flex-1 min-w-0 mr-1.5 h-7 relative shadow-sm">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-1.5" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Search entries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-xs font-normal outline-none placeholder:text-muted-foreground/60 h-full border-none focus:ring-0 p-0 pr-6"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="absolute right-2 p-0.5 rounded-full shrink-0 text-muted-foreground hover:text-foreground active:scale-95 transition-all focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchQuery("");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Container>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 rounded-full shrink-0 mr-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSearching(false);
                      setSearchQuery("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* SCROLL CONTAINER */}
            <div
              className={cn(
                "space-y-1.5 sm:space-y-0 max-sm:flex-1 max-sm:h-full overflow-y-auto max-sm:px-4 select-none pb-4 relative z-10 max-sm:rounded-none sm:rounded-[32px]",
                "max-sm:pt-14 sm:pt-11",
                "scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
                height
              )}
            >
              {children}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}