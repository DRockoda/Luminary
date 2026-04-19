import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchQuote, type Quote } from "@/lib/zenquotes";

function QuoteCardSkeleton() {
  return (
    <div className="quote-card quote-card-skeleton">
      <div className="quote-card-skeleton-inner">
        <div className="skeleton-line skeleton-line-lg mx-auto" />
        <div className="skeleton-line skeleton-line-md mx-auto" />
        <div className="skeleton-line skeleton-line-sm mx-auto" />
      </div>
    </div>
  );
}

export function QuoteCard() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const loadQuote = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    const q = await fetchQuote();
    setQuote(q);
    setIsLoading(false);
    setIsRefreshing(false);
    setAnimKey((k) => k + 1);
  }, []);

  useEffect(() => {
    void loadQuote(false);
  }, [loadQuote]);

  if (isLoading) return <QuoteCardSkeleton />;

  return (
    <div className="quote-card">
      <div key={animKey} className="quote-card-inner">
        <span className="quote-mark" aria-hidden>
          &ldquo;
        </span>
        <blockquote className="quote-text">{quote?.q ?? "Keep going. Every day is a new page."}</blockquote>
        <p className="quote-author">— {quote?.a ?? "Unknown"}</p>
      </div>
      <button
        type="button"
        className={`quote-refresh-btn ${isRefreshing ? "is-spinning" : ""}`}
        onClick={() => void loadQuote(true)}
        title="Get a new quote"
        aria-label="Refresh quote"
        disabled={isRefreshing}
      >
        <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
