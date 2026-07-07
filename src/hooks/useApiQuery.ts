import { useCallback, useEffect, useState } from "react";

export function useApiQuery<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(v => v + 1), []);

  useEffect(() => {
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
        setData(null);
        setError(err instanceof Error ? err.message : "Request failed");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tick, ...deps]);

  return { data, loading, error, refresh };
}
