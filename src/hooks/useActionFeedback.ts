import { useCallback, useRef, useState } from "react";

export function useActionFeedback(resetMs = 2000) {
  const [active, setActive] = useState(false);
  const timerRef = useRef<number>();

  const trigger = useCallback(() => {
    setActive(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setActive(false), resetMs);
  }, [resetMs]);

  return { active, trigger };
}
