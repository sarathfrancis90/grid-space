import { useState, useEffect } from "react";

/**
 * Returns true when the given CSS media query matches.
 * Updates reactively on viewport resize.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** Shorthand: true when viewport width < 768px */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
