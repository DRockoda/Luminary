import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function CalendarSearch({
  query,
  onChange,
}: {
  query: string;
  onChange: (next: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const expand = () => {
    setIsExpanded(true);
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  const collapse = () => {
    if (query) return;
    setIsExpanded(false);
  };

  const clear = () => {
    onChange("");
    setIsExpanded(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) clear();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded, query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !isExpanded && e.target === document.body) {
        e.preventDefault();
        expand();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isExpanded]);

  return (
    <div
      className={`calendar-search-wrapper ${isExpanded ? "is-expanded" : ""}`}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) collapse();
      }}
    >
      <button
        type="button"
        className="search-icon-btn"
        onClick={expand}
        aria-label="Search entries"
        title="Search (/)"
      >
        <Search size={15} />
      </button>

      <input
        ref={inputRef}
        type="text"
        placeholder="Search entries..."
        value={query}
        onChange={(e) => onChange(e.target.value)}
        className="search-input"
        aria-hidden={!isExpanded}
      />

      {query && (
        <button type="button" className="search-clear-btn" onClick={clear} aria-label="Clear search">
          <X size={12} />
        </button>
      )}
    </div>
  );
}

