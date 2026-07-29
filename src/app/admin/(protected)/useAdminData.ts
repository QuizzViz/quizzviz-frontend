'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Module-level cache: survives component unmount/remount across client-side
// navigation (there's no SWR/react-query in this app), and is only cleared
// by a full page reload. This is what makes revisiting a tab instant instead
// of re-showing a loading spinner for data that hasn't changed.
const cache = new Map<string, unknown>();
const lastUpdatedCache = new Map<string, number>();

export function invalidateAdminData(key: string) {
  cache.delete(key);
  lastUpdatedCache.delete(key);
}

export function useAdminData<T>(key: string, fetcher: () => Promise<T>) {
  const hasCached = cache.has(key);
  const [data, setDataState] = useState<T | undefined>(() => cache.get(key) as T | undefined);
  const [lastUpdated, setLastUpdated] = useState<number | null>(() => lastUpdatedCache.get(key) ?? null);
  const [isLoading, setIsLoading] = useState(!hasCached);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const setData = useCallback((value: T) => {
    const now = Date.now();
    cache.set(key, value);
    lastUpdatedCache.set(key, now);
    setDataState(value);
    setLastUpdated(now);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const run = useCallback(async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setData]);

  useEffect(() => {
    if (!cache.has(key)) {
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const refresh = useCallback(() => run({ silent: cache.has(key) }), [run, key]);

  return { data, isLoading, isRefreshing, error, refresh, setData, lastUpdated };
}
