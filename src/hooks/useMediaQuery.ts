import { useEffect, useState } from "react";

/** Matches Tailwind `lg` — sidebar stays desktop-only below this. */
export const LG_BREAKPOINT = 1024;
/** Matches Tailwind `md` — table↔card switch. */
export const MD_BREAKPOINT = 768;

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export function useIsDesktopNav() {
  return useMediaQuery(`(min-width: ${LG_BREAKPOINT}px)`);
}
