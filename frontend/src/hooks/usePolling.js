import { useState, useEffect, useRef, useCallback } from 'react';

export function usePolling(fetchFn, intervalMs = 3000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  const poll = useCallback(async () => {
    try {
      const result = await fetchFn();
      if (mountedRef.current) {
        setData(result);
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
        setLoading(false);
      }
    }
  }, [fetchFn]);

  useEffect(() => {
    mountedRef.current = true;
    poll();
    timerRef.current = setInterval(poll, intervalMs);
    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
    };
  }, [poll, intervalMs]);

  return { data, error, loading, refetch: poll };
}

export function useHistory(maxLength = 30) {
  const [history, setHistory] = useState([]);

  const push = useCallback((entry) => {
    setHistory((prev) => {
      const next = [...prev, { ...entry, timestamp: Date.now() }];
      return next.length > maxLength ? next.slice(-maxLength) : next;
    });
  }, [maxLength]);

  const clear = useCallback(() => setHistory([]), []);

  return { history, push, clear };
}
