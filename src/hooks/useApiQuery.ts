import { useCallback, useEffect, useState } from "react";

export function useApiQuery<T>(loader: () => Promise<T>, deps: unknown[] = [], enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(v => v + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    loader()
      .then(result => {
        if (!alive) return;
        setData(result);
        setError(null);
      })
      .catch(err => {
        if (!alive) return;
        // Keep previous rows visible on refresh failure (avoid empty table flash).
        setError(err instanceof Error ? err.message : "Request failed");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [enabled, tick, ...deps]);

  return { data, setData, loading, error, refresh };
}
