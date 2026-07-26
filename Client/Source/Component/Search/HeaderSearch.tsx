// Source/Component/Search/HeaderSearch.tsx
import React, { useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";

interface HeaderSearchProps {
  placeholder?: string;
  className?: string;
}

export function HeaderSearch({
  placeholder = "Search...",
  className = "",
}: HeaderSearchProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("search") || "";
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      setSearchParams({ ...Object.fromEntries(searchParams), search: value });
    } else {
      searchParams.delete("search");
      setSearchParams(searchParams);
    }
  };

  const handleClear = () => {
    searchParams.delete("search");
    setSearchParams(searchParams);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative flex items-center w-full h-[40px] ${className}`}>
      {/* Search Icon */}
      <div className="absolute left-3 flex items-center pointer-events-none text-muted-foreground">
        <Search className="h-4 w-4" />
      </div>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full h-[40px] pl-9 pr-8 rounded-full border border-border/50 bg-background text-sm focus:outline-none focus:border-ring transition-colors"
      />

      {/* Clear Button */}
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 flex items-center justify-center p-0.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default HeaderSearch;