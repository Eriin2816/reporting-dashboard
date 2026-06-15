import { useState, useEffect, useCallback } from 'react';

export interface OfflineStatus {
  isOffline: boolean;
  /** Epoch ms of the last confirmed live data fetch, or null if never synced */
  lastSyncTime: number | null;
  /** Call this after every successful live data fetch */
  recordSync: (time?: number) => void;
}

const LS_KEY = 'dashpro_last_sync';

export function useOfflineStatus(onReconnect?: () => void): OfflineStatus {
  // Default ONLINE (false = not offline). Never read navigator.onLine
  // synchronously as the initial state — inside GHL iframes it returns false
  // during the first render even when the device is connected, causing a false
  // positive. A deferred check in useEffect is reliable once the iframe's
  // network context has initialised.
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(() => {
    const stored = localStorage.getItem(LS_KEY);
    return stored ? Number(stored) : null;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      onReconnect?.();
    };
    const handleOffline = () => setIsOffline(true);

    // Pure event-driven — never read navigator.onLine (unreliable in GHL iframes).
    // The 'offline' event fires when the device loses connectivity; 'online' when it returns.
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onReconnect]);

  // Also listen to SW messages for DATA_FRESH events
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'DATA_FRESH') {
        const t = e.data.time || Date.now();
        setLastSyncTime(t);
        localStorage.setItem(LS_KEY, String(t));
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  const recordSync = useCallback((time?: number) => {
    const t = time ?? Date.now();
    setLastSyncTime(t);
    localStorage.setItem(LS_KEY, String(t));
  }, []);

  return { isOffline, lastSyncTime, recordSync };
}
