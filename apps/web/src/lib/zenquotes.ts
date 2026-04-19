export interface Quote {
  q: string;
  a: string;
}

const FALLBACK_QUOTES: Quote[] = [
  { q: "The secret of getting ahead is getting started.", a: "Mark Twain" },
  { q: "What we think, we become.", a: "Buddha" },
  { q: "It always seems impossible until it's done.", a: "Nelson Mandela" },
  { q: "In the middle of difficulty lies opportunity.", a: "Albert Einstein" },
  { q: "Your present moment will always have been.", a: "Unknown" },
];

function randomFallback(): Quote {
  return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]!;
}

export async function fetchQuote(): Promise<Quote> {
  try {
    const res = await fetch("/api/quotes/random");
    if (!res.ok) throw new Error("Failed to fetch");
    const data = (await res.json()) as { q?: string; a?: string; error?: string };
    if (typeof data.q === "string" && data.q.trim()) {
      return { q: data.q.trim(), a: typeof data.a === "string" && data.a.trim() ? data.a.trim() : "Unknown" };
    }
    throw new Error("Invalid payload");
  } catch {
    return randomFallback();
  }
}
