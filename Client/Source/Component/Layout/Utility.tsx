// @/Component/Layout/Utility.tsx
import { useEffect, useRef, useState, ReactNode } from "react";
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
  disableHeaderContainer?: boolean;
  width?: string;                    
  height?: string;                   
  align?: "auto" | "left" | "right" | "center" | "top"; 
  closedIcon?: ReactNode; 
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
  disableHeaderContainer = false,
  width = "sm:w-72",               
  height = "sm:h-[288px]", 
  align = "auto",
  closedIcon
}: NavigatorLayoutProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [resolvedAlign, setResolvedAlign] = useState<"left" | "right" | "center" | "top">("left");

  const closeAll = () => {
    setIsOpen(false);
    setIsSearching(false);
    setSearchQuery("");
  };

  useEffect(() => {
    if (!isOpen) return;

    if (align !== "auto") {
      setResolvedAlign(align);
      return;
    }

    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const triggerCenter = rect.left + rect.width / 2;
      
      setResolvedAlign(triggerCenter < viewportWidth / 2 ? "left" : "right");
    }
  }, [isOpen, align]);

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

  const alignmentClasses = {
    left: "max-sm:origin-center sm:left-0 sm:origin-top-left",
    right: "max-sm:origin-center sm:right-0 sm:origin-top-right",
    center: "max-sm:origin-center sm:left-1/2 sm:-translate-x-1/2 sm:origin-top",
    top: "max-sm:origin-center sm:bottom-0 sm:left-0 sm:origin-bottom-left"
  };

  return (
    <div 
      ref={dropdownRef} 
      className={cn(
        "relative transition-all duration-300 ease-in-out select-none shrink-0",
        isOpen 
          ? cn("max-sm:fixed max-sm:inset-0 max-sm:z-[9999] max-sm:w-screen max-sm:h-screen sm:h-10", width) 
          : "w-10 h-10"
      )}
    >
      <div 
        className={cn(
          "origin-center bg-background text-foreground transition-all duration-300 ease-in-out border-2 border-border overflow-hidden",
          isOpen 
            ? cn("w-full h-full max-sm:rounded-none max-sm:border-0 max-sm:flex max-sm:flex-col sm:rounded-[32px] shadow-lg sm:absolute sm:top-0", height) 
            : "w-10 h-10 rounded-[20px] flex items-center justify-center cursor-pointer hover:bg-foreground hover:text-background",
          
          isOpen && alignmentClasses[resolvedAlign]
        )}
        onClick={() => { if (!isOpen) setIsOpen(true); }}
      >
        {/* CLOSED TRIGGER */}
        <div 
          className={cn(
            "w-10 h-10 shrink-0 flex items-center justify-center absolute inset-0 transition-opacity duration-200 ease-in-out",
            isOpen ? "opacity-0 pointer-events-none invisible" : "opacity-100 pointer-events-auto visible"
          )}
        >
          {closedIcon ? (
            <div className="h-5 w-5 flex items-center justify-center [&_svg]:h-5 [&_svg]:w-5">
              {closedIcon}
            </div>
          ) : (
            <ChevronDown className="h-5 w-5 opacity-60" />
          )}
        </div>

        {/* EXPANDED CONTENT */}
        <div 
          className={cn(
            "w-full h-full flex flex-col relative transition-all duration-300 ease-in-out origin-center",
            isOpen 
              ? "opacity-100 scale-100 pointer-events-auto visible" 
              : "opacity-0 scale-95 pointer-events-none invisible"
          )}
        >
          
          {/* BUTTONS GROUP — mobile */}
          <div className="hidden max-sm:flex items-center justify-between w-full h-14 pl-4 pr-6 shrink-0 absolute top-0 left-0 z-30 opacity-100">
            {!isSearching ? (
              <>
                <div className="flex items-center gap-2 max-w-[65%]">
                  {showGoBack && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-9 w-9 rounded-full shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onGoBack?.();
                      }}
                    >
                      <ArrowLeft className="h-[20px] w-[20px]" />
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
                    className="h-9 w-9 rounded-full"
                    onClick={() => setIsSearching(true)}
                  >
                    <Search className="h-[20px] w-[20px]" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeAll();
                    }}
                  >
                    <X className="h-[20px] w-[20px]" />
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
                    className="w-full bg-transparent text-xs font-normal outline-none placeholder:text-muted-foreground/60 h-full border-none focus:ring-0 p-0 pr-7"
                  />
                  {searchQuery && (
                    <Button
                      variant="default"
                      size="icon"
                      className="h-6 w-6 rounded-full shrink-0 absolute right-2"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </Container>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 rounded-full shrink-0"
                  onClick={() => {
                    setIsSearching(false);
                    setSearchQuery("");
                  }}
                >
                  <X className="h-[20px] w-[20px]" />
                </Button>
              </div>
            )}
          </div>

          {/* BUTTONS GROUP — desktop */}
          <div className="max-sm:hidden sm:flex items-center justify-between w-full h-12 px-3.5 absolute top-0 left-0 z-30 opacity-100">
            {!isSearching ? (
              <>
                <div className="flex items-center gap-1.5 max-w-[55%]">
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
                      <ArrowLeft className="h-[16px] w-[16px]" />
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
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSearching(true);
                    }}
                  >
                    <Search className="h-[16px] w-[16px] opacity-90" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeAll();
                    }}
                  >
                    <X className="h-[16px] w-[16px] opacity-80" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
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
                    <Button
                      variant="default"
                      size="icon"
                      className="h-5 w-5 rounded-full shrink-0 absolute right-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery("");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </Container>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-full shrink-0 mr-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSearching(false);
                    setSearchQuery("");
                  }}
                >
                  <X className="h-[16px] w-[16px]" />
                </Button>
              </div>
            )}
          </div>

          {/* SCROLL CONTAINER */}
          <div
            className={cn(
              "space-y-1.5 sm:space-y-0 max-sm:flex-1 max-sm:h-full overflow-y-auto max-sm:px-4 select-none pb-4 relative z-10 max-sm:rounded-none sm:rounded-[32px]",
              "max-sm:pt-14 sm:pt-14",
              "scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
              "max-sm:h-full",
              height
            )}
          >
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}